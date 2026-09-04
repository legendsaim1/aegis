import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { updateExamStatus } from '@/lib/utils/examStatus';
import { validateMarks } from '@/lib/utils/validators';
import { getExamTotalMarks } from '@/lib/utils/examTotals';

export async function PATCH(request, { params }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const studentId = params.studentId;
    if (!studentId) return Response.json({ error: 'Missing studentId' }, { status: 400 });

    const body = await request.json();
    const { total_obtained_marks } = body;

    if (total_obtained_marks === undefined || total_obtained_marks === null) {
      return Response.json({ error: 'Missing total_obtained_marks' }, { status: 400 });
    }

    const numericMarks = Number(total_obtained_marks);
    if (!validateMarks(numericMarks)) {
      return Response.json({ error: 'total_obtained_marks must be a non-negative number' }, { status: 400 });
    }

    const supabase = supabaseServer();

    // ── SECURITY: verify this student belongs to an exam owned by the caller ──
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        exam_id,
        exams!inner (
          id,
          total_marks,
          teacher_id,
          questions (
            id,
            question_number,
            sub_part,
            max_marks
          )
        )
      `)
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    if (student.exams?.teacher_id !== user.id) {
      return Response.json({ error: 'Forbidden: Access denied to this student' }, { status: 403 });
    }

    // Upper-bound validation against exam total marks
    const examTotal = getExamTotalMarks(student.exams?.questions || [], student.exams);
    if (!validateMarks(numericMarks, examTotal)) {
      return Response.json({
        error: `total_obtained_marks (${numericMarks}) exceeds maximum allowable marks (${examTotal}) for this exam`
      }, { status: 400 });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const { data: updatedStudent, error: updateError } = await supabase
      .from('students')
      .update({ 
        total_obtained_marks: numericMarks,
        status: 'manually_graded',
        overall_grade_confidence: null
      })
      .eq('id', studentId)
      .select('exam_id')
      .single();

    if (updateError) {
      console.error('Error updating student score:', updateError);
      return Response.json({ error: 'Failed to update student score' }, { status: 500 });
    }

    if (updatedStudent && updatedStudent.exam_id) {
      await updateExamStatus(updatedStudent.exam_id, supabase);
    }

    return Response.json({ success: true, newTotalMarks: numericMarks });

  } catch (err) {
    console.error('Unexpected error in PATCH /api/students/[studentId]:', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
