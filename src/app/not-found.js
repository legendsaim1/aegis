import Link from 'next/link';
import styles from './not-found.module.css';

export const metadata = {
  title: '404 — Page Not Found | AEGIS',
  description: 'The requested page could not be found.',
};

const CompassIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

export default function NotFound() {
  return (
    <div className={styles.container}>
      <main className={styles.card}>
        <div className={styles.badgeWrap}>
          <CompassIcon />
          <span className={styles.badgeText}>Error 404</span>
        </div>

        <div className={styles.errorCode}>404</div>

        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.description}>
          The page or exam you are looking for doesn't exist, may have been deleted, or the URL might be mistyped.
        </p>

        <div className={styles.actionGroup}>
          <Link href="/dashboard" className={styles.primaryBtn}>
            <ArrowLeftIcon />
            Go to Dashboard
          </Link>
          <Link href="/" className={styles.secondaryBtn}>
            <HomeIcon />
            Return Home
          </Link>
        </div>
      </main>
    </div>
  );
}
