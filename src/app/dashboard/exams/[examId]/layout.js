export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import ExamTabs from './ExamTabs';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import styles from './examLayout.module.css';

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export default async function ExamLayout({ children, params }) {
  const user = await getAuthenticatedUser();
  const supabase = supabaseServer();
  
  const { data: exam, error } = await supabase
    .from('exams')
    .select('*')
    .eq('id', params.examId)
    .eq('teacher_id', user?.id)
    .single();

  if (error || !exam) {
    notFound();
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const statusClass = styles['status' + exam.status] || styles.statusdraft;
  const statusLabel = exam.status.charAt(0).toUpperCase() + exam.status.slice(1);

  return (
    <div className={styles.layout}>
      <Link href="/dashboard/exams" className={styles.backBtn}>
        <ChevronLeftIcon /> Back to Exams
      </Link>
      
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>{exam.subject}</h1>
          <span className={`${styles.statusBadge} ${statusClass}`}>
            Status: {statusLabel}
          </span>
        </div>
        <div className={styles.headerBottom}>
          {exam.class_grade} &middot; "{exam.title}" &middot; {formatDate(exam.created_at)}
        </div>
      </header>

      <ExamTabs examId={exam.id} />

      <div className={styles.contentArea}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
    </div>
  );
}
