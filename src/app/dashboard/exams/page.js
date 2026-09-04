import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import Link from 'next/link';
import ExamsGrid from './ExamsGrid';
import styles from './exams.module.css';

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const metadata = {
  title: 'Your Exams | AEGIS',
};

export default async function ExamsPage() {
  const user = await getAuthenticatedUser();
  const supabase = supabaseServer();

  const { data: exams, error } = await supabase
    .from('exams')
    .select('*, students(id, status), copy_flags(id)')
    .eq('teacher_id', user?.id)
    .order('created_at', { ascending: false });

  const processedExams = exams || [];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Your Exams</h1>
          <p className={styles.subtitle}>Manage and grade your upcoming and past exams.</p>
        </div>
        <Link href="/dashboard/exams/new" className={styles.primaryBtn}>
          <PlusIcon />
          New Exam
        </Link>
      </header>

      <main className={styles.main}>
        {error ? (
          <div className={styles.errorState}>Failed to load exams: {error.message}</div>
        ) : !processedExams || processedExams.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><FolderIcon /></div>
            <h3 className={styles.emptyTitle}>No exams yet</h3>
            <p className={styles.emptyDesc}>Create your first exam to start grading answer sheets.</p>
            <Link href="/dashboard/exams/new" className={styles.emptyBtn}>
              <PlusIcon />
              Create Exam
            </Link>
          </div>
        ) : (
          <ExamsGrid exams={processedExams} />
        )}
      </main>
    </div>
  );
}
