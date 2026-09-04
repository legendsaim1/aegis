import React from 'react';
import Skeleton from '@/components/ui/Skeleton';
import styles from './results.module.css';

export default function ResultsLoading() {
  return (
    <div className={styles.container}>
      {/* Skeleton Summary Bar */}
      <div className={styles.summaryBar}>
        <div className={styles.statsGroup}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.statItem}>
              <Skeleton width="70px" height="12px" style={{ marginBottom: 'var(--space-1)' }} />
              <Skeleton width="45px" height="20px" />
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Skeleton width="280px" height="38px" borderRadius="var(--radius-md)" />
        </div>
        <div className={styles.toolbarRight}>
          <Skeleton width="120px" height="36px" borderRadius="var(--radius-md)" />
          <Skeleton width="110px" height="36px" borderRadius="var(--radius-md)" />
        </div>
      </div>

      {/* Skeleton Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}><Skeleton width="60px" height="16px" /></th>
              <th className={styles.th}><Skeleton width="120px" height="16px" /></th>
              <th className={styles.th}><Skeleton width="80px" height="16px" /></th>
              <th className={styles.th}><Skeleton width="60px" height="16px" /></th>
              <th className={styles.th}><Skeleton width="90px" height="16px" /></th>
              <th className={styles.th}><Skeleton width="80px" height="16px" /></th>
              <th className={styles.th}><Skeleton width="40px" height="16px" /></th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <tr key={i} className={styles.tr}>
                <td className={styles.td}><Skeleton width="50px" height="18px" /></td>
                <td className={styles.td}><Skeleton width="140px" height="18px" /></td>
                <td className={styles.td}><Skeleton width="70px" height="18px" /></td>
                <td className={styles.td}><Skeleton width="50px" height="18px" /></td>
                <td className={styles.td}><Skeleton width="80px" height="22px" borderRadius="var(--radius-full)" /></td>
                <td className={styles.td}><Skeleton width="75px" height="22px" borderRadius="var(--radius-full)" /></td>
                <td className={styles.td}><Skeleton width="24px" height="24px" borderRadius="var(--radius-sm)" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
