import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runCopyDetection } from './copyDetection';
import { supabaseServer } from '@/lib/supabase/server';
import { filterCandidatesForQuestion } from '@/lib/utils/copyDetectionFilter';
import { callAI } from '@/lib/ai/provider';

const mocks = vi.hoisted(() => ({
  supabaseServer: vi.fn(),
  filterCandidatesForQuestion: vi.fn(),
  callAI: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ supabaseServer: mocks.supabaseServer }));
vi.mock('@/lib/utils/copyDetectionFilter', () => ({ filterCandidatesForQuestion: mocks.filterCandidatesForQuestion }));
vi.mock('@/lib/ai/provider', () => ({ callAI: mocks.callAI }));

describe('runCopyDetection chunking and error handling', () => {
  let mockSupabase;
  let deletedExamId = null;
  let insertedData = null;

  beforeEach(() => {
    vi.clearAllMocks();
    deletedExamId = null;
    insertedData = null;

    mockSupabase = {
      from: vi.fn().mockImplementation((table) => {
        if (table === 'exams') {
          const query = {
            select: () => query,
            eq: () => query,
            single: () => query,
            then: (resolve) => resolve({ data: { id: 'exam-1' }, error: null }),
          };
          return query;
        }
        if (table === 'questions') {
          const query = {
            select: () => query,
            eq: () => query,
            then: (resolve) => resolve({ data: [{ id: 'q1', max_marks: 5, rubric_json: null }], error: null }),
          };
          return query;
        }
        if (table === 'students') {
          const query = {
            select: () => query,
            eq: () => query,
            then: (resolve) => resolve({ data: [{ id: 's1' }, { id: 's2' }, { id: 's3' }], error: null }),
          };
          return query;
        }
        if (table === 'answers') {
          const query = {
            select: () => query,
            in: () => query,
            then: (resolve) => resolve({ data: [], error: null }),
          };
          return query;
        }
        if (table === 'copy_flags') {
          const query = {
            delete: () => query,
            insert: (data) => {
              insertedData = data;
              return query;
            },
            eq: (col, val) => {
              if (col === 'exam_id') {
                deletedExamId = val;
              }
              return query;
            },
            then: (resolve) => resolve({ error: null }),
          };
          return query;
        }
      }),
    };

    mocks.supabaseServer.mockReturnValue(mockSupabase);
  });

  it('processes candidates in single chunk if count <= 10', async () => {
    // Generate 8 candidates
    const candidates = Array.from({ length: 8 }, (_, i) => ({
      studentA: `student-${i}-A`,
      studentB: `student-${i}-B`,
      questionId: 'q1',
      textA: 'Answer A',
      textB: 'Answer B',
      score: 0.8,
    }));

    mocks.filterCandidatesForQuestion.mockReturnValue(candidates);

    mocks.callAI.mockResolvedValueOnce({
      text: JSON.stringify({
        results: candidates.map((c, i) => ({
          student_a: c.studentA,
          student_b: c.studentB,
          question_id: c.questionId,
          confirmed: i % 2 === 0, // confirm half
          reason: 'similar answers',
        })),
      }),
    });

    const result = await runCopyDetection('exam-1', 'teacher-1');

    expect(mocks.callAI).toHaveBeenCalledTimes(1);
    expect(result.candidatesAnalyzed).toBe(8);
    expect(result.flaggedCount).toBe(4);
    expect(deletedExamId).toBe('exam-1');
    expect(insertedData).toHaveLength(4);
  });

  it('processes candidates in multiple chunks sequentially if count > 10', async () => {
    // Generate 15 candidates -> should result in 2 chunks (10 and 5)
    const candidates = Array.from({ length: 15 }, (_, i) => ({
      studentA: `student-${i}-A`,
      studentB: `student-${i}-B`,
      questionId: 'q1',
      textA: 'Answer A',
      textB: 'Answer B',
      score: 0.8,
    }));

    mocks.filterCandidatesForQuestion.mockReturnValue(candidates);

    // Mock first chunk (10 candidates)
    mocks.callAI.mockResolvedValueOnce({
      text: JSON.stringify({
        results: candidates.slice(0, 10).map((c) => ({
          student_a: c.studentA,
          student_b: c.studentB,
          question_id: c.questionId,
          confirmed: true,
          reason: 'similar answers',
        })),
      }),
    });

    // Mock second chunk (5 candidates)
    mocks.callAI.mockResolvedValueOnce({
      text: JSON.stringify({
        results: candidates.slice(10, 15).map((c) => ({
          student_a: c.studentA,
          student_b: c.studentB,
          question_id: c.questionId,
          confirmed: true,
          reason: 'similar answers',
        })),
      }),
    });

    const result = await runCopyDetection('exam-1', 'teacher-1');

    expect(mocks.callAI).toHaveBeenCalledTimes(2);
    expect(result.candidatesAnalyzed).toBe(15);
    expect(result.flaggedCount).toBe(15);
    expect(insertedData).toHaveLength(15);
  });

  it('handles partial chunk failure gracefully and continues other chunks', async () => {
    // Generate 12 candidates -> 2 chunks (10 and 2)
    const candidates = Array.from({ length: 12 }, (_, i) => ({
      studentA: `student-${i}-A`,
      studentB: `student-${i}-B`,
      questionId: 'q1',
      textA: 'Answer A',
      textB: 'Answer B',
      score: 0.8,
    }));

    mocks.filterCandidatesForQuestion.mockReturnValue(candidates);

    // Mock first chunk to fail
    mocks.callAI.mockRejectedValueOnce(new Error('Groq rate limit exceeded'));

    // Mock second chunk to succeed (2 candidates, both confirmed)
    mocks.callAI.mockResolvedValueOnce({
      text: JSON.stringify({
        results: candidates.slice(10, 12).map((c) => ({
          student_a: c.studentA,
          student_b: c.studentB,
          question_id: c.questionId,
          confirmed: true,
          reason: 'similar answers',
        })),
      }),
    });

    const result = await runCopyDetection('exam-1', 'teacher-1');

    expect(mocks.callAI).toHaveBeenCalledTimes(2);
    expect(result.candidatesAnalyzed).toBe(12);
    expect(result.flaggedCount).toBe(2);
    expect(insertedData).toHaveLength(2);
  });

  it('throws an error if all chunks fail', async () => {
    const candidates = Array.from({ length: 5 }, (_, i) => ({
      studentA: `student-${i}-A`,
      studentB: `student-${i}-B`,
      questionId: 'q1',
      textA: 'Answer A',
      textB: 'Answer B',
      score: 0.8,
    }));

    mocks.filterCandidatesForQuestion.mockReturnValue(candidates);
    mocks.callAI.mockRejectedValueOnce(new Error('AI crash'));

    await expect(runCopyDetection('exam-1', 'teacher-1')).rejects.toThrow('AI Copy Detection failed completely: AI crash');
  });
});
