'use client';

import React from 'react';
import styles from '../upload.module.css';
import Card from '@/components/ui/Card';
import {
  FileIcon,
  HourglassIcon,
  UploadCloudIcon,
  CheckIcon,
  AlertTriangleIcon
} from './UploadIcons';

export function UploadStatsBar({ stats, statusFilter, setStatusFilter }) {
  return (
    <Card className={`${styles.statsBar} flex-between`} padding="md">
      <div className={styles.statsGroup}>
        <button
          type="button"
          aria-pressed={statusFilter === 'all'}
          className={`${styles.statItem} ${statusFilter === 'all' ? styles.statItemActive : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <span className={styles.statIconWrap}><FileIcon /></span>
          <div className={styles.statTextGroup}>
            <span className={styles.statLabel}>Total Sheets</span>
            <span className={styles.statValue}>{stats.total}</span>
          </div>
        </button>

        <button
          type="button"
          aria-pressed={statusFilter === 'pendingUpload'}
          className={`${styles.statItem} ${statusFilter === 'pendingUpload' ? styles.statItemActive : ''}`}
          onClick={() => setStatusFilter(p => p === 'pendingUpload' ? 'all' : 'pendingUpload')}
          disabled={stats.pendingUpload === 0}
        >
          <span className={styles.statIconWrap}><HourglassIcon /></span>
          <div className={styles.statTextGroup}>
            <span className={styles.statLabel}>Pending Upload</span>
            <span className={styles.statValue}>{stats.pendingUpload}</span>
          </div>
        </button>

        <button
          type="button"
          aria-pressed={statusFilter === 'queued'}
          className={`${styles.statItem} ${statusFilter === 'queued' ? styles.statItemActive : ''}`}
          onClick={() => setStatusFilter(p => p === 'queued' ? 'all' : 'queued')}
          disabled={stats.queued === 0}
        >
          <span className={styles.statIconWrap}><UploadCloudIcon /></span>
          <div className={styles.statTextGroup}>
            <span className={styles.statLabel}>Queued</span>
            <span className={styles.statValue}>{stats.queued}</span>
          </div>
        </button>

        <button
          type="button"
          aria-pressed={statusFilter === 'gradingDone'}
          className={`${styles.statItem} ${statusFilter === 'gradingDone' ? styles.statItemActive : ''}`}
          onClick={() => setStatusFilter(p => p === 'gradingDone' ? 'all' : 'gradingDone')}
          disabled={stats.gradingDone === 0}
        >
          <span className={`${styles.statIconWrap} ${stats.gradingDone > 0 ? styles.successIcon : ''}`}>
            <CheckIcon />
          </span>
          <div className={styles.statTextGroup}>
            <span className={styles.statLabel}>Grading Done</span>
            <span className={`${styles.statValue} ${stats.gradingDone > 0 ? styles.successValue : ''}`}>
              {stats.gradingDone}
            </span>
          </div>
        </button>

        <button
          type="button"
          aria-pressed={statusFilter === 'error'}
          className={`${styles.statItem} ${statusFilter === 'error' ? styles.statItemActive : ''}`}
          onClick={() => setStatusFilter(p => p === 'error' ? 'all' : 'error')}
          disabled={stats.error === 0}
        >
          <span className={`${styles.statIconWrap} ${stats.error > 0 ? styles.dangerIcon : ''}`}>
            <AlertTriangleIcon />
          </span>
          <div className={styles.statTextGroup}>
            <span className={styles.statLabel}>Error</span>
            <span className={`${styles.statValue} ${stats.error > 0 ? styles.dangerValue : ''}`}>
              {stats.error}
            </span>
          </div>
        </button>
      </div>

      {statusFilter !== 'all' && (
        <button type="button" className={styles.clearFilterBtn} onClick={() => setStatusFilter('all')}>
          Clear filter ×
        </button>
      )}
    </Card>
  );
}

export default UploadStatsBar;
