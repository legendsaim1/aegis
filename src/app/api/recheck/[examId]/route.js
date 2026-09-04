import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { createLogger } from '@/lib/utils/logger';
import { validatePositiveNumber, validateMarks } from '@/lib/utils/validators';
import { updateExamStatus } from '@/lib/utils/examStatus';
import { getSignedAnswerSheetUrl } from '@/lib/utils/storage';

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Confirms the authenticated teacher owns the given exam.
 * Returns the exam row or null.
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

// ─── GET — Fetch all flagged answers for this exam ────────────────────────────

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const reqId = `req-${Math.random().toString(36).substring(2, 9)}`;
  const log = createLogger('RecheckAPI', reqId);
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { examId } = params;
  const supabase = supabaseServer();

  const exam = await verifyExamOwnership(supabase, examId, user.id);
  if (!exam) return Response.json({ error: 'Exam not found or access denied' }, { status: 404 });

  // Single JOIN query: answers + their question + their student
  // Filter: only answers flagged needs_review = true, belonging to this exam
  const { data: answers, error: answersError } = await supabase
    .from('answers')
    .select(`
      id,
      extracted_text,
      obtained_marks,
      ai_feedback,
      flag_reason,
      questions (
        question_number,
        sub_part,
        max_marks,
        question_text
      ),
      students!inner (
        id,
        student_name,
        roll_number,
        exam_id,
        answer_sheet_url,
        original_filename
      )
    `)
    .eq('needs_review', true)
    .eq('students.exam_id', examId)
    .order('students(student_name)', { ascending: true });

  if (answersError) {
    log.error(`DB Error fetching answers for recheck`, { error: answersError.message });
    return Response.json({ error: 'Failed to fetch answers' }, { status: 500 });
  }

  // Map DB column names → exact field names the recheck UI expects
  const flags = await Promise.all((answers || []).map(async (answer) => {
    const signedPdfUrl = await getSignedAnswerSheetUrl(supabase, answer.students?.answer_sheet_url);
    return {
      id: answer.id,
      studentName: answer.students?.student_name ?? 'Unknown',
      studentId: answer.students?.id,
      studentRoll: answer.students?.roll_number ?? '',
      pdfUrl: signedPdfUrl,
      filename: answer.students?.original_filename ?? null,
      questionTopic: answer.questions
        ? `Q${answer.questions.question_number}${answer.questions.sub_part ? `(${answer.questions.sub_part})` : ''}`
        : 'Unknown Question',
      questionText: answer.questions?.question_text ?? 'No question text provided.',
      flagReason: answer.flag_reason ?? 'Flagged for manual review',
      extractedText: answer.extracted_text ?? '',
      marksObtained: answer.obtained_marks ?? 0,
      totalMarks: answer.questions?.max_marks ?? 0,
      feedback: answer.ai_feedback ?? 'No feedback available',
    };
  }));

  return Response.json(flags);
}

// ─── POST — Teacher overrides a grade ─────────────────────────────────────────

export async function POST(req, { params }) {
  const reqId = `req-${Math.random().toString(36).substring(2, 9)}`;
  const log = createLogger('RecheckAPI', reqId);
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { examId } = params;
  const supabase = supabaseServer();

  const exam = await verifyExamOwnership(supabase, examId, user.id);
  if (!exam) return Response.json({ error: 'Exam not found or access denied' }, { status: 404 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { answerId, revised_marks, teacher_notes } = body;

  if (!answerId) {
    return Response.json({ error: 'answerId is required' }, { status: 400 });
  }
  if (revised_marks === undefined || revised_marks === null) {
    return Response.json({ error: 'revised_marks is required' }, { status: 400 });
  }
  if (!validateMarks(revised_marks)) {
    return Response.json({ error: 'revised_marks must be a non-negative number' }, { status: 400 });
  }

  // Verify the answer belongs to a student in this exam (security check)
  const { data: answer, error: answerError } = await supabase
    .from('answers')
    .select('id, student_id, question_id, flag_reason, questions ( id, max_marks )')
    .eq('id', answerId)
    .single();

  if (answerError || !answer) {
    return Response.json({ error: 'Answer not found' }, { status: 404 });
  }

  // Upper-bound validation against question's max_marks
  const maxMarks = Number(answer.questions?.max_marks);
  if (Number.isFinite(maxMarks) && maxMarks >= 0 && !validateMarks(revised_marks, maxMarks)) {
    return Response.json({
      error: `revised_marks (${revised_marks}) exceeds maximum allowable marks (${maxMarks}) for this question`
    }, { status: 400 });
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, exam_id')
    .eq('id', answer.student_id)
    .eq('exam_id', examId)
    .single();

  if (studentError || !student) {
    return Response.json({ error: 'Access denied: answer does not belong to this exam' }, { status: 403 });
  }

  // 1. Update the answer row with the teacher's revised marks, preserving original flag reason
  const teacherNote = teacher_notes?.trim() || 'Manually reviewed and corrected by teacher';
  const updatedFlagReason = answer.flag_reason
    ? (answer.flag_reason.startsWith('[Original:')
        ? `${answer.flag_reason} | ${teacherNote}`
        : `[Original: ${answer.flag_reason}] ${teacherNote}`)
    : teacherNote;

  const { error: updateError } = await supabase
    .from('answers')
    .update({
      obtained_marks: Number(revised_marks),
      needs_review: false,
      flag_reason: updatedFlagReason,
    })
    .eq('id', answerId);

  if (updateError) {
    log.error(`Failed to update answer for recheck POST`, { answerId, error: updateError.message });
    return Response.json({ error: 'Failed to update answer' }, { status: 500 });
  }

  // 2. Recalculate student's total_obtained_marks atomically
  const { error: rpcError } = await supabase.rpc('recalculate_student_total', {
    p_student_id: student.id,
  });

  if (rpcError) {
    log.warn('recalculate_student_total RPC failed, falling back to manual query:', rpcError);
    const { data: allAnswers, error: sumError } = await supabase
      .from('answers')
      .select('obtained_marks')
      .eq('student_id', student.id);

    if (!sumError && allAnswers) {
      const newTotal = allAnswers.reduce((sum, a) => sum + Number(a.obtained_marks || 0), 0);
      
      const { count: remainingReviews } = await supabase
        .from('answers')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', student.id)
        .eq('needs_review', true);
        
      const studentUpdate = { total_obtained_marks: newTotal };
      if (remainingReviews === 0) {
        studentUpdate.status = 'manually_graded';
      }

      await supabase
        .from('students')
        .update(studentUpdate)
        .eq('id', student.id);
    }
  } else {
    // Check if any reviews remain to update status if needed
    const { count: remainingReviews } = await supabase
      .from('answers')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student.id)
      .eq('needs_review', true);

    if (remainingReviews === 0) {
      await supabase
        .from('students')
        .update({ status: 'manually_graded' })
        .eq('id', student.id);
    }
  }

  await updateExamStatus(examId, supabase);

  return Response.json({ success: true, message: 'Grade overridden and student total recalculated.' });
}

// ─── PATCH — Teacher accepts AI grade as correct ──────────────────────────────

export async function PATCH(req, { params }) {
  const reqId = `req-${Math.random().toString(36).substring(2, 9)}`;
  const log = createLogger('RecheckAPI', reqId);
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { examId } = params;
  const supabase = supabaseServer();

  const exam = await verifyExamOwnership(supabase, examId, user.id);
  if (!exam) return Response.json({ error: 'Exam not found or access denied' }, { status: 404 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { answerId } = body;
  if (!answerId) {
    return Response.json({ error: 'answerId is required' }, { status: 400 });
  }

  // Verify ownership via the same student→exam chain
  const { data: answer, error: answerError } = await supabase
    .from('answers')
    .select('id, student_id, flag_reason')
    .eq('id', answerId)
    .single();

  if (answerError || !answer) {
    return Response.json({ error: 'Answer not found' }, { status: 404 });
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, exam_id')
    .eq('id', answer.student_id)
    .eq('exam_id', examId)
    .single();

  if (studentError || !student) {
    return Response.json({ error: 'Access denied: answer does not belong to this exam' }, { status: 403 });
  }

  const acceptNote = 'AI grade accepted by teacher';
  const updatedFlagReason = answer.flag_reason
    ? (answer.flag_reason.startsWith('[Original:')
        ? `${answer.flag_reason} | ${acceptNote}`
        : `[Original: ${answer.flag_reason}] ${acceptNote}`)
    : acceptNote;

  const { error: updateError } = await supabase
    .from('answers')
    .update({
      needs_review: false,
      flag_reason: updatedFlagReason,
    })
    .eq('id', answerId);

  if (updateError) {
    log.error(`Failed to accept answer for recheck PATCH`, { answerId, error: updateError.message });
    return Response.json({ error: 'Failed to accept answer' }, { status: 500 });
  }

  // Check if any answers still need review for this student
  const { count: remainingReviews } = await supabase
    .from('answers')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', student.id)
    .eq('needs_review', true);

  if (remainingReviews === 0) {
    await supabase
      .from('students')
      .update({ status: 'manually_graded' })
      .eq('id', student.id);
  }

  // Update exam status because a review was resolved
  await updateExamStatus(examId, supabase);

  return Response.json({ success: true, message: 'AI grade accepted.' });
}
