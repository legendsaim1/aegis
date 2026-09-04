import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';

export async function GET(req, { params }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const examId = params.examId;
  const supabase = supabaseServer();

  // 1. Verify exam ownership
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id, title, subject, total_marks, passing_percentage')
    .eq('id', examId)
    .eq('teacher_id', user.id)
    .single();

  if (examError || !exam) {
    return new Response(JSON.stringify({ error: 'Exam not found or access denied' }), { status: 404 });
  }

  // 2. Fetch all graded and review students for this exam (exclude un-graded error records)
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('*')
    .eq('exam_id', examId)
    .in('status', ['graded', 'review', 'manually_graded'])
    .order('roll_number', { ascending: true });

  if (studentsError) {
    return new Response(JSON.stringify({ error: 'Failed to fetch students data' }), { status: 500 });
  }

  // Fetch copy flags
  const { data: copyFlagsData } = await supabase
    .from('copy_flags')
    .select('student_a_id, student_b_id')
    .eq('exam_id', examId)
    .eq('confirmed', true);
    
  const copiedStudentIds = new Set();
  (copyFlagsData || []).forEach(f => {
    copiedStudentIds.add(f.student_a_id);
    copiedStudentIds.add(f.student_b_id);
  });

  // 3. Fetch all questions for this exam
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id, question_number, sub_part, max_marks')
    .eq('exam_id', examId)
    .order('question_number', { ascending: true })
    .order('sub_part', { ascending: true });

  // 4. Fetch answers for graded students
  let answers = [];
  if (students.length > 0) {
    const studentIds = students.map(s => s.id);
    const { data: fetchedAnswers, error: answersError } = await supabase
      .from('answers')
      .select('student_id, question_id, obtained_marks, ai_feedback, flag_reason, needs_review')
      .in('student_id', studentIds);
    if (!answersError && fetchedAnswers) {
      answers = fetchedAnswers;
    }
  }

  // 5. Generate the Excel Buffer
  const { generateExcelExport } = await import('@/lib/utils/exportResults');
  const buffer = await generateExcelExport(exam, students, questions || [], answers, copiedStudentIds);

  // 6. Return as a downloadable file
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${exam.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.xlsx"`,
    },
  });
}