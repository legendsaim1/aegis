import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { createLogger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const reqId = `req-${Math.random().toString(36).substring(2, 9)}`;
  const log = createLogger('DashboardAPI', reqId);
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseServer();

    // 1. Fetch teacher profile, recent exams, and aggregated stats concurrently
    const [teacherRes, examsRes, rpcRes] = await Promise.all([
      supabase
        .from('teachers')
        .select('full_name')
        .eq('id', user.id)
        .single(),
      supabase
        .from('exams')
        .select('id, title, class_grade, created_at')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.rpc('get_teacher_dashboard_stats', { p_teacher_id: user.id })
    ]);

    const teacherName = teacherRes.data?.full_name ? teacherRes.data.full_name.split(' ')[0] : 'Teacher';
    const recentExams = examsRes.data || [];

    let totalExams = 0;
    let gradedPapersCount = 0;
    let globalAverageScore = 0;
    let pendingReviewCount = 0;

    if (!rpcRes.error && rpcRes.data) {
      const stats = rpcRes.data;
      totalExams = Number(stats.total_exams) || 0;
      gradedPapersCount = Number(stats.graded_papers) || 0;
      globalAverageScore = Number(stats.avg_confidence) || 0;
      pendingReviewCount = Number(stats.pending_reviews) || 0;
    } else {
      // Fallback query if RPC migration is not applied yet
      const { count: examCount } = await supabase
        .from('exams')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', user.id);

      totalExams = examCount || recentExams.length;

      const { data: allExams } = await supabase
        .from('exams')
        .select('id')
        .eq('teacher_id', user.id);

      const examIds = allExams?.map(e => e.id) || [];

      if (examIds.length > 0) {
        const [studentsResult, reviewsResult] = await Promise.all([
          supabase
            .from('students')
            .select('id, status, overall_grade_confidence')
            .in('exam_id', examIds),
          supabase
            .from('answers')
            .select('id, students!inner(exam_id)', { count: 'exact', head: true })
            .eq('needs_review', true)
            .in('students.exam_id', examIds)
        ]);

        const students = studentsResult.data || [];
        pendingReviewCount = reviewsResult.count || 0;

        const gradedStudents = students.filter(s => s.status === 'graded' || s.status === 'manually_graded');
        gradedPapersCount = gradedStudents.length;

        let totalConfidence = 0;
        let validConfidenceCount = 0;
        gradedStudents.forEach(s => {
          if (s.overall_grade_confidence != null) {
            totalConfidence += s.overall_grade_confidence;
            validConfidenceCount++;
          }
        });

        if (validConfidenceCount > 0) {
          globalAverageScore = Math.round((totalConfidence / validConfidenceCount) * 100);
        }
      }
    }

    return NextResponse.json({
      success: true,
      teacherName,
      stats: {
        totalExams,
        gradedPapers: gradedPapersCount,
        aiConfidenceScore: `${globalAverageScore}%`,
        pendingReview: pendingReviewCount
      },
      recentExams: recentExams.map(e => ({
        id: e.id,
        name: e.title || 'Untitled Exam',
        class: e.class_grade || 'N/A',
        date: new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'View Details'
      }))
    });

  } catch (error) {
    log.error(`Dashboard API Error`, { error: error.message, stack: error.stack });
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
