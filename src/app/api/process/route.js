import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { validateRequired } from '@/lib/utils/validators';
import { runGradingPipeline } from '@/lib/processing/pipeline';
import { updateExamStatus } from '@/lib/utils/examStatus';
import { createLogger } from '@/lib/utils/logger';

// 300 seconds is the maximum limit for Hobby plans to prevent timeouts
export const maxDuration = 300;

export async function POST(req) {
  const reqId = `req-${Math.random().toString(36).substring(2, 9)}`;
  const log = createLogger('ProcessAPI', reqId);

  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { examId, studentId, enableCopyDetection, forceRetry } = body;

  const { valid, missing } = validateRequired(body, ['examId', 'studentId']);
  if (!valid) {
    return Response.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
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

  // 2. Verify student belongs to exam and check retryability with TTL recovery
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, status, processed_at')
    .eq('id', studentId)
    .eq('exam_id', examId)
    .single();

  if (studentError || !student) {
    return Response.json({ error: 'Student not found' }, { status: 404 });
  }

  // A student stuck in 'processing' for > 10 minutes (600,000 ms) is considered stale due to serverless timeout
  const STALE_TIMEOUT_MS = 10 * 60 * 1000;
  const isStaleProcessing = student.status === 'processing' && (
    !student.processed_at || (Date.now() - new Date(student.processed_at).getTime() > STALE_TIMEOUT_MS)
  );

  const retryableStatuses = ['pending', 'uploaded', 'error', 'graded', 'review'];
  const isEligible = retryableStatuses.includes(student.status) || isStaleProcessing || Boolean(forceRetry);

  if (!isEligible) {
    return Response.json({ error: 'Student is currently being processed' }, { status: 409 });
  }

  const now = new Date().toISOString();

  // 3. Atomically claim the student row with timestamp so duplicate requests cannot process it concurrently
  const { data: lockedRows, error: lockError } = await supabase
    .from('students')
    .update({ status: 'processing', processed_at: now })
    .eq('id', studentId)
    .eq('exam_id', examId)
    .select('id');

  if (lockError) {
    return Response.json({ error: `Failed to lock student for processing: ${lockError.message}` }, { status: 500 });
  }

  if (!lockedRows || lockedRows.length !== 1) {
    return Response.json({ error: 'Student is already being processed or is no longer retryable' }, { status: 409 });
  }

  try {
    // Run the pipeline and wait for it to finish
    const results = await runGradingPipeline(studentId, examId, enableCopyDetection, reqId, user.id);

    // Update exam status based on new student states
    await updateExamStatus(examId, supabase);

    if (results.status !== 'graded') {
      return Response.json({
        success: false,
        reviewRequired: true,
        message: results.error || 'Grading requires teacher review',
        data: results,
      }, { status: 422 });
    }

    return Response.json({
      success: true,
      reviewRequired: false,
      message: 'Grading complete',
      data: results
    });
  } catch (error) {
    // If it crashes, revert to error so it is not silently retried without teacher intervention.
    log.error(`Pipeline crashed`, { studentId, error: error.message });
    await supabase.from('students').update({ status: 'error', processed_at: new Date().toISOString() }).eq('id', studentId);
    
    // Update exam status on error
    await updateExamStatus(examId, supabase);
    
    return Response.json({ error: `Pipeline failed: ${error.message}` }, { status: 500 });
  }
}
