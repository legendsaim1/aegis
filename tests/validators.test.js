import { describe, it, expect } from 'vitest';
import { validateMarks, validateRequired, validatePositiveNumber } from '@/lib/utils/validators';

describe('Mark Overrides & Input Validators (P1-12)', () => {
  describe('validateMarks', () => {
    it('accepts valid marks within bounds [0, maxMarks]', () => {
      expect(validateMarks(0, 10)).toBe(true);
      expect(validateMarks(5, 10)).toBe(true);
      expect(validateMarks(10, 10)).toBe(true);
      expect(validateMarks(2.5, 5)).toBe(true);
      expect(validateMarks('4.5', 5)).toBe(true);
    });

    it('rejects negative marks', () => {
      expect(validateMarks(-1, 10)).toBe(false);
      expect(validateMarks(-0.5, 10)).toBe(false);
    });

    it('rejects marks that exceed maxMarks (upper bound violation)', () => {
      expect(validateMarks(11, 10)).toBe(false);
      expect(validateMarks(55, 5)).toBe(false); // Common typo: 55 instead of 5.5
      expect(validateMarks(101, 100)).toBe(false);
    });

    it('rejects NaN, Infinity, and non-numeric inputs', () => {
      expect(validateMarks(NaN, 10)).toBe(false);
      expect(validateMarks(Infinity, 10)).toBe(false);
      expect(validateMarks('abc', 10)).toBe(false);
      expect(validateMarks(null, 10)).toBe(false);
      expect(validateMarks(undefined, 10)).toBe(false);
    });

    it('allows valid non-negative numbers when maxMarks is not specified', () => {
      expect(validateMarks(50)).toBe(true);
      expect(validateMarks(0)).toBe(true);
      expect(validateMarks(-5)).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('validates presence of required fields', () => {
      const valid = validateRequired({ title: 'Test', subject: 'Math' }, ['title', 'subject']);
      expect(valid.valid).toBe(true);
      expect(valid.missing).toEqual([]);

      const invalid = validateRequired({ title: 'Test' }, ['title', 'subject']);
      expect(invalid.valid).toBe(false);
      expect(invalid.missing).toEqual(['subject']);
    });
  });
});
