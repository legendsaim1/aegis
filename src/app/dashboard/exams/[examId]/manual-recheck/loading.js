import React from 'react';
import Skeleton from '@/components/ui/Skeleton';
import styles from './manualRecheck.module.css';

export default function ManualRecheckLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}><Skeleton width="90px" height="16px" /></th>
              <th className={styles.th}><Skeleton width="70px" height="16px" /></th>
              <th className={styles.th}><Skeleton width="60px" height="16px" /></th>
              <th className={`${styles.th} ${styles.hideOnMobile}`}><Skeleton width="110px" height="16px" /></th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className={styles.mainRow}>
                <td className={styles.td}>
                  <div className={styles.headerStudentInfo} style={{ gap: 'var(--space-3)' }}>
                    <Skeleton width="28px" height="28px" borderRadius="50%" />
                    <Skeleton width="120px" height="18px" />
                  </div>
                </td>
                <td className={styles.td}><Skeleton width="60px" height="18px" /></td>
                <td className={styles.td}><Skeleton width="50px" height="18px" /></td>
                <td className={`${styles.td} ${styles.hideOnMobile}`}>
                  <Skeleton width="90px" height="22px" borderRadius="var(--radius-full)" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
