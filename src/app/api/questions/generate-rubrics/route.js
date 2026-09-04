import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { validateRequired } from '@/lib/utils/validators';
import { callAI } from '@/lib/ai/provider';
import { cleanAndParseJson } from '@/lib/utils/jsonParser';

export async function POST(req) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { questionText, questionType, maxMarks, subject } = body;

  // We only strictly require the question text now
  const { valid, missing } = validateRequired(body, ['questionText']);
  if (!valid) {
    return Response.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
  }

  try {
    const result = await callAI({
      task: 'rubrics',
      params: {
        question_text: questionText,
        question_type: questionType || 'short',
        max_marks: maxMarks || 5,
        subject: subject || 'General',
      },
      isJson: true,
    });

    let rubricJson;
    try {
      // The AI should return JSON, let's verify and format it
      rubricJson = JSON.stringify(cleanAndParseJson(result.text));
    } catch {
      return Response.json({ error: 'AI returned invalid rubric JSON' }, { status: 502 });
    }

    // Just return it to the frontend! Let the frontend handle saving it.
    return Response.json({ success: true, rubric: rubricJson });
  } catch (error) {
    return Response.json({ error: `Rubric generation failed: ${error.message}` }, { status: 500 });
  }
}