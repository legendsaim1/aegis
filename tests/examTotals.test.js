import { describe, it, expect } from 'vitest';
import { getExamTotalMarks, getGradableQuestions } from '@/lib/utils/examTotals';

describe('Exam Total Marks Calculation (P1-10)', () => {
  it('calculates total marks accurately for flat questions', () => {
    const questions = [
      { id: '1', question_number: 1, sub_part: null, max_marks: 10 },
      { id: '2', question_number: 2, sub_part: null, max_marks: 25 },
      { id: '3', question_number: 3, sub_part: null, max_marks: 15 },
    ];

    const total = getExamTotalMarks(questions, { total_marks: 100 });
    expect(total).toBe(50);
  });

  it('calculates total marks accurately when sub-parts are present', () => {
    // Q1 is a parent container with 0 marks, and subparts 1(a) and 1(b) carry the real marks
    const questions = [
      { id: '1', question_number: 1, sub_part: null, max_marks: 0 },
      { id: '1a', question_number: 1, sub_part: 'a', max_marks: 5 },
      { id: '1b', question_number: 1, sub_part: 'b', max_marks: 5 },
      { id: '2', question_number: 2, sub_part: null, max_marks: 10 },
    ];

    const gradable = getGradableQuestions(questions);
    expect(gradable.length).toBe(3);
    expect(gradable.map(q => q.id)).toEqual(['1a', '1b', '2']);

    const total = getExamTotalMarks(questions, { total_marks: 100 });
    expect(total).toBe(20);
  });

  it('falls back to exam.total_marks when no questions exist yet', () => {
    expect(getExamTotalMarks([], { total_marks: 75 })).toBe(75);
    expect(getExamTotalMarks(null, { total_marks: 60 })).toBe(60);
  });

  it('defaults to 100 if both questions and exam.total_marks are empty or 0', () => {
    expect(getExamTotalMarks([], { total_marks: 0 })).toBe(100);
    expect(getExamTotalMarks([], {})).toBe(100);
    expect(getExamTotalMarks(null, null)).toBe(100);
  });

  it('handles string numeric values gracefully', () => {
    const questions = [
      { id: '1', question_number: 1, max_marks: '10' },
      { id: '2', question_number: 2, max_marks: '15' },
    ];

    expect(getExamTotalMarks(questions)).toBe(25);
  });
});
