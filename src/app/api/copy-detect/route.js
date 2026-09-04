import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { validateRequired } from '@/lib/utils/validators';
import { runCopyDetection } from '@/lib/processing/copyDetection';
import { createLogger } from '@/lib/utils/logger';

// 300 seconds is the maximum limit for Hobby plans to prevent timeouts
export const maxDuration = 300;

export async function POST(req) {
  const reqId = `req-${Math.random().toString(36).substring(2, 9)}`;
  const log = createLogger('CopyDetectAPI', reqId);

  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      log.warn('Unauthorized copy detect request');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { examId } = body;

    const { valid, missing } = validateRequired(body, ['examId']);
    if (!valid) {
      log.warn('Validation failed', { missing });
      return Response.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
    }

    log.info('Starting batch copy detection scan', { examId, teacherId: user.id });

    // Await the copy detection fully before responding
    const result = await runCopyDetection(examId, user.id, reqId);

    log.info('Batch copy detection completed successfully', { result });

    return Response.json({
      success: true,
      data: result
    });

  } catch (error) {
    log.error('Fatal error in copy detect route', { error: error.message, stack: error.stack });
    return Response.json({
      error: 'Failed to complete copy detection',
      details: error.message
    }, { status: 500 });
  }
}
