import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { deleteExamStorageFolder } from '@/lib/utils/storage';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const fields = url.searchParams.get('fields');

  const supabase = supabaseServer();
  let query;

  if (fields === 'subject') {
    query = supabase.from('exams').select('id, subject, title').eq('id', params.examId).eq('teacher_id', user.id).single();
  } else if (fields === 'summary') {
    query = supabase.from('exams').select('id, title, subject, class_grade, total_marks, passing_percentage, status').eq('id', params.examId).eq('teacher_id', user.id).single();
  } else {
    query = supabase.from('exams').select('*, questions(*)').eq('id', params.examId).eq('teacher_id', user.id).single();
  }

  const { data, error } = await query;

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}

export async function PUT(req, { params }) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Strict field whitelist to prevent mass assignment vulnerabilities
  const allowedFields = ['title', 'subject', 'class_grade', 'instructions', 'passing_percentage'];
  const updates = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  // Validate passing_percentage if supplied
  if (updates.passing_percentage !== undefined) {
    const pct = Number(updates.passing_percentage);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      return Response.json({ error: 'passing_percentage must be a number between 0 and 100' }, { status: 400 });
    }
    updates.passing_percentage = pct;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No valid fields provided to update' }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('exams')
    .update(updates)
    .eq('id', params.examId)
    .eq('teacher_id', user.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}

export async function DELETE(req, { params }) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = supabaseServer();

  // 1. Verify ownership before executing any deletion
  const { data: exam, error: fetchError } = await supabase
    .from('exams')
    .select('id')
    .eq('id', params.examId)
    .eq('teacher_id', user.id)
    .single();

  if (fetchError || !exam) {
    return Response.json({ error: 'Exam not found or access denied' }, { status: 404 });
  }

  // 2. Defense-in-depth: explicitly remove child records in dependency order
  // to guarantee deletion succeeds even if live database is missing ON DELETE CASCADE constraints.
  const { data: examStudents } = await supabase
    .from('students')
    .select('id')
    .eq('exam_id', params.examId);

  const studentIds = (examStudents || []).map(s => s.id);
  if (studentIds.length > 0) {
    await supabase.from('answers').delete().in('student_id', studentIds);
    await supabase.from('recheck_requests').delete().in('student_id', studentIds);
  }

  await supabase.from('copy_flags').delete().eq('exam_id', params.examId);
  await supabase.from('questions').delete().eq('exam_id', params.examId);
  await supabase.from('students').delete().eq('exam_id', params.examId);

  // 3. Delete the exam row
  const { error: deleteError } = await supabase
    .from('exams')
    .delete()
    .eq('id', params.examId)
    .eq('teacher_id', user.id);

  if (deleteError) {
    return Response.json({ error: deleteError.message }, { status: 400 });
  }

  // 4. Clean up all stored answer sheets for this exam in Supabase Storage
  // (Executed only after the database deletion has confirmed success)
  await deleteExamStorageFolder(supabase, params.examId);

  return Response.json({ success: true });
}