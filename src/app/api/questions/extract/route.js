import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { callAI } from '@/lib/ai/provider';
import { createLogger } from '@/lib/utils/logger';
import { cleanAndParseJson } from '@/lib/utils/jsonParser';

// 60 seconds should be enough for OCR extraction
export const maxDuration = 90;

export async function POST(req) {
  const reqId = `req-${Math.random().toString(36).substring(2, 9)}`;
  const log = createLogger('QuestionsExtractAPI', reqId);

  try {
    const user = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'Missing file field' }, { status: 400 });
    }

    const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ALLOWED_EXT   = /\.(pdf|jpg|jpeg|png|webp)$/i;
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

    if (typeof file === 'string' || !ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXT.test(file.name || '')) {
      return Response.json(
        { error: 'Invalid file type. Only PDF, JPG, PNG, and WebP are accepted.' },
        { status: 415 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: 'File size exceeds the 20MB limit.' },
        { status: 413 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    log.info(`Running question extraction for file`, { filename: file.name });
    
    const response = await callAI({
      task: 'questionExtract',
      params: {}, // Prompt doesn't require params
      fileBuffer,
      mimeType: file.type,
      isJson: true,
      reqId
    });

    let extractedQuestions;
    try {
      const parsedResponse = cleanAndParseJson(response.text);
      // AI may return an array directly, or an object containing an array.
      // The prompt says "EXPECTED JSON FORMAT: [ ... ]" so it should be an array.
      if (!Array.isArray(parsedResponse)) {
        if (parsedResponse.questions && Array.isArray(parsedResponse.questions)) {
          extractedQuestions = parsedResponse.questions;
        } else {
          return Response.json({ error: 'AI returned malformed data format' }, { status: 500 });
        }
      } else {
        extractedQuestions = parsedResponse;
      }
    } catch {
      return Response.json({ error: 'AI returned invalid JSON' }, { status: 500 });
    }

    return Response.json({ success: true, data: extractedQuestions }, { status: 200 });
  } catch (error) {
    log.error(`Question Extract API Error`, { error: error.message, stack: error.stack });
    return Response.json({ error: `Extraction failed: ${error.message}` }, { status: 500 });
  }
}
