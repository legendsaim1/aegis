import { describe, it, expect } from 'vitest';
import { calculateConfidence } from '@/lib/utils/confidence';

describe('Confidence & Review Assessment (calculateConfidence)', () => {
  it('combines OCR (40%) and grading (60%) correctly', () => {
    // 0.8 * 0.4 + 0.9 * 0.6 = 0.32 + 0.54 = 0.86
    const result = calculateConfidence(0.8, 0.9);
    expect(result.combined).toBe(0.86);
    expect(result.needsReview).toBe(false);
    expect(result.flagReason).toBeNull();
  });

  it('flags needsReview when combined confidence is below 0.75', () => {
    // 0.6 * 0.4 + 0.7 * 0.6 = 0.24 + 0.42 = 0.66
    const result = calculateConfidence(0.6, 0.7);
    expect(result.combined).toBe(0.66);
    expect(result.needsReview).toBe(true);
    expect(result.flagReason).toBeTruthy();
  });

  it('specifies low OCR legibility reason when OCR < 0.5', () => {
    const result = calculateConfidence(0.3, 0.85);
    expect(result.needsReview).toBe(true);
    expect(result.flagReason).toContain('Low OCR legibility');
  });

  it('specifies low grading confidence reason when grading < 0.6', () => {
    const result = calculateConfidence(0.8, 0.5);
    expect(result.needsReview).toBe(true);
    expect(result.flagReason).toContain('Low grading confidence');
  });

  it('triggers review via floor safeguard when grading is below 0.6 even if OCR is high', () => {
    // 1.0 * 0.4 + 0.59 * 0.6 = 0.40 + 0.354 = 0.754 (combined is >= 0.75, but grading is < 0.6)
    const result = calculateConfidence(1.0, 0.59);
    expect(result.needsReview).toBe(true);
    expect(result.flagReason).toContain('Low grading confidence');
  });

  it('handles null and undefined inputs safely', () => {
    const result = calculateConfidence(null, undefined);
    expect(result.combined).toBe(0);
    expect(result.needsReview).toBe(true);
  });
});
