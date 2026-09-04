import { describe, it, expect } from 'vitest';
import { cleanAndParseJson } from '@/lib/utils/jsonParser';

describe('AI JSON Sanitizer & Parser (cleanAndParseJson)', () => {
  it('parses clean valid JSON objects and arrays', () => {
    const obj = cleanAndParseJson('{"status": "success", "score": 95}');
    expect(obj).toEqual({ status: 'success', score: 95 });

    const arr = cleanAndParseJson('[1, 2, 3]');
    expect(arr).toEqual([1, 2, 3]);
  });

  it('strips markdown code blocks (```json ... ```)', () => {
    const markdownWithJson = '```json\n{\n  "questions": [\n    {"question_number": "1", "extracted_text": "Answer 1"}\n  ],\n  "overall_legibility": 0.85\n}\n```';
    const result = cleanAndParseJson(markdownWithJson);

    expect(result.questions.length).toBe(1);
    expect(result.questions[0].question_number).toBe('1');
    expect(result.overall_legibility).toBe(0.85);
  });

  it('strips plain markdown code blocks without json identifier', () => {
    const plainFence = '```\n{"obtained_marks": 5, "grading_confidence": 0.9}\n```';
    const result = cleanAndParseJson(plainFence);

    expect(result.obtained_marks).toBe(5);
    expect(result.grading_confidence).toBe(0.9);
  });

  it('extracts JSON when surrounded by conversational AI text', () => {
    const conversational = 'Here is the transcription of the student answer sheet:\n{\n  "status": "completed"\n}\nHope this helps with grading!';
    const result = cleanAndParseJson(conversational);

    expect(result).toEqual({ status: 'completed' });
  });

  it('fixes trailing commas in objects and arrays', () => {
    const trailingComma = '{"items": [1, 2, 3, ], "enabled": true, }';
    const result = cleanAndParseJson(trailingComma);

    expect(result).toEqual({ items: [1, 2, 3], enabled: true });
  });

  it('throws an error for unparseable garbage text', () => {
    expect(() => cleanAndParseJson('This is completely unparseable and contains no JSON')).toThrow();
  });

  it('throws when given non-string inputs', () => {
    expect(() => cleanAndParseJson(null)).toThrow();
    expect(() => cleanAndParseJson(123)).toThrow();
  });
});
