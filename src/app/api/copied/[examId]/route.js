import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { updateExamStatus } from '@/lib/utils/examStatus';
import { getSignedAnswerSheetUrl } from '@/lib/utils/storage';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { examId } = params;
  if (!examId) return Response.json({ error: 'Missing examId' }, { status: 400 });

  const supabase = supabaseServer();

  // 1. Verify exam ownership
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id')
    .eq('id', examId)
    .eq('teacher_id', user.id)
    .single();

  if (examError || !exam) {
    return Response.json({ error: 'Exam not found or access denied' }, { status: 404 });
  }

  // 2. Fetch copy flags with related data
  const { data: flags, error: flagsError } = await supabase
    .from('copy_flags')
    .select(`
      id,
      similarity_score,
      reason,
      question_id,
      questions (
        question_number,
        sub_part,
        max_marks
      ),
      studentA:students!copy_flags_student_a_id_fkey (
        id,
        student_name,
        roll_number,
        answer_sheet_url,
        original_filename
      ),
      studentB:students!copy_flags_student_b_id_fkey (
        id,
        student_name,
        roll_number,
        answer_sheet_url,
        original_filename
      )
    `)
    .eq('exam_id', examId)
    .eq('confirmed', true);

  if (flagsError) {
    return Response.json({ error: `Failed to fetch flags: ${flagsError.message}` }, { status: 500 });
  }

  if (!flags || flags.length === 0) {
    return Response.json([]);
  }

  // Collect all student IDs and question IDs involved to fetch their answers efficiently
  const studentIds = new Set();
  const questionIds = new Set();
  flags.forEach(flag => {
    studentIds.add(flag.studentA.id);
    studentIds.add(flag.studentB.id);
    questionIds.add(flag.question_id);
  });

  // 3. Fetch specific answers for these students to get current marks and text
  // We use .in('question_id') to prevent downloading hundreds of irrelevant answers across the network
  const { data: answers, error: answersError } = await supabase
    .from('answers')
    .select('id, student_id, question_id, extracted_text, obtained_marks')
    .in('student_id', Array.from(studentIds))
    .in('question_id', Array.from(questionIds));

  if (answersError) {
    return Response.json({ error: `Failed to fetch answers: ${answersError.message}` }, { status: 500 });
  }

  // 4. Format the final output with ephemeral signed URLs for both students
  const formattedResults = await Promise.all(flags.map(async (flag) => {
    const ansA = answers.find(a => a.student_id === flag.studentA.id && a.question_id === flag.question_id);
    const ansB = answers.find(a => a.student_id === flag.studentB.id && a.question_id === flag.question_id);

    const [signedUrlA, signedUrlB] = await Promise.all([
      getSignedAnswerSheetUrl(supabase, flag.studentA.answer_sheet_url),
      getSignedAnswerSheetUrl(supabase, flag.studentB.answer_sheet_url),
    ]);

    return {
      flagId: flag.id,
      questionId: flag.question_id,
      questionLabel: `Q${flag.questions.question_number}${flag.questions.sub_part ? `(${flag.questions.sub_part})` : ''}`,
      maxMarks: flag.questions.max_marks,
      similarityScore: flag.similarity_score,
      reason: flag.reason,
      studentA: {
        studentId: flag.studentA.id,
        answerId: ansA?.id,
        name: flag.studentA.student_name,
        roll: flag.studentA.roll_number,
        extractedText: ansA?.extracted_text || 'No text extracted.',
        currentMarks: ansA?.obtained_marks || 0,
        pdfUrl: signedUrlA,
        filename: flag.studentA.original_filename
      },
      studentB: {
        studentId: flag.studentB.id,
        answerId: ansB?.id,
        name: flag.studentB.student_name,
        roll: flag.studentB.roll_number,
        extractedText: ansB?.extracted_text || 'No text extracted.',
        currentMarks: ansB?.obtained_marks || 0,
        pdfUrl: signedUrlB,
        filename: flag.studentB.original_filename
      }
    };
  }));

  return Response.json(formattedResults);
}

export async function PATCH(req, { params }) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { examId } = params;
  if (!examId) return Response.json({ error: 'Missing examId' }, { status: 400 });

  const body = await req.json();
  const { updates } = body;

  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return Response.json({ error: 'Missing or invalid updates array' }, { status: 400 });
  }

  const supabase = supabaseServer();

  // 1. Verify exam ownership
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id')
    .eq('id', examId)
    .eq('teacher_id', user.id)
    .single();

  if (examError || !exam) {
    return Response.json({ error: 'Exam not found or access denied' }, { status: 404 });
  }

  try {
    // 2. Fetch and verify all answers belong to students enrolled in this exam
    const answerIds = [...new Set(updates.map(u => u.answerId).filter(Boolean))];
    if (answerIds.length === 0) {
      return Response.json({ error: 'No valid answerId provided in updates' }, { status: 400 });
    }

    const { data: verifiedAnswers, error: fetchErr } = await supabase
      .from('answers')
      .select(`
        id,
        student_id,
        question_id,
        students!inner ( id, exam_id ),
        questions!inner ( max_marks )
      `)
      .in('id', answerIds)
      .eq('students.exam_id', examId);

    if (fetchErr) {
      throw new Error(`Failed to verify answers: ${fetchErr.message}`);
    }

    const verifiedMap = new Map((verifiedAnswers || []).map(a => [a.id, a]));

    // 3. Pre-validate every update in the batch before making any database modifications
    const sanitizedUpdates = [];
    const studentSet = new Set();

    for (const update of updates) {
      if (!update.answerId || update.newMarks === undefined || !update.studentId) {
        return Response.json({ error: 'Missing required update fields (answerId, studentId, newMarks)' }, { status: 400 });
      }

      const verified = verifiedMap.get(update.answerId);
      if (!verified || verified.student_id !== update.studentId) {
        return Response.json({ error: `Answer ${update.answerId} not found in this exam or student mismatch` }, { status: 404 });
      }

      const numericMarks = Number(update.newMarks);
      const maxMarks = Number(verified.questions?.max_marks) || 0;

      if (!Number.isFinite(numericMarks) || numericMarks < 0 || numericMarks > maxMarks) {
        return Response.json({
          error: `Invalid marks '${update.newMarks}' for answer ${update.answerId}. Must be a number between 0 and ${maxMarks}.`
        }, { status: 400 });
      }

      sanitizedUpdates.push({
        answerId: update.answerId,
        studentId: update.studentId,
        newMarks: numericMarks
      });
      studentSet.add(update.studentId);
    }

    // 4. Update each verified answer with validated marks
    for (const update of sanitizedUpdates) {
      const { error: updateError } = await supabase
        .from('answers')
        .update({ obtained_marks: update.newMarks, needs_review: false })
        .eq('id', update.answerId);

      if (updateError) throw new Error(`Failed to update answer ${update.answerId}: ${updateError.message}`);
    }

    // 5. Recalculate totals for verified students atomically in PostgreSQL
    for (const studentId of studentSet) {
      const { error: rpcError } = await supabase.rpc('recalculate_student_total', {
        p_student_id: studentId,
      });

      if (rpcError) {
        console.error(`recalculate_student_total RPC failed for student ${studentId}, falling back to query:`, rpcError);
        const { data: allAnswers, error: ansError } = await supabase
          .from('answers')
          .select('obtained_marks')
          .eq('student_id', studentId);

        if (ansError) throw new Error(`Failed to fetch answers for student ${studentId}: ${ansError.message}`);

        const totalMarks = (allAnswers || []).reduce((sum, ans) => sum + (Number(ans.obtained_marks) || 0), 0);

        const { error: studentUpdateError } = await supabase
          .from('students')
          .update({ total_obtained_marks: totalMarks, status: 'manually_graded' })
          .eq('id', studentId)
          .eq('exam_id', examId);

        if (studentUpdateError) throw new Error(`Failed to update student ${studentId}: ${studentUpdateError.message}`);
      }
    }

    // Recalculate exam-level status now that copied marks have changed
    await updateExamStatus(examId, supabase);

    return Response.json({ success: true, message: 'Marks updated successfully' });
  } catch (error) {
    console.error('PATCH Copied marks error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { examId } = params;
  const body = await req.json();
  const { flagId } = body;

  if (!flagId) {
    return Response.json({ error: 'Missing flagId' }, { status: 400 });
  }

  const supabase = supabaseServer();

  // 1. Verify exam ownership
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id')
    .eq('id', examId)
    .eq('teacher_id', user.id)
    .single();

  if (examError || !exam) {
    return Response.json({ error: 'Exam not found or access denied' }, { status: 404 });
  }

  try {
    const { error: deleteError } = await supabase
      .from('copy_flags')
      .delete()
      .eq('id', flagId)
      .eq('exam_id', examId);

    if (deleteError) throw new Error(`Failed to delete flag: ${deleteError.message}`);

    // Recalculate exam status — resolving a copy flag may now make the exam fully graded
    await updateExamStatus(examId, supabase);

    return Response.json({ success: true, message: 'Flag marked as resolved' });
  } catch (error) {
    console.error('DELETE Copied flag error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

