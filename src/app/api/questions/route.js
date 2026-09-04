import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { validateRequired, validateEnum, validatePositiveInt, validatePositiveNumber } from '@/lib/utils/validators';
import { updateExamStatus } from '@/lib/utils/examStatus';

// ---------- Helpers ----------

const ALLOWED_TYPES = ['mcq', 'short', 'long', 'blank'];

/**
 * Verifies that the logged-in teacher owns the given exam.
 * Returns the exam data if valid, or null if not found / not owned.
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

// ---------- GET — List questions for an exam ----------

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get('examId');

  if (!examId) {
    return Response.json({ error: 'examId query parameter is required' }, { status: 400 });
  }

  const supabase = supabaseServer();

  // Verify the teacher owns this exam
  const exam = await verifyExamOwnership(supabase, examId, user.id);
  if (!exam) {
    return Response.json({ error: 'Exam not found or access denied' }, { status: 404 });
  }

  // Fetch questions ordered by question_number, then sub_part
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', examId)
    .order('question_number', { ascending: true })
    .order('sub_part', { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}

// ---------- POST — Create a new question ----------

export async function POST(req) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { examId, question_number, question_text, question_type, max_marks, rubric_json, teacher_instructions, sub_part } = body;

  // Validate required fields
  const { valid, missing } = validateRequired(body, ['examId', 'question_number', 'question_text', 'question_type', 'max_marks']);
  if (!valid) {
    return Response.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
  }

  // Validate question_type
  if (!validateEnum(question_type, ALLOWED_TYPES)) {
    return Response.json({ error: `question_type must be one of: ${ALLOWED_TYPES.join(', ')}` }, { status: 400 });
  }

  // Validate numeric fields
  if (!validatePositiveInt(question_number)) {
    return Response.json({ error: 'question_number must be a positive integer' }, { status: 400 });
  }
  if (!validatePositiveNumber(max_marks)) {
    return Response.json({ error: 'max_marks must be a positive number' }, { status: 400 });
  }

  const supabase = supabaseServer();

  // Verify the teacher owns this exam
  const exam = await verifyExamOwnership(supabase, examId, user.id);
  if (!exam) {
    return Response.json({ error: 'Exam not found or access denied' }, { status: 404 });
  }

  // Insert the question (whitelist fields — never spread body directly)
  const { data, error } = await supabase
    .from('questions')
    .insert({
      exam_id: examId,
      question_number: Number(question_number),
      question_text,
      question_type,
      max_marks: Number(max_marks),
      rubric_json: rubric_json || null,
      teacher_instructions: teacher_instructions || null,
      sub_part: sub_part || null,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });

  await updateExamStatus(examId, supabase);
  return Response.json(data, { status: 201 });
}

// ---------- PUT — Update an existing question ----------

export async function PUT(req) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get('id');

  if (!questionId) {
    return Response.json({ error: 'id query parameter is required' }, { status: 400 });
  }

  const body = await req.json();

  // Validate question_type if provided
  if (body.question_type && !validateEnum(body.question_type, ALLOWED_TYPES)) {
    return Response.json({ error: `question_type must be one of: ${ALLOWED_TYPES.join(', ')}` }, { status: 400 });
  }

  // Validate numeric fields if provided
  if (body.question_number !== undefined && !validatePositiveInt(body.question_number)) {
    return Response.json({ error: 'question_number must be a positive integer' }, { status: 400 });
  }
  if (body.max_marks !== undefined && !validatePositiveNumber(body.max_marks)) {
    return Response.json({ error: 'max_marks must be a positive number' }, { status: 400 });
  }

  const supabase = supabaseServer();

  // First, find the question to get its exam_id
  const { data: question, error: findError } = await supabase
    .from('questions')
    .select('exam_id')
    .eq('id', questionId)
    .single();

  if (findError || !question) {
    return Response.json({ error: 'Question not found' }, { status: 404 });
  }

  // Verify the teacher owns the parent exam
  const exam = await verifyExamOwnership(supabase, question.exam_id, user.id);
  if (!exam) {
    return Response.json({ error: 'Access denied' }, { status: 403 });
  }

  // Whitelist only the fields that can be updated
  const updates = {};
  if (body.question_number !== undefined) updates.question_number = Number(body.question_number);
  if (body.question_text !== undefined) updates.question_text = body.question_text;
  if (body.question_type !== undefined) updates.question_type = body.question_type;
  if (body.max_marks !== undefined) updates.max_marks = Number(body.max_marks);
  if (body.rubric_json !== undefined) updates.rubric_json = body.rubric_json;
  if (body.teacher_instructions !== undefined) updates.teacher_instructions = body.teacher_instructions;
  if (body.sub_part !== undefined) updates.sub_part = body.sub_part || null;

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', questionId)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });

  await updateExamStatus(question.exam_id, supabase);
  return Response.json(data);
}

// ---------- DELETE — Remove a question ----------

export async function DELETE(req) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get('id');
  const examId = searchParams.get('examId');

  if (!questionId || !examId) {
    return Response.json({ error: 'Both id and examId query parameters are required' }, { status: 400 });
  }

  const supabase = supabaseServer();

  // Verify the teacher owns this exam
  const exam = await verifyExamOwnership(supabase, examId, user.id);
  if (!exam) {
    return Response.json({ error: 'Exam not found or access denied' }, { status: 404 });
  }

  // 1. Delete the question (Foreign Key cascade deletes associated student answers)
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId)
    .eq('exam_id', examId);

  if (error) return Response.json({ error: error.message }, { status: 400 });

  // 2. Automatically recalculate total_obtained_marks for all students in this exam
  const { error: rpcError } = await supabase.rpc('recalculate_exam_student_totals', {
    p_exam_id: examId,
  });

  if (rpcError) {
    console.error('recalculate_exam_student_totals RPC failed, running fallback query:', rpcError);
    const { data: gradedStudents } = await supabase
      .from('students')
      .select('id')
      .eq('exam_id', examId)
      .in('status', ['graded', 'review', 'manually_graded']);

    for (const st of gradedStudents || []) {
      const { data: answers } = await supabase
        .from('answers')
        .select('obtained_marks')
        .eq('student_id', st.id);

      const total = (answers || []).reduce((sum, a) => sum + Number(a.obtained_marks || 0), 0);
      await supabase.from('students').update({ total_obtained_marks: total }).eq('id', st.id);
    }
  }

  // 3. Update exam-level status & totals
  await updateExamStatus(examId, supabase);

  return Response.json({ success: true, message: 'Question deleted and all student totals recalculated successfully.' });
}