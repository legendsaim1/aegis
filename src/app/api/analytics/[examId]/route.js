import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { getExamTotalMarks } from '@/lib/utils/examTotals';
import { runTopicRecommendations } from '@/lib/analytics/recommendations';
import { calculateTopicStats } from '@/lib/analytics/topicStats';
import { createLogger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const reqId = `req-${Math.random().toString(36).substring(2, 9)}`;
  const log = createLogger('AnalyticsAPI', reqId);
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const examId = params.examId;

  const supabase = supabaseServer();

  // 1. Fetch the heavy datasets concurrently (Exams, Questions, Answers)
  const [examRes, questionsRes, answersRes] = await Promise.all([
    supabase
      .from('exams')
      .select('id, total_marks, passing_percentage, ai_topic_insights')
      .eq('id', examId)
      .eq('teacher_id', user.id)
      .single(),
    supabase
      .from('questions')
      .select('id, question_number, sub_part, max_marks, question_text')
      .eq('exam_id', examId)
      .order('question_number', { ascending: true }),
    supabase
      .from('answers')
      .select('question_id, obtained_marks, students!inner(exam_id, status)')
      .eq('students.exam_id', examId)
      .in('students.status', ['graded', 'manually_graded'])
  ]);

  const { data: exam, error: examError } = examRes;
  const { data: questions } = questionsRes;
  const { data: answersData } = answersRes;

  if (examError || !exam) {
    return Response.json({ error: 'Exam not found or access denied' }, { status: 404 });
  }

  // 2. Calculate actual max marks for the passing thresholds
  const examTotalMarks = getExamTotalMarks(questions || [], exam);
  const passPct = (exam.passing_percentage !== undefined && exam.passing_percentage !== null) ? exam.passing_percentage : 50;
  const passingThreshold = examTotalMarks * (passPct / 100);

  // 3. Fetch students to calculate analytics instead of using RPC
  const { data: studentsData, error: studentsError } = await supabase
    .from('students')
    .select('total_obtained_marks')
    .eq('exam_id', examId)
    .in('status', ['graded', 'manually_graded']);

  if (studentsError) {
    log.error('Students Query Error:', studentsError);
    return Response.json({ error: 'Failed to aggregate statistics' }, { status: 500 });
  }

  const students = studentsData || [];
  const totalStudents = students.length;

  const statsData = {
    total_students: totalStudents,
    average_score: 0,
    highest_score: 0,
    lowest_score: 0,
    pass_count: 0,
    fail_count: 0,
    distribution_buckets: {
      '0-20%': 0,
      '21-40%': 0,
      '41-60%': 0,
      '61-80%': 0,
      '81-100%': 0
    }
  };

  if (totalStudents > 0) {
    let sumScore = 0;
    let highestScore = -Infinity;
    let lowestScore = Infinity;

    students.forEach(s => {
      const score = Number(s.total_obtained_marks) || 0;
      sumScore += score;
      if (score > highestScore) highestScore = score;
      if (score < lowestScore) lowestScore = score;

      if (score >= passingThreshold) {
        statsData.pass_count++;
      } else {
        statsData.fail_count++;
      }

      const pct = examTotalMarks > 0 ? (score / examTotalMarks) * 100 : 0;
      if (pct <= 20) statsData.distribution_buckets['0-20%']++;
      else if (pct <= 40) statsData.distribution_buckets['21-40%']++;
      else if (pct <= 60) statsData.distribution_buckets['41-60%']++;
      else if (pct <= 80) statsData.distribution_buckets['61-80%']++;
      else statsData.distribution_buckets['81-100%']++;
    });

    statsData.average_score = Number((sumScore / totalStudents).toFixed(1));
    statsData.highest_score = highestScore;
    statsData.lowest_score = lowestScore;
  }
  
  if (totalStudents === 0) {
    // Return empty but valid structure if no one is graded yet
    return Response.json({
      totalStudents: 0,
      examTotalMarks,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passCount: 0,
      failCount: 0,
      passFail: [],
      scoreDistribution: []
    });
  }

  // Format arrays for Recharts
  const passFail = [
    { name: 'Pass', value: statsData.pass_count || 0 },
    { name: 'Fail', value: statsData.fail_count || 0 }
  ];

  const scoreDistribution = Object.keys(statsData.distribution_buckets).map(key => ({
    range: key,
    count: statsData.distribution_buckets[key]
  }));

  const answers = answersData || [];
  const liveTopicStats = calculateTopicStats(questions || [], answers);

  // 5. Return formatted JSON response
  const responseObj = {
    totalStudents,
    examTotalMarks,
    averageScore: statsData.average_score,
    highestScore: statsData.highest_score,
    lowestScore: statsData.lowest_score,
    passCount: statsData.pass_count,
    failCount: statsData.fail_count,
    passFail,
    scoreDistribution,
    topicStats: liveTopicStats,
    hasCachedInsights: !!exam.ai_topic_insights
  };
  
  // If we already have cached insights, automatically attach them to the base response
  if (exam.ai_topic_insights) {
    // We already have live topicStats, so we only need recommendations from cache
    responseObj.recommendations = exam.ai_topic_insights.recommendations || [];
  }
  
  const url = new URL(req.url);
  const includeRecommendations = url.searchParams.get('include') === 'recommendations';
  const forceRegenerate = url.searchParams.get('forceRegenerate') === 'true';
  
  // Only trigger AI generation if explicitly requested AND (cache miss OR forced)
  if (includeRecommendations && (!exam.ai_topic_insights || forceRegenerate)) {
    try {
      const recs = await runTopicRecommendations(examId);
      responseObj.topicStats = recs.topicStats;
      responseObj.recommendations = recs.recommendations;
      
      // Save to DB asynchronously with teacher_id scoping
      await supabase
        .from('exams')
        .update({ ai_topic_insights: recs })
        .eq('id', examId)
        .eq('teacher_id', user.id);
        
    } catch (error) {
      log.error('Failed to run topic recommendations:', { examId, error: error.message });
      // If force regen fails, we fallback to empty (or we could fallback to cache)
      responseObj.recommendations = [];
    }
  }

  return Response.json(responseObj);
}

// POST endpoint to generate AI Insights based on the stats
export async function POST(req, { params }) {
  const reqId = `req-${Math.random().toString(36).substring(2, 9)}`;
  const log = createLogger('AnalyticsAPI', reqId);
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const examId = params.examId;
  if (!examId) {
    return Response.json({ error: 'Missing examId' }, { status: 400 });
  }

  const supabase = supabaseServer();

  // 1. Verify exam ownership before executing AI generation
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id')
    .eq('id', examId)
    .eq('teacher_id', user.id)
    .single();

  if (examError || !exam) {
    return Response.json({ error: 'Exam not found or access denied' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const { statsPayload } = body;

  if (!statsPayload) {
    return Response.json({ error: 'Missing stats payload' }, { status: 400 });
  }

  try {
    const recs = await runTopicRecommendations(examId);
    // Cache result to DB with teacher_id scoping so subsequent GET requests return instantly
    await supabase
      .from('exams')
      .update({ ai_topic_insights: recs })
      .eq('id', examId)
      .eq('teacher_id', user.id);

    return Response.json({
      success: true,
      recommendations: recs.recommendations || [],
      topicStats: recs.topicStats || []
    });
  } catch (error) {
    log.error('Insights Generation Error:', { examId, error: error.message });
    return Response.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}