export const dynamic = 'force-dynamic';

import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import styles from './questionsTab.module.css';
import QuestionsClient from './QuestionsClient';

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const typeLabel = {
  mcq: 'Multiple Choice',
  short: 'Short Answer',
  long: 'Long Answer',
  blank: 'Fill in Blank'
};

export default async function QuestionsTab({ params }) {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const supabase = supabaseServer();

  // Verify ownership before querying questions (defense-in-depth)
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id')
    .eq('id', params.examId)
    .eq('teacher_id', user.id)
    .single();

  if (examError || !exam) {
    return null;
  }

  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', params.examId)
    .order('question_number', { ascending: true });

  if (error) {
    console.error("Error fetching questions:", error);
  }

  const questionList = questions || [];

  return <QuestionsClient initialQuestions={questionList} examId={params.examId} />;
}