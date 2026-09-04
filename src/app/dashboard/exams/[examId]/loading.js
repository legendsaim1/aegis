import React from 'react';
import Skeleton from '@/components/ui/Skeleton';
import styles from './questionsTab.module.css';

export default function ExamQuestionsLoading() {
  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <Skeleton width="140px" height="24px" />
        <Skeleton width="120px" height="36px" borderRadius="var(--radius-md)" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={styles.card}
            style={{
              padding: 'var(--space-5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <Skeleton width="40px" height="24px" borderRadius="var(--radius-sm)" />
                <Skeleton width="100px" height="22px" borderRadius="var(--radius-full)" />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Skeleton width="28px" height="28px" borderRadius="var(--radius-sm)" />
                <Skeleton width="28px" height="28px" borderRadius="var(--radius-sm)" />
              </div>
            </div>

            <Skeleton width="85%" height="20px" />
            <Skeleton width="60%" height="16px" />

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <Skeleton width="120px" height="28px" borderRadius="var(--radius-sm)" />
              <Skeleton width="80px" height="28px" borderRadius="var(--radius-sm)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
