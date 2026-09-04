/**
 * Helper utilities for consistent exam marks calculation across all AEGIS surfaces
 * (Analytics, Excel Export, Results Table, and Global APIs).
 */

/**
 * Filters an array of exam questions to return only gradable items
 * (excluding parent container questions if sub-parts exist).
 *
 * @param {Array} questions - List of question objects
 * @returns {Array} List of gradable question objects
 */
export function getGradableQuestions(questions = []) {
  if (!Array.isArray(questions)) return [];
  return questions.filter(q => {
    if (q.sub_part === null || q.sub_part === undefined || q.sub_part === '') {
      const hasSubparts = questions.some(
        other => other.question_number === q.question_number && other.sub_part !== null && other.sub_part !== undefined && other.sub_part !== ''
      );
      if (hasSubparts) return false;
    }
    return true;
  });
}

/**
 * Calculates the total maximum marks for an exam.
 * Always prioritizes the sum of actual gradable question max_marks.
 * Falls back to exam.total_marks if questions are not yet populated.
 *
 * @param {Array} questions - List of questions for the exam
 * @param {Object} exam - Exam record (may contain total_marks)
 * @returns {number} Exam total maximum marks
 */
export function getExamTotalMarks(questions = [], exam = {}) {
  const gradable = getGradableQuestions(questions);
  const sum = gradable.reduce((acc, q) => acc + (Number(q.max_marks) || 0), 0);
  if (sum > 0) return sum;

  // Fallback: check all questions directly in case subpart structure varies
  const rawSum = (questions || []).reduce((acc, q) => acc + (Number(q.max_marks) || 0), 0);
  if (rawSum > 0) return rawSum;

  // Fallback to exam.total_marks or default 100
  const examTotal = Number(exam?.total_marks);
  return Number.isFinite(examTotal) && examTotal > 0 ? examTotal : 100;
}
