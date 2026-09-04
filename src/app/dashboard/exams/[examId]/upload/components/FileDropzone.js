'use client';

import React from 'react';
import styles from '../upload.module.css';
import { UploadCloudIcon, PdfFileIcon, ImageFileIcon } from './UploadIcons';

export function FileDropzone({
  dragActive,
  handleDrag,
  handleDrop,
  handleChange,
  inputRef
}) {
  return (
    <section className={styles.section}>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className={styles.fileInput}
        onChange={handleChange}
      />
      <h2 className={styles.sectionTitle}>Upload Answer Sheets</h2>
      <div
        className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className={styles.dropContent}>
          <div className={styles.iconWrap}><UploadCloudIcon /></div>
          <p className={styles.dropTitle}>Drag &amp; drop answer sheets here</p>
          <p className={styles.dropSubtitle}>or click to browse</p>
          <button
            type="button"
            className={styles.browseBtn}
            onClick={() => inputRef.current?.click()}
          >
            Select Files
          </button>
          <div className={styles.formatChips}>
            <span className={styles.formatChip}><PdfFileIcon /> PDF</span>
            <span className={styles.formatChip}><ImageFileIcon /> JPG</span>
            <span className={styles.formatChip}><ImageFileIcon /> PNG</span>
          </div>
          <p className={styles.formatMeta}>Max 20MB per file &middot; multiple files supported</p>
        </div>
      </div>
    </section>
  );
}

export default FileDropzone;
