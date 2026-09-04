'use client';

import React from 'react';
import styles from '../upload.module.css';
import Button from '@/components/ui/Button';
import { FileIcon, SparklesIcon } from './UploadIcons';

export function BatchActionBar({
  handleUploadSheets,
  hasQueued,
  isUploading,
  isGrading,
  enableCopyDetection,
  setEnableCopyDetection,
  handleStartGrading,
  hasUploaded,
  selectedIds,
  progress,
  activeLabel,
  totalGradedCount,
  totalGradingCount
}) {
  return (
    <div className={styles.bottomBar}>
      <div className={styles.bottomBarTop}>
        <Button
          variant="secondary"
          onClick={handleUploadSheets}
          disabled={!hasQueued || isUploading || isGrading}
        >
          <FileIcon /> {isUploading ? 'Uploading...' : 'Upload Sheets'}
        </Button>

        <div className={styles.bottomActions}>
          <label className={styles.copyToggle}>
            <input
              type="checkbox"
              checked={enableCopyDetection}
              onChange={(e) => setEnableCopyDetection(e.target.checked)}
              disabled={isGrading}
            />
            Copy Detection
          </label>
          <Button
            variant="primary"
            onClick={handleStartGrading}
            disabled={(!hasUploaded && (!selectedIds || selectedIds.size === 0)) || isGrading || isUploading}
          >
            <SparklesIcon /> {isGrading ? 'Grading AI is Running...' : 'Start Grading AI'}
          </Button>
        </div>
      </div>

      <div className={styles.bottomBarBottom}>
        <span className={styles.progressLabel}>
          Progress
        </span>
        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <span className={styles.progressPercent}>{progress}%</span>
        {totalGradingCount > 0 && isGrading && (
          <span className={styles.progressCounter}>
            ({totalGradedCount || 0}/{totalGradingCount} students graded)
          </span>
        )}
        {activeLabel && <span className={styles.activeLabel} title={activeLabel}>{activeLabel}</span>}
      </div>
    </div>
  );
}

export default BatchActionBar;
