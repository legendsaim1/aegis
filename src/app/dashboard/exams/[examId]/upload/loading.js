import React from 'react';
import Skeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';
import styles from './upload.module.css';

export default function UploadLoading() {
  return (
    <div className={styles.container}>
      {/* Skeleton Stats Bar */}
      <Card className={`${styles.statsBar} flex-between`} padding="md">
        <div className={styles.statsGroup}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={styles.statItem} style={{ pointerEvents: 'none' }}>
              <Skeleton width="32px" height="32px" borderRadius="var(--radius-md)" />
              <div className={styles.statTextGroup}>
                <Skeleton width="60px" height="12px" style={{ marginBottom: '4px' }} />
                <Skeleton width="30px" height="18px" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Skeleton Dropzone */}
      <div
        className={styles.dropzone}
        style={{
          minHeight: '220px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-3)',
          borderStyle: 'dashed'
        }}
      >
        <Skeleton width="48px" height="48px" borderRadius="var(--radius-full)" />
        <Skeleton width="260px" height="20px" />
        <Skeleton width="180px" height="14px" />
      </div>
    </div>
  );
}
