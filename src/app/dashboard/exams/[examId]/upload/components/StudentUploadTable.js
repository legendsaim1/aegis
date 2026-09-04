'use client';

import React from 'react';
import styles from '../upload.module.css';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EditableCell from './EditableCell';
import {
  FileIcon,
  ImageFileIcon,
  PdfFileIcon,
  RetryIcon,
  TrashIcon,
  SearchIcon,
  InboxIcon
} from './UploadIcons';

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (fileName) => {
  if (!fileName) return <FileIcon />;
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext)) return <ImageFileIcon />;
  return <PdfFileIcon />;
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0]}${parts[parts.length - 1][0]}`;
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'done':
      return <Badge variant="success" withDot>Grading Done</Badge>;
    case 'error':
      return <Badge variant="danger" withDot>Error</Badge>;
    case 'processing':
      return <Badge variant="accent" withDot>AI Grading</Badge>;
    case 'uploading':
      return <Badge variant="warning" withDot>Uploading...</Badge>;
    case 'uploaded':
    case 'pending_db':
    case 'stale_processing':
      return <Badge variant="neutral" withDot>Queued</Badge>;
    default:
      return <Badge variant="neutral" withDot>Pending</Badge>;
  }
};

const StudentRow = React.memo(function StudentRow({
  sheet,
  idx,
  rowId,
  isSelected,
  toggleSelectOne,
  updateSheet,
  handleSaveToDB,
  handleRetryStudent,
  handleCancelGrading,
  studentProgress
}) {
  return (
    <tr
      className={`${styles.animatedRow} ${(sheet.status === 'processing' || sheet.status === 'uploading') ? styles.processingRow : ''} ${isSelected ? styles.selectedRow : ''}`}
      style={{ animationDelay: `${Math.min(idx, 12) * 25}ms` }}
    >
      <td className={`${styles.td} ${styles.tdCheckbox}`}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={isSelected}
          onChange={() => toggleSelectOne(rowId)}
          aria-label={`Select sheet ${sheet.fileName || sheet.name || 'unknown'}`}
        />
      </td>
      <td className={styles.td}>
        <div className={styles.nameCell}>
          <div className={styles.avatar}>{getInitials(sheet.name)}</div>
          <div className={styles.nameCellFields}>
            <EditableCell
              value={sheet.name}
              onChange={(val) => updateSheet(sheet.id || sheet.dbId, 'name', val)}
              onSave={(val) => handleSaveToDB(sheet, 'student_name', val)}
              placeholder="Enter name"
            />
          </div>
        </div>
      </td>
      <td className={styles.td}>
        <EditableCell
          value={sheet.roll}
          onChange={(val) => updateSheet(sheet.id || sheet.dbId, 'roll', val)}
          onSave={(val) => handleSaveToDB(sheet, 'roll_number', val)}
          placeholder="Roll no"
        />
      </td>
      <td className={styles.td}>
        <div className={styles.fileCell}>
          <span className={styles.fileTypeIcon}>{getFileIcon(sheet.fileName)}</span>
          {sheet.fileUrl ? (
            <a
              href={sheet.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.fileLink}
              title={`Click to view ${sheet.fileName}`}
              aria-label={`View ${sheet.fileName}`}
            >
              {sheet.fileName}
            </a>
          ) : (
            <span className={styles.fileNamePlain}>{sheet.fileName}</span>
          )}
          {formatFileSize(sheet.fileSize) && (
            <span className={styles.fileSize}>({formatFileSize(sheet.fileSize)})</span>
          )}
        </div>
      </td>
      <td className={styles.td}>
        <div className={styles.statusCell}>
          <div className={styles.statusCellTop}>
            {getStatusBadge(sheet.status)}
            {sheet.status === 'stale_processing' && (
              <button
                type="button"
                className={styles.retryBtn}
                onClick={() => handleRetryStudent?.(sheet)}
              >
                <RetryIcon /> Retry
              </button>
            )}
            {sheet.status === 'processing' && (
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={handleCancelGrading}
              >
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>×</span> Cancel
              </button>
            )}
          </div>
          {(sheet.status === 'processing' || (studentProgress[sheet.dbId] || studentProgress[sheet.id])) && (
            (() => {
              const prog = studentProgress[sheet.dbId] || studentProgress[sheet.id];
              const percent = prog?.percent != null ? Math.min(100, Math.max(0, Math.round(prog.percent))) : null;
              if (percent == null && sheet.status !== 'processing') return null;
              const displayPercent = percent ?? 15;
              return (
                <div className={styles.rowProgressBarWrap}>
                  <div className={styles.rowProgressBar}>
                    <div
                      className={styles.rowProgressFill}
                      style={{ width: `${displayPercent}%` }}
                    />
                  </div>
                  <span className={styles.rowProgressText}>{displayPercent}%</span>
                </div>
              );
            })()
          )}
        </div>
      </td>
    </tr>
  );
});

export function StudentUploadTable({
  sheets,
  visibleSheets,
  searchTerm,
  setSearchTerm,
  selectedIds,
  setSelectedIds,
  selectAllRef,
  allVisibleSelected,
  sortKey,
  sortDir,
  stats,
  studentProgress = {},
  toggleSort,
  toggleSelectOne,
  toggleSelectAllVisible,
  handleBulkDelete,
  updateSheet,
  handleSaveToDB,
  handleRetryStudent,
  handleCancelGrading
}) {
  const sortArrow = (key) => {
    if (sortKey !== key) return null;
    return <span className={styles.sortArrow}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <section className={styles.section}>
      <div className={styles.queueHeader}>
        <h2 className={styles.sectionTitle}>Answer Sheets Queue ({stats.total})</h2>
        {searchTerm !== '' && (
          <span className={styles.filterNote}>Filtered — showing {visibleSheets.length}</span>
        )}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}><SearchIcon /></span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by name or roll no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <span className={styles.resultCount}>
              {visibleSheets.length} of {sheets.length} shown
            </span>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className={styles.bulkBar}>
            <span className={styles.bulkCount}>{selectedIds.size} selected</span>
            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
              <TrashIcon /> Delete Selected
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        )}
      </div>

      <div className={styles.tableContainer}>
        {visibleSheets.length === 0 ? (
          <div className={styles.emptyState}>
            <InboxIcon />
            <span className={styles.emptyStateTitle}>No sheets match “{searchTerm}”</span>
            <span className={styles.emptyStateSubtitle}>Try a different name or roll number.</span>
          </div>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={`${styles.th} ${styles.thCheckbox}`}>
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      className={styles.checkbox}
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      title="Select all visible"
                      aria-label="Select all visible sheets"
                    />
                  </th>
                  <th className={`${styles.th} ${styles.thSortable}`} onClick={() => toggleSort('name')}>
                    Name {sortArrow('name')}
                  </th>
                  <th className={`${styles.th} ${styles.thSortable}`} onClick={() => toggleSort('roll')}>
                    Roll No {sortArrow('roll')}
                  </th>
                  <th className={styles.th}>File</th>
                  <th className={`${styles.th} ${styles.thSortable}`} onClick={() => toggleSort('status')}>
                    Status {sortArrow('status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleSheets.map((sheet, idx) => {
                  const rowId = sheet.id || sheet.dbId || idx;
                  const isSelected = selectedIds.has(rowId);
                  return (
                    <StudentRow
                      key={rowId}
                      sheet={sheet}
                      idx={idx}
                      rowId={rowId}
                      isSelected={isSelected}
                      toggleSelectOne={toggleSelectOne}
                      updateSheet={updateSheet}
                      handleSaveToDB={handleSaveToDB}
                      handleRetryStudent={handleRetryStudent}
                      handleCancelGrading={handleCancelGrading}
                      studentProgress={studentProgress}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default StudentUploadTable;
