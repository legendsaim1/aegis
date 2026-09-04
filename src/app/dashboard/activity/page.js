import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { supabaseServer } from '@/lib/supabase/server';
import styles from './activity.module.css';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ActivityList from './ActivityList';

export const dynamic = 'force-dynamic';

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export default async function ActivityPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = supabaseServer();
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <BellIcon />
        </div>
        <div>
          <h1 className={styles.title}>Recent Activity</h1>
          <p className={styles.subtitle}>View all notifications and recent actions in your workspace.</p>
        </div>
      </header>

      <main className={styles.main}>
        {error ? (
          <div className={styles.errorAlert}>Failed to load activity log.</div>
        ) : (
          <ActivityList notifications={notifications || []} />
        )}
      </main>
    </div>
  );
}
