import { computeSimilarityMatrix, getTextSimilarity } from './similarity';

function wordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Parses the rubric string or JSON to build a pseudo-ideal answer.
 * @param {string|object} rubricStr 
 * @returns {string} The ideal answer string.
 */
export function buildIdealAnswer(rubricStr) {
  if (!rubricStr) return '';
  try {
    const parsed = typeof rubricStr === 'string' ? JSON.parse(rubricStr) : rubricStr;
    if (parsed && parsed.criteria && Array.isArray(parsed.criteria)) {
      return parsed.criteria.map(c => c.point).join(' ');
    }
  } catch (e) {
    // If JSON parsing fails, treat it as raw text
  }
  return typeof rubricStr === 'string' ? rubricStr : '';
}

/**
 * Filters and computes the final shortlisted candidates for copy detection for a single question.
 * @param {Object} question - The question object containing id and max_marks.
 * @param {Array} answers - Array of all answers for this question across all students.
 * @param {Object} config - Configuration options (minLength, similarityThreshold).
 */
export function filterCandidatesForQuestion(question, answers, config = {}) {
  const minLength = config.minLength || 15; // Minimum characters
  const similarityThreshold = config.similarityThreshold || 0.6;
  const maxMarks = question.max_marks || 0;

  // 1. Filter out answers that are too short
  const eligibleAnswers = answers.filter(a => {
    const text = a.extracted_text || '';
    return text.trim().length >= minLength;
  });

  if (eligibleAnswers.length < 2) return [];

  // 2. Compute similarity matrix
  const matrix = computeSimilarityMatrix(eligibleAnswers);

  // 3. Filter the matrix based on thresholds and grading scores
  const candidates = [];

  for (const pair of matrix) {
    if (pair.score >= similarityThreshold) {
      const answerA = eligibleAnswers.find(a => a.id === pair.answerIdA);
      const answerB = eligibleAnswers.find(a => a.id === pair.answerIdB);

      // Discount pairs that both got full marks and either:
      // 1. are independently short (< 20 words) OR
      // 2. are independently very similar to the rubric's ideal answer (> 0.6)
      let isCoincidental = false;
      const idealAnswer = buildIdealAnswer(question.rubric_json || question.rubric);
      const textA = answerA.extracted_text || '';
      const textB = answerB.extracted_text || '';
      
      const isShort = wordCount(textA) < 30 && wordCount(textB) < 30;
      
      const simA = idealAnswer ? getTextSimilarity(textA, idealAnswer) : 0;
      const simB = idealAnswer ? getTextSimilarity(textB, idealAnswer) : 0;
      const isRigidMatch = simA > 0.45 && simB > 0.45;
      
      if (isShort && isRigidMatch) {
         isCoincidental = true;
      }

      if (!isCoincidental) {
        candidates.push({
          studentA: pair.studentA,
          studentB: pair.studentB,
          questionId: question.id,
          score: pair.score,
          textA: answerA.extracted_text,
          textB: answerB.extracted_text
        });
      }
    }
  }

  return candidates;
}
