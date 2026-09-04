import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { updateExamStatus } from '@/lib/utils/examStatus';
import { validateMarks } from '@/lib/utils/validators';

export async function PATCH(request, { params }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const answerId = params.answerId;
    if (!answerId) return Response.json({ error: 'Missing answerId' }, { status: 400 });

    const body = await request.json();
    const { obtained_marks } = body;

    if (obtained_marks === undefined || obtained_marks === null) {
      return Response.json({ error: 'Missing obtained_marks' }, { status: 400 });
    }

    const numericMarks = Number(obtained_marks);
    if (!validateMarks(numericMarks)) {
      return Response.json({ error: 'obtained_marks must be a non-negative number' }, { status: 400 });
    }

    const supabase = supabaseServer();

    // ── SECURITY: verify this answer belongs to an exam owned by the caller ──
    const { data: ownerCheck, error: ownerError } = await supabase
      .from('answers')
      .select(`
        id,
        student_id,
        question_id,
        questions (
          id,
          max_marks
        ),
        students!inner (
          exam_id,
          exams!inner ( teacher_id )
        )
      `)
      .eq('id', answerId)
      .single();

    if (ownerError || !ownerCheck) {
      return Response.json({ error: 'Answer not found' }, { status: 404 });
    }

    if (ownerCheck.students?.exams?.teacher_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Upper-bound validation against question's max_marks
    const maxMarks = Number(ownerCheck.questions?.max_marks);
    if (Number.isFinite(maxMarks) && maxMarks >= 0 && !validateMarks(numericMarks, maxMarks)) {
      return Response.json({
        error: `obtained_marks (${numericMarks}) exceeds maximum allowable marks (${maxMarks}) for this question`
      }, { status: 400 });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const studentId = ownerCheck.student_id;

    // 1. Update the answer
    const { error: updateError } = await supabase
      .from('answers')
      .update({ obtained_marks: numericMarks, needs_review: false })
      .eq('id', answerId);

    if (updateError) {
      console.error('Error updating answer:', updateError);
      return Response.json({ error: 'Failed to update answer' }, { status: 500 });
    }

    // 2. Atomically recalculate student total directly in PostgreSQL
    let newTotalMarks = null;
    const { data: rpcData, error: rpcError } = await supabase.rpc('recalculate_student_total', {
      p_student_id: studentId,
    });

    if (!rpcError && rpcData !== null && rpcData !== undefined) {
      newTotalMarks = Number(rpcData);
    } else {
      if (rpcError) {
        console.error('Error in recalculate_student_total RPC, falling back to query:', rpcError);
      }
      const { data: allAnswers, error: fetchError } = await supabase
        .from('answers')
        .select('obtained_marks')
        .eq('student_id', studentId);

      if (fetchError) {
        console.error('Error fetching answers:', fetchError);
        return Response.json({ error: 'Failed to recalculate total marks' }, { status: 500 });
      }

      newTotalMarks = Math.round((allAnswers || []).reduce((sum, a) => sum + (Number(a.obtained_marks) || 0), 0) * 100) / 100;
      const { error: studentUpdateError } = await supabase
        .from('students')
        .update({ total_obtained_marks: newTotalMarks, status: 'manually_graded' })
        .eq('id', studentId);

      if (studentUpdateError) {
        console.error('Error updating student total:', studentUpdateError);
        return Response.json({ error: 'Failed to update student total marks' }, { status: 500 });
      }
    }

    const examId = ownerCheck.students?.exam_id;
    if (examId) {
      await updateExamStatus(examId, supabase);
    }

    return Response.json({ success: true, newTotalMarks });

  } catch (err) {
    console.error('Unexpected error in PATCH /api/answers/[answerId]:', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}