/**
 * Calculates a combined estimated confidence score from OCR and grading confidence.
 * OCR confidence is weighted 40%, grading confidence is weighted 60%.
 *
 * Threshold:
 * - Overall combined threshold: 0.75 (75%)
 * - Individual floor safeguards: OCR < 0.50 or Grading < 0.60 trigger review
 *
 * @param {number} ocrConfidence - 0.0 to 1.0 from Gemini OCR
 * @param {number} gradingConfidence - 0.0 to 1.0 from Groq grading
 * @returns {{ combined: number, needsReview: boolean, flagReason: string|null }}
 */
export function calculateConfidence(ocrConfidence, gradingConfidence) {
  const ocr = Math.max(0, Math.min(1, Number(ocrConfidence) || 0));
  const grading = Math.max(0, Math.min(1, Number(gradingConfidence) || 0));

  const combined = (ocr * 0.4) + (grading * 0.6);
  const roundedCombined = Math.round(combined * 100) / 100;

  let needsReview = false;
  let flagReason = null;

  // 1. Primary rule: Combined confidence below 0.75 (75%)
  if (roundedCombined < 0.75) {
    needsReview = true;

    if (ocr < 0.5 && grading < 0.75) {
      flagReason = 'Low OCR legibility and low grading confidence';
    } else if (ocr < 0.5) {
      flagReason = 'Low OCR legibility — handwriting may be unclear';
    } else if (grading < 0.6) {
      flagReason = 'Low grading confidence — answer is ambiguous or incomplete';
    } else {
      flagReason = 'Combined confidence below threshold (75%)';
    }
  } else if (ocr < 0.50) {
    // 2. Safeguard floor: Unclear handwriting even if grading model guessed high
    needsReview = true;
    flagReason = 'Low OCR legibility — handwriting may be unclear';
  } else if (grading < 0.60) {
    // 3. Safeguard floor: Ambiguous or incomplete answer even if OCR was legible
    needsReview = true;
    flagReason = 'Low grading confidence — answer is ambiguous or incomplete';
  }

  return {
    combined: roundedCombined,
    needsReview,
    flagReason,
  };
}