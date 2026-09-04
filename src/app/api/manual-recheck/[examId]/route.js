export const dynamic = 'force-dynamic';

import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { getSignedAnswerSheetUrl } from '@/lib/utils/storage';

/**
 * Confirms the authenticated teacher owns the given exam.
 */
async function verifyExamOwnership(supabase, examId, userId) {
  const { data, error } = await supabase
    .from('exams')
    .select('id')
    .eq('id', examId)
    .eq('teacher_id', userId)
    .single();
  if (error || !data) return null;
  return data;
}

export async function GET(req, { params }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const examId = resolvedParams?.examId;
    if (!examId) return Response.json({ error: 'Missing examId' }, { status: 400 });

    const supabase = supabaseServer();
    const exam = await verifyExamOwnership(supabase, examId, user.id);
    if (!exam) return Response.json({ error: 'Exam not found or access denied' }, { status: 404 });

    // 1. Fetch Students
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('exam_id', examId)
      .in('status', ['graded', 'manually_graded']);

    if (studentsError) {
      return Response.json({ error: studentsError.message }, { status: 500 });
    }

    const eligibleStudents = (studentsData || []).sort((a, b) => {
      const rollA = a.roll_number || '';
      const rollB = b.roll_number || '';
      return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
    });
    const studentIds = eligibleStudents.map((s) => s.id);

    let answersData = [];
    if (studentIds.length > 0) {
      const { data: ans, error: ansError } = await supabase
        .from('answers')
        .select('*, questions(question_number, sub_part, max_marks)')
        .in('student_id', studentIds);
      if (!ansError && ans) {
        answersData = ans;
      }
    }

    // 2. Group answers by student with ephemeral signed URLs for private answer sheets
    const grouped = await Promise.all(
      eligibleStudents.map(async (student) => {
        const studentAnswers = answersData
          .filter((a) => a.student_id === student.id)
          .map((a) => ({
            ...a,
            question_number: a.questions?.question_number,
            sub_part: a.questions?.sub_part,
            max_marks: a.questions?.max_marks,
          }))
          .sort((a, b) => {
            if (a.question_number !== b.question_number) return a.question_number - b.question_number;
            return (a.sub_part || '').localeCompare(b.sub_part || '');
          });

        let signedPdfUrl = student.answer_sheet_url;
        if (signedPdfUrl) {
          const signed = await getSignedAnswerSheetUrl(supabase, signedPdfUrl);
          if (signed) {
            signedPdfUrl = signed;
          }
        }

        return {
          studentId: student.id,
          studentName: student.student_name,
          studentRoll: student.roll_number,
          pdfUrl: signedPdfUrl || student.answer_sheet_url,
          filename: student.original_filename,
          answers: studentAnswers,
        };
      })
    );

    const filteredGroups = grouped.filter((g) => g.answers.length > 0);

    return Response.json({
      success: true,
      studentGroups: filteredGroups,
    });
  } catch (error) {
    console.error('Error in manual-recheck API:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
