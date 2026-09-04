import { supabaseServer } from "@/lib/supabase/server";

export async function updateExamStatus(examId, supabaseClient) {
  if (!examId) return;
  const dbClient = supabaseClient || supabaseServer();

  // Fetch all students for the exam
  const { data: students, error } = await dbClient
    .from('students')
    .select('id, status, overall_grade_confidence')
    .eq('exam_id', examId);

  if (error || !students) {
    console.error("Failed to fetch students for exam status update:", error);
    return;
  }

  if (students.length === 0) {
    // No students -> draft
    await dbClient.from('exams').update({ status: 'draft' }).eq('id', examId);
    return;
  }

  // Fetch copy flags
  const { data: copyFlags } = await dbClient
    .from('copy_flags')
    .select('id')
    .eq('exam_id', examId)
    .eq('confirmed', true)
    .limit(1);

  const hasCopied = copyFlags && copyFlags.length > 0;

  // Fetch any answers needing review
  const studentIds = students.map(s => s.id);
  const { data: needsReviewAnswers } = await dbClient
    .from('answers')
    .select('id')
    .in('student_id', studentIds)
    .eq('needs_review', true)
    .limit(1);

  const hasNeedsReview = needsReviewAnswers && needsReviewAnswers.length > 0;

  // Check if all students are fully processed/graded
  let allGraded = true;
  for (const student of students) {
    if (!['graded', 'manually_graded'].includes(student.status)) {
      allGraded = false;
      break;
    }
  }

  const newStatus = (allGraded && !hasCopied && !hasNeedsReview) ? 'graded' : 'draft';

  await dbClient.from('exams').update({ status: newStatus }).eq('id', examId);
}
