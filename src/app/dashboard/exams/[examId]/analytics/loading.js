import React from 'react';
import Skeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';
import styles from './analytics.module.css';

export default function AnalyticsLoading() {
  return (
    <div className={styles.container}>
      {/* Skeleton 4 Stats Cards */}
      <div className={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="flex-column" padding="md" hoverable>
            <Skeleton width="60px" height="14px" style={{ marginBottom: 'var(--space-2)' }} />
            <Skeleton width="80px" height="28px" />
          </Card>
        ))}
      </div>

      {/* Skeleton Charts 2x2 Grid */}
      <div className={styles.chartsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="flex-column" padding="md" style={{ gap: 'var(--space-4)' }}>
            <Skeleton width="160px" height="20px" style={{ marginBottom: 'var(--space-4)' }} />
            <div className={styles.chartContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Skeleton width="100%" height="100%" borderRadius="var(--radius-lg)" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
