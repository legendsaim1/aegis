'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import styles from './upload.module.css';
import ConfirmModal from '@/components/ui/ConfirmModal';
import useStudentUpload from './hooks/useStudentUpload';
import useBatchGrading from './hooks/useBatchGrading';
import useGradingProgress from '@/hooks/useGradingProgress';
import UploadStatsBar from './components/UploadStatsBar';
import FileDropzone from './components/FileDropzone';
import StudentUploadTable from './components/StudentUploadTable';
import BatchActionBar from './components/BatchActionBar';

export default function UploadSheetsPage({ params }) {
  const examId = params?.examId;

  const upload = useStudentUpload(examId);
  const grading = useBatchGrading({
    examId,
    sheets: upload.sheets,
    setSheets: upload.setSheets,
    selectedIds: upload.selectedIds,
    setProgress: upload.setProgress,
    setActiveLabel: upload.setActiveLabel,
  });
  const studentProgress = useGradingProgress(examId, grading.isGrading);

  return (
    <div className={styles.container}>
      <UploadStatsBar
        stats={upload.stats}
        statusFilter={upload.statusFilter}
        setStatusFilter={upload.setStatusFilter}
      />

      <FileDropzone
        dragActive={upload.dragActive}
        handleDrag={upload.handleDrag}
        handleDrop={upload.handleDrop}
        handleChange={upload.handleChange}
        inputRef={upload.inputRef}
      />

      {upload.sheets.length > 0 && (
        <StudentUploadTable
          sheets={upload.sheets}
          visibleSheets={upload.visibleSheets}
          searchTerm={upload.searchTerm}
          setSearchTerm={upload.setSearchTerm}
          selectedIds={upload.selectedIds}
          setSelectedIds={upload.setSelectedIds}
          selectAllRef={upload.selectAllRef}
          allVisibleSelected={upload.allVisibleSelected}
          sortKey={upload.sortKey}
          sortDir={upload.sortDir}
          stats={upload.stats}
          studentProgress={studentProgress}
          toggleSort={upload.toggleSort}
          toggleSelectOne={upload.toggleSelectOne}
          toggleSelectAllVisible={upload.toggleSelectAllVisible}
          handleBulkDelete={upload.handleBulkDelete}
          updateSheet={upload.updateSheet}
          handleSaveToDB={upload.handleSaveToDB}
          handleRetryStudent={grading.handleRetryStudent}
          handleCancelGrading={grading.handleCancelGrading}
        />
      )}

      <BatchActionBar
        handleUploadSheets={upload.handleUploadSheets}
        hasQueued={upload.hasQueued}
        isUploading={upload.isUploading}
        isGrading={grading.isGrading}
        enableCopyDetection={grading.enableCopyDetection}
        setEnableCopyDetection={grading.setEnableCopyDetection}
        handleStartGrading={grading.handleStartGrading}
        hasUploaded={upload.hasUploaded}
        selectedIds={upload.selectedIds}
        progress={upload.progress}
        activeLabel={upload.activeLabel}
        totalGradedCount={grading.totalGradedCount}
        totalGradingCount={grading.totalGradingCount}
      />

      <ConfirmModal
        isOpen={upload.confirmModalState.isOpen}
        title={upload.confirmModalState.title}
        message={upload.confirmModalState.message}
        confirmText={upload.confirmModalState.confirmText}
        isDanger={upload.confirmModalState.isDanger}
        onConfirm={() => {
          if (upload.confirmModalState.action) upload.confirmModalState.action();
        }}
        onCancel={() => upload.setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
