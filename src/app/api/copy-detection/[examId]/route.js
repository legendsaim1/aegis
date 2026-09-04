import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { runCopyDetection } from '@/lib/processing/copyDetection';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { createLogger } from '@/lib/utils/logger';

// Helper to verify ownership
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

// GET: Fetch all flagged pairs for an exam
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const reqId = `req-${Math.random().toString(36).substring(2, 9)}`;
  const log = createLogger('CopyDetectionAPI', reqId);
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { examId } = params;
    const supabase = supabaseServer();

    // Verify ownership
    const exam = await verifyExamOwnership(supabase, examId, user.id);
    if (!exam) return NextResponse.json({ error: 'Exam not found or access denied' }, { status: 404 });

    // Fetch confirmed copy flags along with student details
    const { data: flags, error } = await supabase
      .from('copy_flags')
      .select(`
        id,
        exam_id,
        question_id,
        similarity_score,
        reason,
        confirmed,
        created_at,
        student_a:students!student_a_id (id, student_name, roll_number),
        student_b:students!student_b_id (id, student_name, roll_number),
        question:questions (question_text, question_number)
      `)
      .eq('exam_id', examId)
      .eq('confirmed', true)
      .order('similarity_score', { ascending: false });

    if (error) {
      log.error(`Error fetching copy flags`, { examId, error: error.message });
      return NextResponse.json({ error: 'Failed to fetch copy detection results' }, { status: 500 });
    }

    return NextResponse.json({ success: true, flags });
  } catch (error) {
    log.error(`API Error fetching copy flags`, { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Trigger copy detection for an exam
export async function POST(request, { params }) {
  const reqId = `req-${Math.random().toString(36).substring(2, 9)}`;
  const log = createLogger('CopyDetectionAPI', reqId);
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { examId } = params;
    const supabase = supabaseServer();

    // Verify ownership
    const exam = await verifyExamOwnership(supabase, examId, user.id);
    if (!exam) return NextResponse.json({ error: 'Exam not found or access denied' }, { status: 404 });

    // Call the orchestrator, passing teacherId
    const result = await runCopyDetection(examId, user.id, reqId);

    return NextResponse.json({ 
      success: true, 
      message: result.message,
      flaggedCount: result.flaggedCount,
      candidatesAnalyzed: result.candidatesAnalyzed
    });
  } catch (error) {
    log.error(`API Error running copy detection`, { examId, error: error.message, stack: error.stack });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}