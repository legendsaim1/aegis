import { callAI } from '@/lib/ai/provider';
import { supabaseServer } from '@/lib/supabase/server';
import { calculateConfidence } from '@/lib/utils/confidence';
import { getGroqKeyCount } from '@/lib/ai/groq/client';
import { extractStoragePath } from '@/lib/utils/storage';
import { cleanAndParseJson } from '@/lib/utils/jsonParser';
import pLimit from 'p-limit';
import { createLogger } from '../utils/logger';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const clampNumber = (value, min, max, fallback = min) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(Math.max(num, min), max);
};

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above|other)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior|above|other|the)\s+(instructions|rubric)/i,
  /system\s*prompt/i,
  /award\s+(me\s+)?(full|max(imum)?|100%?)\s+marks/i,
  /give\s+(me\s+)?(full|max(imum)?|100%?)\s+marks/i,
  /return\s+(only\s+)?json/i,
  /grading_confidence\s*[:=]\s*1(\.0)?/i,
  /needs_review\s*[:=]\s*false/i,
  /you\s+must\s+(give|award)\s+full\s+credit/i,
  /override\s+(the\s+)?rubric/i,
  /new\s+instruction[s]?\s*:/i,
];

export const detectPromptInjection = (text) => {
  if (!text || typeof text !== 'string') return { detected: false, matchedPattern: null };
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return { detected: true, matchedPattern: pattern.source };
    }
  }
  return { detected: false, matchedPattern: null };
};

const normalizeGrade = (grade, maxMarks, extractedText = '') => {
  const safeMaxMarks = clampNumber(maxMarks, 0, Number.MAX_SAFE_INTEGER, 0);
  const rawMarks = Number(grade?.obtained_marks);
  const rawConfidence = Number(grade?.grading_confidence);
  const corrections = [];

  if (!Number.isFinite(rawMarks)) {
    corrections.push('AI returned non-numeric marks');
  } else if (rawMarks < 0 || rawMarks > safeMaxMarks) {
    corrections.push('AI marks were outside allowed range');
  }

  if (!Number.isFinite(rawConfidence)) {
    corrections.push('AI returned non-numeric grading confidence');
  } else if (rawConfidence < 0 || rawConfidence > 1) {
    corrections.push('AI grading confidence was outside allowed range');
  }

  const obtainedMarks = Math.round(clampNumber(rawMarks, 0, safeMaxMarks, 0) * 100) / 100;
  const gradingConfidence = clampNumber(rawConfidence, 0, 1, 0.3);

  // Check for prompt injection heuristic in student extracted text
  const injectionCheck = detectPromptInjection(extractedText);
  if (injectionCheck.detected) {
    corrections.push('Suspected prompt injection pattern detected in student answer');
  }

  // Output guardrail: if full marks awarded on suspected prompt injection or suspiciously short text
  if (safeMaxMarks > 0 && obtainedMarks >= safeMaxMarks && (injectionCheck.detected || (gradingConfidence >= 0.95 && extractedText.trim().length < 5))) {
    corrections.push('Full marks awarded on suspicious or adversarial input');
  }

  const needsReview = Boolean(grade?.needs_review) || corrections.length > 0;
  const correctionReason = corrections.length > 0 ? corrections.join('; ') : null;

  return {
    obtained_marks: obtainedMarks,
    grading_confidence: gradingConfidence,
    feedback: grade?.feedback || 'No AI feedback provided.',
    needs_review: needsReview,
    review_reason: correctionReason || grade?.review_reason || null,
  };
};

const normalizeQuestionPart = (value) => {
  if (value === undefined || value === null) return '';

  return String(value)
    .toLowerCase()
    .replace(/\b(part|subpart|sub-part)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
};

const splitQuestionLabel = (value) => {
  const normalized = normalizeQuestionPart(value);
  const match = normalized.match(/^(\d+)([a-z]+|[ivxlcdm]+)?$/);

  if (!match) {
    return { number: normalized, part: '' };
  }

  return {
    number: match[1],
    part: match[2] || '',
  };
};

const normalizeQuestionLabel = (value) => {
  if (value === undefined || value === null) return '';

  const withoutPrefixes = String(value)
    .trim()
    .toLowerCase()
    // OCR commonly joins the question prefix to its number, for example "Q1(a)".
    .replace(/^(question|ques|que|q)\s*/i, '')
    .replace(/\b(answer|ans|part|subpart|sub-part|no|number)\b/g, ' ');

  const { number, part } = splitQuestionLabel(withoutPrefixes);
  return `${number}:${part}`;
};

const getQuestionMatchKeys = (question) => {
  const number = normalizeQuestionPart(question.question_number);
  const part = normalizeQuestionPart(question.sub_part);
  const combined = `${question.question_number}${question.sub_part || ''}`;
  const spaced = `${question.question_number} ${question.sub_part || ''}`;
  const parenthesized = `${question.question_number}${question.sub_part ? ` (${question.sub_part})` : ''}`;

  return new Set([
    `${number}:${part}`,
    normalizeQuestionLabel(combined),
    normalizeQuestionLabel(spaced),
    normalizeQuestionLabel(parenthesized),
  ]);
};

const getOcrLabelValues = (answer) => [
  answer?.question_number,
  answer?.question_label,
  answer?.label,
  answer?.question,
].filter((value) => value !== undefined && value !== null && String(value).trim().length > 0);

const validateOcrResult = (parsedOCR) => {
  if (!Array.isArray(parsedOCR?.questions)) {
    return {
      error: 'OCR questions must be an array',
      questions: [],
    };
  }

  const questions = parsedOCR.questions.map((answer) => {
    const validationReasons = [];
    const labelValues = getOcrLabelValues(answer);
    const normalizedLabels = labelValues.map(normalizeQuestionLabel).filter((label) => label !== ':');
    const hasValidText = typeof answer?.extracted_text === 'string';
    const rawConfidence = Number(answer?.ocr_confidence);

    if (normalizedLabels.length === 0) {
      validationReasons.push('OCR entry is missing a valid question label');
    }

    if (!hasValidText) {
      validationReasons.push('OCR entry is missing valid extracted text');
    }

    if (!Number.isFinite(rawConfidence)) {
      validationReasons.push('OCR confidence is missing or non-numeric');
    } else if (rawConfidence < 0 || rawConfidence > 1) {
      validationReasons.push('OCR confidence was outside allowed range');
    }

    return {
      ...answer,
      extracted_text: hasValidText ? answer.extracted_text : '',
      ocr_confidence: clampNumber(rawConfidence, 0, 1, 0),
      normalized_labels: normalizedLabels,
      validation_reasons: validationReasons,
    };
  });

  return {
    error: null,
    questions,
  };
};

const buildReviewAssessment = ({
  question,
  extractedText,
  ocrConfidence,
  missingOcrMatch,
  safeGrade,
  confidenceFlagReason,
  ocrValidationReasons = [],
}) => {
  const reasons = [];
  const maxMarks = clampNumber(question.max_marks, 0, Number.MAX_SAFE_INTEGER, 0);
  const questionType = String(question.question_type || '').toLowerCase();
  const isEmptyAnswer = extractedText.trim().length === 0;
  const isFullMarks = maxMarks > 0 && safeGrade.obtained_marks >= maxMarks;
  const isZeroMarks = safeGrade.obtained_marks === 0;
  const isLongAnswer = questionType === 'long' || questionType === 'essay';

  // Check for prompt injection heuristic
  const injectionCheck = detectPromptInjection(extractedText);
  if (injectionCheck.detected) {
    reasons.push('Suspected prompt injection pattern detected in student answer');
  }

  if (missingOcrMatch) {
    reasons.push('OCR did not return a matching answer for this question');
  }

  if (isEmptyAnswer) {
    reasons.push('Extracted answer is empty');
  }

  if (isFullMarks && ocrConfidence < 0.6) {
    reasons.push('Full marks awarded despite low OCR confidence');
  }

  if (isZeroMarks && isLongAnswer) {
    reasons.push('Zero marks awarded on a long answer');
  }

  if (confidenceFlagReason) {
    reasons.push(confidenceFlagReason);
  }

  reasons.push(...ocrValidationReasons);

  if (safeGrade.review_reason) {
    reasons.push(safeGrade.review_reason);
  }

  const uniqueReasons = [...new Set(reasons.filter(Boolean))];
  const flagReason = uniqueReasons.length > 0 ? uniqueReasons.join('; ') : null;

  return {
    needsReview: uniqueReasons.length > 0 || safeGrade.needs_review,
    flagReason,
  };
};

const addReviewNoteToFeedback = (feedback, flagReason) => {
  const baseFeedback = feedback || 'No AI feedback provided.';
  if (!flagReason) return baseFeedback;
  return `${baseFeedback}\n\nReview note: ${flagReason}`;
};

const buildReviewRowsForOcrFailure = (questions, studentId, reason) =>
  questions.map((question) => ({
    student_id: studentId,
    question_id: question.id,
    extracted_text: '',
    ocr_confidence_score: 0,
    obtained_marks: 0,
    grading_confidence_score: 0,
    ai_feedback: 'OCR failed before grading. Manual review required.',
    needs_review: true,
    flag_reason: reason,
  }));

/**
 * Runs OCR and grading for a single student.
 * @param {string} studentId - UUID of the student row
 * @param {string} examId - UUID of the exam
 * @param {boolean} enableCopyDetection - Whether to trigger copy detection post-grading
 * @param {string} reqId - Request tracing ID
 * @param {string} teacherId - UUID of the teacher (optional, falls back to exam.teacher_id)
 * @returns {{ status: string, totalMarks: number, ocrConfidence: number, gradingConfidence: number }}
 */
export async function runGradingPipeline(studentId, examId, enableCopyDetection = false, reqId = null, teacherId = null) {
  const log = createLogger('Pipeline', reqId);
  const supabase = supabaseServer();

  // === Step 1: Fetch student + exam questions + answers ===
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('ocr_confidence, answer_sheet_url')
    .eq('id', studentId)
    .single();

  if (studentError || !student) {
    throw new Error(`Student not found: ${studentId}`);
  }

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', examId)
    .order('question_number', { ascending: true })
    .order('sub_part', { ascending: true });

  if (questionsError || !questions || questions.length === 0) {
    throw new Error(`No questions found for exam: ${examId}`);
  }

  const parentContextsByNumber = {};
  const gradableQuestions = [];

  for (const q of questions) {
    if (q.sub_part === null) {
      const hasSubparts = questions.some(
        (other) => other.question_number === q.question_number && other.sub_part !== null
      );
      if (hasSubparts) {
        parentContextsByNumber[q.question_number] = q.question_text || '';
        continue;
      }
    }
    gradableQuestions.push(q);
  }

  const { data: exam } = await supabase
    .from('exams')
    .select('subject, instructions, teacher_id')
    .eq('id', examId)
    .single();

  // Clear stale answers before a retry so failed/old runs cannot duplicate rows.
  const { error: deleteAnswersError } = await supabase
    .from('answers')
    .delete()
    .eq('student_id', studentId);

  if (deleteAnswersError) {
    throw new Error(`Failed to clear previous answers: ${deleteAnswersError.message}`);
  }

  // === Step 2: Download the answer sheet file ===
  const storagePath = extractStoragePath(student.answer_sheet_url);
  let fileBuffer;
  let ext = 'pdf';

  if (storagePath) {
    ext = storagePath.split('.').pop().split('?')[0].toLowerCase();
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from('answer-sheets')
      .download(storagePath);

    if (downloadError || !fileBlob) {
      throw new Error(`Failed to download answer sheet from storage: ${downloadError?.message || 'Empty file'}`);
    }
    fileBuffer = Buffer.from(await fileBlob.arrayBuffer());
  } else if (student.answer_sheet_url && student.answer_sheet_url.startsWith('http')) {
    // Fallback for legacy external URLs
    const fileUrl = student.answer_sheet_url;
    ext = fileUrl.split('.').pop().split('?')[0].toLowerCase();
    const pdfResponse = await fetch(fileUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download answer sheet: ${pdfResponse.status}`);
    }
    fileBuffer = Buffer.from(await pdfResponse.arrayBuffer());
  } else {
    throw new Error('No answer sheet file path or URL found for this student');
  }

  // Determine correct mimeType from file extension
  let mimeType = 'application/pdf';
  if (ext === 'png') mimeType = 'image/png';
  else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
  else if (ext === 'webp') mimeType = 'image/webp';

  // === Step 3: OCR — Extract handwriting per question ===
  const questionsList = questions.map((q) =>
    `${q.question_number}${q.sub_part ? ` (${q.sub_part})` : ''}`
  );

  log.info(`Running OCR for student`, { studentId, mimeType });
  let ocrResult;
  let ocrCallError = null;
  try {
    ocrResult = await callAI({
      task: 'ocr',
      params: {
        questionsList,
        subjectName: exam?.subject || 'General',
      },
      fileBuffer: fileBuffer,
      mimeType: mimeType,
    });
  } catch (err) {
    ocrCallError = err.code === 'MAX_TOKENS_TRUNCATED'
      ? err.message
      : `OCR engine error: ${err.message}`;
  }

  let parsedOCR;
  let ocrParseError = null;
  if (!ocrCallError && ocrResult?.text) {
    try {
      parsedOCR = cleanAndParseJson(ocrResult.text);
    } catch (parseErr) {
      ocrParseError = `OCR returned invalid JSON: ${parseErr.message}`;
      parsedOCR = { questions: [], overall_legibility: 0 };
    }
  } else {
    parsedOCR = { questions: [], overall_legibility: 0 };
  }

  const validatedOCR = validateOcrResult(parsedOCR);
  const extractedAnswers = validatedOCR.questions;
  const overallOcrConfidence = clampNumber(parsedOCR.overall_legibility, 0, 1, 0.5);

  if (ocrCallError || ocrParseError || validatedOCR.error) {
    const ocrError = ocrCallError || ocrParseError || validatedOCR.error;
    log.warn(`OCR failed for student. Review rows created.`, { studentId, error: ocrError });
    const answerRows = buildReviewRowsForOcrFailure(gradableQuestions, studentId, ocrError);
    const { error: answersError } = await supabase.from('answers').insert(answerRows);
    if (answersError) {
      throw new Error(`Failed to save OCR failure review rows: ${answersError.message}`);
    }

    await supabase
      .from('students')
      .update({
        status: 'error',
        total_obtained_marks: 0,
        ocr_confidence: 0,
        overall_grade_confidence: 0,
        processed_at: new Date().toISOString(),
      })
      .eq('id', studentId);

    return {
      status: 'error',
      totalMarks: 0,
      ocrConfidence: 0,
      gradingConfidence: 0,
      error: ocrError,
    };
  }

  const findExtracted = (question) => {
    const questionKeys = getQuestionMatchKeys(question);
    return extractedAnswers.find((answer) =>
      answer.normalized_labels.some((key) => questionKeys.has(key))
    );
  };

  // === Step 2: Grade each answer with Groq in Parallel ===
  const activeKeys = Math.max(1, getGroqKeyCount());
  log.info(`Initializing parallel grading`, { concurrency: activeKeys, studentId });
  const limit = pLimit(activeKeys);

  const processQuestion = async (question) => {
    const match = findExtracted(question);
    const extractedText = match?.extracted_text || '';
    const ocrConfidence = match?.ocr_confidence ?? 0.0;
    const contentType = match?.content_type || 'text';
    const missingOcrMatch = !match;
    const ocrValidationReasons = match?.validation_reasons || [];
    const hasInvalidOcrText = ocrValidationReasons.includes('OCR entry is missing valid extracted text');

    const parentContextText = parentContextsByNumber[question.question_number] || '';

    const qLabel = `Q${question.question_number}${question.sub_part ? `(${question.sub_part})` : ''}`;
    log.info(`Grading question`, { studentId, question: qLabel });

    let rubricObj = {};
    try {
      rubricObj = question.rubric_json ? JSON.parse(question.rubric_json) : {};
    } catch {
      rubricObj = {};
    }

    let parsedGrade;
    if (missingOcrMatch || hasInvalidOcrText) {
      parsedGrade = {
        obtained_marks: 0,
        grading_confidence: 0,
        feedback: 'OCR output could not be matched to valid answer text. Manual review required.',
        needs_review: true,
        review_reason: missingOcrMatch
          ? 'OCR did not return a matching answer for this question'
          : 'OCR entry is missing valid extracted text',
      };
    } else {
      try {
        const gradeResult = await callAI({
          task: 'grading',
          params: {
            question_text: question.question_text,
            type: question.question_type,
            max_marks: question.max_marks,
            rubric: JSON.stringify(rubricObj),
            paper_instructions: exam?.instructions || '',
            parent_question_context: parentContextText,
            question_instructions: question.teacher_instructions || '',
            extracted_text: extractedText,
            content_type: contentType,
            subject_name: exam?.subject || 'General',
          },
          isJson: true,
          reqId
        });
        try {
          parsedGrade = cleanAndParseJson(gradeResult.text);
        } catch (gradeParseErr) {
          parsedGrade = {
            obtained_marks: 0,
            grading_confidence: 0,
            feedback: 'AI returned invalid JSON — manual review required.',
            needs_review: true,
            review_reason: `AI grading returned unparseable response: ${gradeParseErr.message}`,
          };
        }
      } catch (aiError) {
        log.error(`callAI failed for question`, { studentId, questionId: question.id, question: qLabel, error: aiError.message });
        parsedGrade = {
          obtained_marks: 0,
          grading_confidence: 0,
          feedback: 'AI grading service unavailable — manual review required.',
          needs_review: true,
          review_reason: `AI call failed: ${aiError.message}`,
        };
      }
    }
    const safeGrade = normalizeGrade(parsedGrade, question.max_marks, extractedText);

    const { needsReview, flagReason } = calculateConfidence(ocrConfidence, safeGrade.grading_confidence);
    const reviewAssessment = buildReviewAssessment({
      question,
      extractedText,
      ocrConfidence,
      missingOcrMatch,
      safeGrade: {
        ...safeGrade,
        needs_review: safeGrade.needs_review || needsReview,
      },
      confidenceFlagReason: flagReason,
      ocrValidationReasons,
    });

    return {
      answerRow: {
        student_id: studentId,
        question_id: question.id,
        extracted_text: extractedText,
        ocr_confidence_score: ocrConfidence,
        obtained_marks: safeGrade.obtained_marks,
        grading_confidence_score: safeGrade.grading_confidence,
        ai_feedback: addReviewNoteToFeedback(safeGrade.feedback, reviewAssessment.flagReason),
        needs_review: reviewAssessment.needsReview,
        flag_reason: reviewAssessment.flagReason,
        key_points_covered: parsedGrade?.key_points_covered || [],
        key_points_missed: parsedGrade?.key_points_missed || [],
      },
      obtained_marks: safeGrade.obtained_marks,
      grading_confidence: safeGrade.grading_confidence
    };
  };

  const promises = gradableQuestions.map(question => limit(() => processQuestion(question)));
  const results = await Promise.allSettled(promises);

  let totalMarks = 0;
  let totalGradingConfidence = 0;
  let gradedCount = 0;
  const answerRows = [];

  for (const [index, result] of results.entries()) {
    if (result.status === 'fulfilled') {
      const data = result.value;
      answerRows.push(data.answerRow);
      totalMarks += data.obtained_marks;
      totalGradingConfidence += data.grading_confidence;
      gradedCount++;
    } else {
      const question = gradableQuestions[index];
      log.error(`Complete unhandled failure grading question`, { studentId, questionId: question.id, error: result.reason?.message });
      answerRows.push({
        student_id: studentId,
        question_id: question.id,
        extracted_text: '',
        ocr_confidence_score: 0,
        obtained_marks: 0,
        grading_confidence_score: 0,
        ai_feedback: 'Unexpected system error during grading. Manual review required.',
        needs_review: true,
        flag_reason: `Unhandled exception: ${result.reason?.message}`,
        key_points_covered: [],
        key_points_missed: [],
      });
    }
  }

  // === Step 5: Save all answers to database ===
  if (answerRows.length > 0) {
    const { error: answersError } = await supabase.from('answers').insert(answerRows);
    if (answersError) {
      throw new Error(`Failed to save answers: ${answersError.message}`);
    }
  }

  const avgGradingConfidence = gradedCount > 0 ? totalGradingConfidence / gradedCount : 0;
  const roundedTotalMarks = Math.round(totalMarks * 100) / 100;

  // === Step 3: Update student row with final results ===
  await supabase
    .from('students')
    .update({
      status: 'graded',
      total_obtained_marks: roundedTotalMarks,
      ocr_confidence: overallOcrConfidence,
      overall_grade_confidence: Math.round(avgGradingConfidence * 100) / 100,
      processed_at: new Date().toISOString(),
    })
    .eq('id', studentId);

  log.info(`Completed grading for student`, { studentId, totalMarks: roundedTotalMarks });

  return {
    status: 'graded',
    totalMarks: roundedTotalMarks,
    ocrConfidence: overallOcrConfidence,
    gradingConfidence: avgGradingConfidence,
  };
}
