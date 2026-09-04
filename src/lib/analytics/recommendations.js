import { supabaseServer } from '@/lib/supabase/server';
import { calculateTopicStats } from './topicStats';
import { callAI } from '@/lib/ai/provider';
import { createLogger } from '../utils/logger';
import { cleanAndParseJson } from '../utils/jsonParser';

export async function runTopicRecommendations(examId) {
  const log = createLogger('Recommendations', `exam-${examId}`);
  const supabase = supabaseServer();

  // 1. Fetch questions + answers
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', examId);
    
  if (questionsError || !questions) {
    throw new Error('Failed to fetch questions for recommendations.');
  }

  // We need all answers for students who are graded for this exam
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id')
    .eq('exam_id', examId)
    .in('status', ['graded', 'manually_graded']);

  if (studentsError || !students || students.length === 0) {
    // If no graded students, return empty
    return { topicStats: [], recommendations: [] };
  }

  const studentIds = students.map(s => s.id);
  
  const { data: answers, error: answersError } = await supabase
    .from('answers')
    .select('*')
    .in('student_id', studentIds);

  if (answersError || !answers) {
    throw new Error('Failed to fetch answers for recommendations.');
  }

  // 2. Call calculateTopicStats
  const fullStats = calculateTopicStats(questions, answers);
  
  if (fullStats.length === 0) {
    return { topicStats: [], recommendations: [] };
  }

  // 3. Slice the bottom N weakest topics (N = 10)
  // fullStats is already sorted ascending by avg_percentage
  const weakTopics = fullStats.slice(0, 10);

  // 4. Call AI provider for recommendations
  let recommendations = [];
  try {
    const aiResult = await callAI({
      task: 'topicRecommendations',
      params: { weakTopics },
      isJson: true
    });
    recommendations = cleanAndParseJson(aiResult.text);
  } catch (error) {
    log.error('Failed to generate topic recommendations', { examId, error: error.message });
    // Continue gracefully returning stats even if AI fails
  }

  // 5. Return combined result
  return {
    topicStats: fullStats,
    recommendations
  };
}
