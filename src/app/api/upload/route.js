import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { updateExamStatus } from '@/lib/utils/examStatus';
import {
  getSignedAnswerSheetUrl,
  attachSignedUrlsToStudents,
  deleteAnswerSheetFile,
} from '@/lib/utils/storage';

export const maxDuration = 300;

// ---------- POST — Upload file to Storage & Register Student ----------

export async function POST(req) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const examId = formData.get('examId');
  const student_name = formData.get('student_name');
  const roll_number = formData.get('roll_number');
  const file = formData.get('file');

  const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB
  if (file && file.size > MAX_FILE_BYTES) {
    return Response.json(
      { error: 'File too large. Maximum allowed size is 20 MB.' },
      { status: 413 }
    );
  }

  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ALLOWED_EXT   = /\.(pdf|jpg|jpeg|png|webp)$/i;
  if (file && (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXT.test(file.name))) {
    return Response.json(
      { error: 'Invalid file type. Only PDF, JPG, PNG, and WebP are accepted.' },
      { status: 415 }
    );
  }

  const trimmedStudentName = String(student_name || '').trim();
  const trimmedRoll = String(roll_number || '').trim();

  if (!examId || !trimmedStudentName || !trimmedRoll || !file) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = supabaseServer();

  // 1. Verify the teacher owns this exam
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id')
    .eq('id', examId)
    .eq('teacher_id', user.id)
    .single();

  if (examError || !exam) {
    return Response.json({ error: 'Exam not found or access denied' }, { status: 404 });
  }

  // Check if a student with this roll number already exists in this exam
  const { data: existingStudent } = await supabase
    .from('students')
    .select('id')
    .eq('exam_id', examId)
    .eq('roll_number', trimmedRoll)
    .maybeSingle();

  if (existingStudent) {
    return Response.json(
      { error: `A student with roll number "${trimmedRoll}" already exists in this exam.` },
      { status: 409 }
    );
  }

  // 2. Upload file to Supabase Storage with sanitized path
  const originalFilename = file.name;
  const rawExt = file.name.split('.').pop() || 'pdf';
  const safeExt = rawExt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const sanitizedRoll = trimmedRoll.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = `${examId}/${sanitizedRoll}_${Date.now()}.${safeExt}`;

  const fileBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('answer-sheets')
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: true
    });

  if (uploadError) {
    return Response.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
  }

  // 3. Insert student row into database storing the relative storage path (not permanent public URL)
  const { data, error } = await supabase
    .from('students')
    .insert({
      exam_id: examId,
      student_name: trimmedStudentName,
      roll_number: trimmedRoll,
      answer_sheet_url: filePath,
      original_filename: originalFilename,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    // Rollback: Clean up uploaded storage file on database insert failure
    await deleteAnswerSheetFile(supabase, filePath);
    const isDuplicate = error?.code === '23505' || error?.message?.includes('duplicate key') || error?.message?.includes('unique_exam_roll');
    return Response.json(
      { error: isDuplicate ? `A student with roll number "${trimmedRoll}" already exists in this exam.` : error.message },
      { status: isDuplicate ? 409 : 400 }
    );
  }

  await updateExamStatus(examId, supabase);

  // Return signed URL for immediate frontend display
  const signedUrl = await getSignedAnswerSheetUrl(supabase, filePath);
  return Response.json({ ...data, answer_sheet_url: signedUrl }, { status: 201 });
}

// ---------- GET — List students for an exam ----------

export async function GET(req) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get('examId');

  if (!examId) {
    return Response.json({ error: 'examId query parameter is required' }, { status: 400 });
  }

  const supabase = supabaseServer();

  // Fire both queries simultaneously to halve the latency
  const [examResult, studentsResult] = await Promise.all([
    supabase
      .from('exams')
      .select('id')
      .eq('id', examId)
      .eq('teacher_id', user.id)
      .single(),
    supabase
      .from('students')
      .select('id, student_name, roll_number, status, original_filename, answer_sheet_url, processed_at')
      .eq('exam_id', examId)
      .order('roll_number', { ascending: true })
  ]);

  if (examResult.error || !examResult.data) {
    return Response.json({ error: 'Exam not found' }, { status: 404 });
  }

  if (studentsResult.error) {
    return Response.json({ error: studentsResult.error.message }, { status: 400 });
  }

  const studentsWithSignedUrls = await attachSignedUrlsToStudents(supabase, studentsResult.data);
  return Response.json(studentsWithSignedUrls);
}

// ---------- DELETE — Remove student from database & storage ----------

export async function DELETE(req) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const examId = searchParams.get('examId');

  if (!studentId || !examId) {
    return Response.json({ error: 'Missing parameters' }, { status: 400 });
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

  // 2. Fetch student to get storage path and verify existence in this exam
  const { data: student, error: fetchError } = await supabase
    .from('students')
    .select('id, answer_sheet_url')
    .eq('id', studentId)
    .eq('exam_id', examId)
    .single();

  if (fetchError || !student) {
    return Response.json({ error: 'Student not found in this exam' }, { status: 404 });
  }

  // 3. Delete child records defensively before deleting student row
  // (In case remote DB migration 006 ON DELETE CASCADE was not yet applied)
  await supabase.from('copy_flags').delete().or(`student_a_id.eq.${studentId},student_b_id.eq.${studentId}`);
  await supabase.from('recheck_requests').delete().eq('student_id', studentId);
  await supabase.from('answers').delete().eq('student_id', studentId);

  // 4. Delete student from database
  const { error: deleteError } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId)
    .eq('exam_id', examId);

  if (deleteError) {
    return Response.json({ error: `Failed to delete student: ${deleteError.message}` }, { status: 500 });
  }

  // 5. Remove orphaned file from Supabase Storage
  if (student.answer_sheet_url) {
    await deleteAnswerSheetFile(supabase, student.answer_sheet_url);
  }

  await updateExamStatus(examId, supabase);

  return Response.json({ success: true });
}

// ---------- PATCH — Update student information ----------

export async function PATCH(req) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { studentId, examId, student_name, roll_number } = body;

    if (!studentId || !examId) return Response.json({ error: 'Missing parameters' }, { status: 400 });

    const supabase = supabaseServer();

    // 1. Verify exam ownership
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id')
      .eq('id', examId)
      .eq('teacher_id', user.id)
      .single();

    if (examError || !exam) return Response.json({ error: 'Exam not found or access denied' }, { status: 404 });

    // 2. Sanitize and validate inputs
    const updates = {};
    if (student_name !== undefined) {
      const trimmedName = String(student_name).trim();
      if (!trimmedName || trimmedName.length > 200) {
        return Response.json({ error: 'Student name must be between 1 and 200 characters' }, { status: 400 });
      }
      updates.student_name = trimmedName;
    }
    if (roll_number !== undefined) {
      const trimmedRoll = String(roll_number).trim();
      if (!trimmedRoll || trimmedRoll.length > 50) {
        return Response.json({ error: 'Roll number must be between 1 and 50 characters' }, { status: 400 });
      }
      updates.roll_number = trimmedRoll;
    }

    if (Object.keys(updates).length === 0) return Response.json({ success: true });

    // 3. Update student scoped strictly to this verified examId
    const { data: updatedStudent, error: updateError } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentId)
      .eq('exam_id', examId)
      .select('id')
      .single();

    if (updateError || !updatedStudent) {
      return Response.json({ error: 'Student not found in this exam' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
