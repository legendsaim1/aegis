import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { getExamTotalMarks, getGradableQuestions } from '@/lib/utils/examTotals';
import { createLogger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const reqId = `req-${Math.random().toString(36).substring(2, 9)}`;
  const log = createLogger('ResultsAPI', reqId);

  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const examId = resolvedParams?.examId;
    if (!examId) {
      return Response.json({ error: 'Missing examId' }, { status: 400 });
    }

    const supabase = supabaseServer();

    // 1. Verify Exam Ownership & get settings
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('id, total_marks, passing_percentage')
      .eq('id', examId)
      .eq('teacher_id', user.id)
      .single();

    if (examError || !examData) {
      return Response.json({ error: 'Exam not found or access denied' }, { status: 404 });
    }

    const passThreshold = (examData.passing_percentage !== undefined && examData.passing_percentage !== null)
      ? Number(examData.passing_percentage)
      : 50;

    // 2. Fetch Students, Copy Flags, and Questions concurrently
    const [studentsRes, copyFlagsRes, questionsRes] = await Promise.all([
      supabase
        .from('students')
        .select('*')
        .eq('exam_id', examId)
        .in('status', ['graded', 'error', 'manually_graded'])
        .order('roll_number', { ascending: true }),
      supabase
        .from('copy_flags')
        .select('student_a_id, student_b_id')
        .eq('exam_id', examId)
        .eq('confirmed', true),
      supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('question_number', { ascending: true })
        .order('sub_part', { ascending: true })
    ]);

    if (studentsRes.error) throw studentsRes.error;
    if (questionsRes.error) throw questionsRes.error;

    const students = studentsRes.data || [];
    const copyFlagsData = copyFlagsRes.data || [];
    const allQuestions = questionsRes.data || [];

    const copiedStudentIds = new Set();
    copyFlagsData.forEach(f => {
      copiedStudentIds.add(f.student_a_id);
      copiedStudentIds.add(f.student_b_id);
    });

    const studentIds = students.map(s => s.id);
    let answersData = [];
    if (studentIds.length > 0) {
      const { data: answers, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .in('student_id', studentIds);

      if (answersError) throw answersError;
      answersData = answers || [];
    }

    const gradableQuestions = getGradableQuestions(allQuestions);
    const examTotalMarks = getExamTotalMarks(allQuestions, examData);

    // 3. Assemble Students Matrix
    const formatted = students.map(student => {
      const studentAnswers = answersData.filter(a => a.student_id === student.id);

      let needsReviewOverall = false;
      const breakdown = gradableQuestions.map(q => {
        const ans = studentAnswers.find(a => a.question_id === q.id);
        const needsRev = ans ? ans.needs_review : false;
        if (needsRev) needsReviewOverall = true;

        const obtained = ans?.obtained_marks !== null && ans?.obtained_marks !== undefined
          ? ans.obtained_marks
          : '-';

        const label = `Q${q.question_number}${q.sub_part ? `(${q.sub_part})` : ''}`;

        return {
          qId: ans?.id || q.id,
          qNum: q.question_number,
          subPart: q.sub_part || null,
          label,
          score: `${obtained}/${q.max_marks}`,
          confidence: ans?.grading_confidence_score ?? 0,
          confid: ans?.grading_confidence_score != null ? Math.round(ans.grading_confidence_score * 100) : null,
          feedback: ans?.ai_feedback || '',
          reviewReason: ans?.flag_reason || '',
          reason: ans?.flag_reason || '',
          needsReview: needsRev,
          studentAnswer: ans?.extracted_text || '',
          modelAnswer: q.model_answer || '',
          rubric: q.rubric || '',
          rawAns: ans
        };
      });

      const isCopied = copiedStudentIds.has(student.id);
      const isManuallyGraded = student.status === 'manually_graded';
      const finalConfid = student.overall_grade_confidence != null ? Math.round(student.overall_grade_confidence * 100) : null;
      const totalScore = student.total_obtained_marks != null ? student.total_obtained_marks : (student.total_score || 0);

      return {
        id: student.id,
        name: student.student_name,
        roll: student.roll_number,
        score: totalScore,
        maxScore: examTotalMarks,
        totalPossible: examTotalMarks,
        confid: finalConfid,
        confidence: student.overall_grade_confidence ?? 0,
        flag: isCopied || needsReviewOverall,
        isCopied,
        needsReview: needsReviewOverall,
        isManuallyGraded,
        breakdown
      };
    });

    return Response.json({
      passThreshold,
      students: formatted
    });

  } catch (error) {
    log.error('Error in GET /api/results/[examId]:', { error: error?.message || error });
    return Response.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
