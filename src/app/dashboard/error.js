'use client';

import React, { useEffect } from 'react';
import styles from '@/components/ui/ErrorBoundary.module.css';

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

export default function DashboardError({ error, reset }) {
  useEffect(() => {
    console.error('Dashboard Route Error:', error);
  }, [error]);

  return (
    <div style={{ padding: 'var(--space-8)', maxWidth: '800px', margin: '0 auto' }}>
      <div className={styles.errorContainer}>
        <div className={styles.iconWrap}>
          <AlertIcon />
        </div>
        <h2 className={styles.title}>Dashboard Error</h2>
        <p className={styles.message}>
          An unexpected error occurred while rendering this page.
        </p>
        {error?.message && (
          <div className={styles.details}>
            {error.message}
          </div>
        )}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
          <button
            type="button"
            className={styles.retryBtn}
            onClick={() => reset()}
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--white)',
              textDecoration: 'none',
            }}
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
