import { supabaseServer } from '@/lib/supabase/server';
import { filterCandidatesForQuestion } from '@/lib/utils/copyDetectionFilter';
import { callAI } from '@/lib/ai/provider';
import { createLogger } from '@/lib/utils/logger';
import { cleanAndParseJson } from '@/lib/utils/jsonParser';

/**
 * Runs the hybrid copy detection pipeline for a full exam.
 * @param {string} examId 
 * @param {string} teacherId
 * @param {string} reqId
 */
export async function runCopyDetection(examId, teacherId, reqId = null) {
  const log = createLogger('CopyDetection', reqId);
  const supabase = supabaseServer();

  if (!teacherId) throw new Error('teacherId is required for authorization');

  // Verify ownership to ensure defense in depth
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id')
    .eq('id', examId)
    .eq('teacher_id', teacherId)
    .single();

  if (examError || !exam) {
    throw new Error('Exam not found or access denied');
  }

  // 1. Fetch all questions for the exam
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id, max_marks, rubric_json')
    .eq('exam_id', examId);

  if (questionsError) throw new Error(`Failed to fetch questions: ${questionsError.message}`);
  if (!questions || questions.length === 0) return { message: 'No questions found for this exam.', flaggedCount: 0 };

  // 2. Fetch all graded answers for students in this exam (including manually graded)
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, status')
    .eq('exam_id', examId)
    .in('status', ['graded', 'manually_graded']);

  if (studentsError) throw new Error(`Failed to fetch students: ${studentsError.message}`);
  
  const studentIds = students.map(s => s.id);
  if (studentIds.length < 2) return { message: 'Not enough graded students to run copy detection.', flaggedCount: 0 };

  const { data: answers, error: answersError } = await supabase
    .from('answers')
    .select('id, student_id, question_id, extracted_text, obtained_marks')
    .in('student_id', studentIds);

  if (answersError) throw new Error(`Failed to fetch answers: ${answersError.message}`);

  log.info(`Running copy detection`, { examId, numAnswers: answers.length });

  // 3. Group answers by question and run local TF-IDF filter
  const allCandidates = [];
  
  for (const question of questions) {
    const questionAnswers = answers.filter(a => a.question_id === question.id);
    const candidates = filterCandidatesForQuestion(question, questionAnswers, {
      minLength: 15,
      similarityThreshold: 0.6
    });
    
    allCandidates.push(...candidates);
  }

  if (allCandidates.length === 0) {
    // Wipe any existing flags for this exam since there are zero suspicious pairs
    const { error: rpcErr } = await supabase.rpc('replace_exam_copy_flags', {
      p_exam_id: examId,
      p_flags: []
    });
    if (rpcErr) {
      await supabase.from('copy_flags').delete().eq('exam_id', examId);
    }

    return { message: 'No suspicious pairs found by local semantic filter.', flaggedCount: 0, candidatesAnalyzed: 0 };
  }

  log.info(`Identified candidates for AI copy analysis`, { candidateCount: allCandidates.length });

  // 4. Send the shortlisted candidates to AI for final confirmation in chunks
  const CHUNK_SIZE = 10;
  let aiResults = [];
  const chunkErrors = [];

  for (let i = 0; i < allCandidates.length; i += CHUNK_SIZE) {
    const chunk = allCandidates.slice(i, i + CHUNK_SIZE);
    log.info(`Processing copy detection candidate chunk ${Math.floor(i / CHUNK_SIZE) + 1} of ${Math.ceil(allCandidates.length / CHUNK_SIZE)}`, { chunkSize: chunk.length });

    try {
      const result = await callAI({
        task: 'copyDetection',
        params: { candidates: chunk },
        isJson: true,
        reqId
      });
      
      const parsed = cleanAndParseJson(result.text);
      if (parsed.results && Array.isArray(parsed.results)) {
        aiResults.push(...parsed.results);
      } else {
        throw new Error("AI returned JSON but 'results' array was missing.");
      }
    } catch (err) {
      log.error(`AI Copy Detection chunk failed`, { chunkIndex: Math.floor(i / CHUNK_SIZE), error: err.message });
      chunkErrors.push(err.message);
    }
  }

  if (aiResults.length === 0 && allCandidates.length > 0) {
    throw new Error(`AI Copy Detection failed completely: ${chunkErrors.join('; ')}`);
  }

  // 5. Filter confirmed pairs and persist atomically to the database
  const confirmedFlags = aiResults.filter(r => r.confirmed);
  const insertData = confirmedFlags.map(flag => {
    // Find the original candidate to get the TF-IDF score
    const candidate = allCandidates.find(c => 
      (c.studentA === flag.student_a && c.studentB === flag.student_b) ||
      (c.studentA === flag.student_b && c.studentB === flag.student_a)
    );

    return {
      question_id: flag.question_id,
      student_a_id: flag.student_a,
      student_b_id: flag.student_b,
      similarity_score: candidate ? candidate.score : null,
      reason: flag.reason,
      confirmed: true
    };
  });

  // Atomic replace: always deletes existing flags and inserts new flags in a single transaction
  const { error: rpcError } = await supabase.rpc('replace_exam_copy_flags', {
    p_exam_id: examId,
    p_flags: insertData
  });

  if (rpcError) {
    log.warn('replace_exam_copy_flags RPC unavailable, falling back to direct table queries:', rpcError.message);
    await supabase.from('copy_flags').delete().eq('exam_id', examId);
    if (insertData.length > 0) {
      const fullInsertData = insertData.map(d => ({ ...d, exam_id: examId }));
      const { error: insertError } = await supabase.from('copy_flags').insert(fullInsertData);
      if (insertError) throw new Error(`Failed to save copy flags: ${insertError.message}`);
    }
  }

  log.info(`Copy detection complete`, { examId, insertedFlags: confirmedFlags.length });

  return {
    message: `Copy detection complete. Flagged ${confirmedFlags.length} pairs.`,
    flaggedCount: confirmedFlags.length,
    candidatesAnalyzed: allCandidates.length
  };
}
