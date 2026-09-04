import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { callAI } from '@/lib/ai/provider';
import { createLogger } from '@/lib/utils/logger';
import { cleanAndParseJson } from '@/lib/utils/jsonParser';

// 60 seconds should be enough for OCR extraction
export const maxDuration = 120;

export async function POST(req) {
  const reqId = `req-${Math.random().toString(36).substring(2, 9)}`;
  const log = createLogger('ExtractAPI', reqId);

  try {
    const user = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const examId = formData.get('examId');
    const file = formData.get('file');

    if (!examId || !file) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
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

    const supabase = supabaseServer();

    // 1. Verify the teacher owns this exam
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('subject, questions(question_number, sub_part)')
      .eq('id', examId)
      .eq('teacher_id', user.id)
      .single();

    if (examError || !exam) {
      return Response.json({ error: 'Exam not found or access denied' }, { status: 404 });
    }

    if (!exam.questions || exam.questions.length === 0) {
      return Response.json({ error: 'No questions found for this exam' }, { status: 400 });
    }

    const questionsList = exam.questions.map(q => 
      `${q.question_number}${q.sub_part ? ` (${q.sub_part})` : ''}`
    );

    log.info(`Running OCR for exam`, { examId, file: file.name });

    // 3. Extract text using AI OCR
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    const ocrResult = await callAI({
      task: 'ocr',
      params: {
        questionsList,
        subjectName: exam.subject || 'General',
      },
      fileBuffer,
      mimeType: file.type,
      isJson: true,
      reqId
    });

    try {
      const aiEval = cleanAndParseJson(ocrResult.text);
      return Response.json({ success: true, data: aiEval }, { status: 200 });
    } catch (parseError) {
      log.error(`OCR JSON parse failed: ${parseError.message}`, { rawText: ocrResult.text?.substring(0, 200) });
      return Response.json({ error: `OCR returned invalid JSON: ${parseError.message}` }, { status: 500 });
    }
  } catch (error) {
    log.error(`Extract API Error`, { error: error.message, stack: error.stack });
    return Response.json({ error: `Extraction failed: ${error.message}` }, { status: 500 });
  }
}
