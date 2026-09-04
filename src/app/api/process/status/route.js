import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';

export async function GET(req) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get('examId');

  if (!examId) {
    return Response.json({ error: 'Missing required field: examId' }, { status: 400 });
  }

  const supabase = supabaseServer();

  // Verify the teacher owns this exam
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id')
    .eq('id', examId)
    .eq('teacher_id', user.id)
    .single();

  if (examError || !exam) {
    return Response.json({ error: 'Exam not found or access denied' }, { status: 404 });
  }

  // Pull just the status column for every student in this exam
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('status')
    .eq('exam_id', examId);

  if (studentsError) {
    return Response.json({ error: `Failed to fetch students: ${studentsError.message}` }, { status: 500 });
  }

  const counts = { pending: 0, processing: 0, graded: 0, review: 0, manually_graded: 0, error: 0 };
  for (const s of students) {
    if (counts[s.status] !== undefined) counts[s.status]++;
  }
  const total = students.length;
  const completedCount = counts.graded + counts.manually_graded + counts.review;
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  return Response.json({
    total,
    pending: counts.pending,
    processing: counts.processing,
    graded: counts.graded,
    review: counts.review,
    manually_graded: counts.manually_graded,
    error: counts.error,
    progressPercent,
  });
}
