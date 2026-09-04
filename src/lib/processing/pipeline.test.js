import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  callAI: vi.fn(),
  supabaseServer: vi.fn(),
  getGroqKeyCount: vi.fn(() => 3),
}));

vi.mock('@/lib/ai/provider', () => ({ callAI: mocks.callAI }));
vi.mock('@/lib/supabase/server', () => ({ supabaseServer: mocks.supabaseServer }));
vi.mock('@/lib/ai/groq/client', () => ({ getGroqKeyCount: mocks.getGroqKeyCount }));

import { runGradingPipeline } from './pipeline';

const question = (overrides = {}) => ({
  id: 'question-1',
  question_number: '1',
  sub_part: 'a',
  question_text: 'Explain the answer.',
  question_type: 'short',
  max_marks: 5,
  rubric_json: null,
  teacher_instructions: null,
  ...overrides,
});

const createSupabase = ({ questions, student = { answer_sheet_url: 'https://example.test/answer.pdf' } }) => {
  const state = { answerInserts: [], studentUpdates: [] };

  return {
    state,
    client: {
      from(table) {
        if (table === 'students') {
          return {
            select: () => ({
              eq: () => ({ single: async () => ({ data: student, error: null }) }),
            }),
            update: (payload) => ({
              eq: async () => {
                state.studentUpdates.push(payload);
                return { error: null };
              },
            }),
          };
        }

        if (table === 'questions') {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  order: async () => ({ data: questions, error: null }),
                }),
              }),
            }),
          };
        }

        if (table === 'exams') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: { subject: 'Math', instructions: '' }, error: null }),
              }),
            }),
          };
        }

        if (table === 'answers') {
          return {
            delete: () => ({ eq: async () => ({ error: null }) }),
            insert: async (rows) => {
              state.answerInserts.push(rows);
              return { error: null };
            },
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      },
    },
  };
};

const mockPdfDownload = () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(1),
  }));
};

describe('runGradingPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    mockPdfDownload();
  });

  it('clamps out-of-range marks and grading confidence before persisting totals', async () => {
    const supabase = createSupabase({ questions: [question()] });
    mocks.supabaseServer.mockReturnValue(supabase.client);
    mocks.callAI.mockImplementation(async ({ task }) => {
      if (task === 'ocr') {
        return { text: JSON.stringify({
          overall_legibility: 0.9,
          questions: [{ question_label: '1 (a)', extracted_text: 'My answer', ocr_confidence: 0.9 }],
        }) };
      }

      return { text: JSON.stringify({
        obtained_marks: 99,
        grading_confidence: 2,
        feedback: 'Correct.',
      }) };
    });

    const result = await runGradingPipeline('student-1', 'exam-1');
    const [savedAnswer] = supabase.state.answerInserts[0];

    expect(savedAnswer.obtained_marks).toBe(5);
    expect(savedAnswer.grading_confidence_score).toBe(1);
    expect(savedAnswer.needs_review).toBe(true);
    expect(savedAnswer.flag_reason).toContain('AI marks were outside allowed range');
    expect(savedAnswer.flag_reason).toContain('AI grading confidence was outside allowed range');
    expect(result.totalMarks).toBe(5);
    expect(result.gradingConfidence).toBe(1);
  });

  it('falls back safely when the AI returns a non-numeric grading confidence', async () => {
    const supabase = createSupabase({ questions: [question()] });
    mocks.supabaseServer.mockReturnValue(supabase.client);
    mocks.callAI.mockImplementation(async ({ task }) => {
      if (task === 'ocr') {
        return { text: JSON.stringify({
          overall_legibility: 0.9,
          questions: [{ question_label: '1 (a)', extracted_text: 'My answer', ocr_confidence: 0.9 }],
        }) };
      }

      return { text: JSON.stringify({
        obtained_marks: 3,
        grading_confidence: 'not a number',
        feedback: 'Correct.',
      }) };
    });

    const result = await runGradingPipeline('student-1', 'exam-1');
    const [savedAnswer] = supabase.state.answerInserts[0];

    expect(savedAnswer.grading_confidence_score).toBe(0.3);
    expect(savedAnswer.needs_review).toBe(true);
    expect(savedAnswer.flag_reason).toContain('AI returned non-numeric grading confidence');
    expect(result.gradingConfidence).toBe(0.3);
  });

  it('creates review rows for every question when OCR returns invalid JSON', async () => {
    const questions = [question(), question({ id: 'question-2', question_number: '2', sub_part: null })];
    const supabase = createSupabase({ questions });
    mocks.supabaseServer.mockReturnValue(supabase.client);
    mocks.callAI.mockResolvedValue({ text: '{not valid JSON' });

    const result = await runGradingPipeline('student-1', 'exam-1');

    expect(mocks.callAI).toHaveBeenCalledTimes(1);
    expect(supabase.state.answerInserts).toHaveLength(1);
    expect(supabase.state.answerInserts[0]).toHaveLength(2);
    expect(supabase.state.answerInserts[0]).toEqual(expect.arrayContaining([
      expect.objectContaining({ question_id: 'question-1', needs_review: true, flag_reason: 'OCR returned invalid JSON' }),
      expect.objectContaining({ question_id: 'question-2', needs_review: true, flag_reason: 'OCR returned invalid JSON' }),
    ]));
    expect(supabase.state.studentUpdates).toContainEqual(expect.objectContaining({ status: 'error' }));
    expect(result).toMatchObject({ status: 'error', totalMarks: 0, error: 'OCR returned invalid JSON' });
  });

  it('creates review rows when OCR questions is not an array', async () => {
    const questions = [question(), question({ id: 'question-2', question_number: '2', sub_part: null })];
    const supabase = createSupabase({ questions });
    mocks.supabaseServer.mockReturnValue(supabase.client);
    mocks.callAI.mockResolvedValue({ text: JSON.stringify({ questions: {}, overall_legibility: 0.7 }) });

    const result = await runGradingPipeline('student-1', 'exam-1');

    expect(mocks.callAI).toHaveBeenCalledTimes(1);
    expect(supabase.state.answerInserts[0]).toHaveLength(2);
    expect(supabase.state.answerInserts[0]).toEqual(expect.arrayContaining([
      expect.objectContaining({ question_id: 'question-1', needs_review: true, flag_reason: 'OCR questions must be an array' }),
      expect.objectContaining({ question_id: 'question-2', needs_review: true, flag_reason: 'OCR questions must be an array' }),
    ]));
    expect(result).toMatchObject({ status: 'error', totalMarks: 0, error: 'OCR questions must be an array' });
  });

  it('clamps out-of-range OCR confidence and flags the answer for review', async () => {
    const supabase = createSupabase({ questions: [question()] });
    mocks.supabaseServer.mockReturnValue(supabase.client);
    mocks.callAI.mockImplementation(async ({ task }) => {
      if (task === 'ocr') {
        return { text: JSON.stringify({
          overall_legibility: 0.9,
          questions: [{ question_label: 'Q1(a)', extracted_text: 'Matched OCR text', ocr_confidence: 1.7 }],
        }) };
      }

      return { text: JSON.stringify({
        obtained_marks: 3,
        grading_confidence: 0.95,
        feedback: 'Partially correct.',
      }) };
    });

    await runGradingPipeline('student-1', 'exam-1');
    const [savedAnswer] = supabase.state.answerInserts[0];

    expect(savedAnswer.ocr_confidence_score).toBe(1);
    expect(savedAnswer.needs_review).toBe(true);
    expect(savedAnswer.flag_reason).toContain('OCR confidence was outside allowed range');
  });

  it('creates a zero-mark review row when OCR text is not a string', async () => {
    const supabase = createSupabase({ questions: [question()] });
    mocks.supabaseServer.mockReturnValue(supabase.client);
    mocks.callAI.mockResolvedValueOnce({ text: JSON.stringify({
      overall_legibility: 0.9,
      questions: [{ question_label: 'Q1(a)', extracted_text: { nested: 'bad' }, ocr_confidence: 0.8 }],
    }) });

    const result = await runGradingPipeline('student-1', 'exam-1');
    const [savedAnswer] = supabase.state.answerInserts[0];

    expect(mocks.callAI).toHaveBeenCalledTimes(1);
    expect(savedAnswer).toMatchObject({
      question_id: 'question-1',
      extracted_text: '',
      obtained_marks: 0,
      grading_confidence_score: 0,
      needs_review: true,
    });
    expect(savedAnswer.flag_reason).toContain('OCR entry is missing valid extracted text');
    expect(result.totalMarks).toBe(0);
  });

  it('creates a zero-mark review row when OCR labels do not match any question', async () => {
    const supabase = createSupabase({ questions: [question()] });
    mocks.supabaseServer.mockReturnValue(supabase.client);
    mocks.callAI.mockResolvedValueOnce({ text: JSON.stringify({
      overall_legibility: 0.9,
      questions: [{ question_label: 'Q999', extracted_text: 'Wrongly labelled answer', ocr_confidence: 0.8 }],
    }) });

    const result = await runGradingPipeline('student-1', 'exam-1');
    const [savedAnswer] = supabase.state.answerInserts[0];

    expect(mocks.callAI).toHaveBeenCalledTimes(1);
    expect(savedAnswer).toMatchObject({
      question_id: 'question-1',
      extracted_text: '',
      obtained_marks: 0,
      grading_confidence_score: 0,
      needs_review: true,
    });
    expect(savedAnswer.flag_reason).toContain('OCR did not return a matching answer for this question');
    expect(result.totalMarks).toBe(0);
  });

  it('matches OCR label Q1(a) to question 1 (a)', async () => {
    const supabase = createSupabase({ questions: [question()] });
    mocks.supabaseServer.mockReturnValue(supabase.client);
    mocks.callAI.mockImplementation(async ({ task }) => {
      if (task === 'ocr') {
        return { text: JSON.stringify({
          overall_legibility: 0.95,
          questions: [{ question_label: 'Q1(a)', extracted_text: 'Matched OCR text', ocr_confidence: 0.95 }],
        }) };
      }

      return { text: JSON.stringify({
        obtained_marks: 3,
        grading_confidence: 0.95,
        feedback: 'Partially correct.',
      }) };
    });

    await runGradingPipeline('student-1', 'exam-1');
    const [savedAnswer] = supabase.state.answerInserts[0];

    expect(savedAnswer.extracted_text).toBe('Matched OCR text');
    expect(savedAnswer.flag_reason).toBeNull();
    expect(savedAnswer.needs_review).toBe(false);
  });

  it('continues grading remaining questions when one grading call fails', async () => {
    const questions = [
      question(),
      question({ id: 'question-2', question_number: '2', sub_part: null, max_marks: 4 }),
    ];
    const supabase = createSupabase({ questions });
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation((callback) => {
      callback();
      return 0;
    });

    mocks.supabaseServer.mockReturnValue(supabase.client);
    let gradingCallCount = 0;
    mocks.callAI.mockImplementation(async ({ task }) => {
      if (task === 'ocr') {
        return { text: JSON.stringify({
          overall_legibility: 0.9,
          questions: [
            { question_label: 'Q1(a)', extracted_text: 'First answer', ocr_confidence: 0.9 },
            { question_label: 'Q2', extracted_text: 'Second answer', ocr_confidence: 0.9 },
          ],
        }) };
      }

      gradingCallCount++;
      if (gradingCallCount === 1) {
        throw new Error('provider exhausted retries');
      }

      return { text: JSON.stringify({
        obtained_marks: 3,
        grading_confidence: 0.8,
        feedback: 'Good second answer.',
      }) };
    });

    const result = await runGradingPipeline('student-1', 'exam-1');
    const savedAnswers = supabase.state.answerInserts[0];

    expect(savedAnswers).toHaveLength(2);
    expect(savedAnswers).toEqual(expect.arrayContaining([
      expect.objectContaining({
        question_id: 'question-1',
        obtained_marks: 0,
        grading_confidence_score: 0,
        needs_review: true,
        flag_reason: expect.stringContaining('AI call failed: provider exhausted retries'),
      }),
      expect.objectContaining({
        question_id: 'question-2',
        obtained_marks: 3,
        grading_confidence_score: 0.8,
        needs_review: false,
      }),
    ]));
    expect(result.totalMarks).toBe(3);
    expect(result.status).toBe('graded');

    setTimeoutSpy.mockRestore();
  });

  it('initializes parallel grading concurrency based on available Groq keys', async () => {
    const questions = [
      question(),
      question({ id: 'question-2', question_number: '2', sub_part: null }),
    ];
    const supabase = createSupabase({ questions });
    mocks.getGroqKeyCount.mockReturnValue(3);

    let gradingCalls = 0;
    mocks.callAI.mockImplementation(async ({ task }) => {
      if (task === 'ocr') {
        return { text: JSON.stringify({
          overall_legibility: 0.9,
          questions: [
            { question_label: 'Q1(a)', extracted_text: 'Answer 1', ocr_confidence: 0.9 },
            { question_label: 'Q2', extracted_text: 'Answer 2', ocr_confidence: 0.9 },
          ],
        }) };
      }

      gradingCalls++;
      return { text: JSON.stringify({
        obtained_marks: 3,
        grading_confidence: 0.8,
        feedback: 'Good.',
      }) };
    });

    const result = await runGradingPipeline('student-1', 'exam-1');

    expect(gradingCalls).toBe(2);
    expect(result.status).toBe('graded');
    expect(result.totalMarks).toBe(6);
  });
});
