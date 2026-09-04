'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import styles from './PdfViewer.module.css';

const FileIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

const ZoomInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    <line x1="11" y1="8" x2="11" y2="14"></line>
    <line x1="8" y1="11" x2="14" y2="11"></line>
  </svg>
);

const ZoomOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    <line x1="8" y1="11" x2="14" y2="11"></line>
  </svg>
);

export function ZoomableViewer({ children, isImage = false }) {
  const [scale, setScale] = useState(1);
  const [hovered, setHovered] = useState(false);
  const scrollRef = React.useRef(null);

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setScale(s => Math.min(3, parseFloat((s + 0.25).toFixed(2))));
  };
  const handleZoomOut = (e) => {
    e.stopPropagation();
    setScale(s => Math.max(0.25, parseFloat((s - 0.25).toFixed(2))));
  };

  return (
    <div
      className={styles.zoomableOuter}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`${styles.zoomToolbar} ${hovered ? styles.zoomToolbarVisible : ''}`}>
        <button className={styles.zoomBtn} onClick={handleZoomOut} title="Zoom Out" type="button">
          <ZoomOutIcon />
        </button>
        <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>
        <button className={styles.zoomBtn} onClick={handleZoomIn} title="Zoom In" type="button">
          <ZoomInIcon />
        </button>
      </div>

      <div className={styles.zoomScrollArea} ref={scrollRef}>
        <div
          className={styles.zoomScaleWrap}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: isImage ? '100%' : `${100 / scale}%`,
            height: isImage ? 'auto' : `${100 / scale}%`,
            transition: 'transform 0.2s ease-out',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function PdfViewer({ student }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const hasPdf = student.pdfUrl && typeof student.pdfUrl === 'string';
  const isImage = student.filename?.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;

  return (
    <div className={styles.pdfPanel}>
      <div className={styles.pdfPanelHeader}>
        <span className={styles.pdfPanelTitle}>Student Upload</span>
        {hasPdf && (
          <a
            href={student.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.pdfOpenLink}
            title="Open in new tab"
          >
            <ExternalLinkIcon />
          </a>
        )}
      </div>

      <div className={styles.pdfViewerWrap}>
        {hasPdf ? (
          <ZoomableViewer isImage={isImage}>
            {isImage ? (
              <Image
                src={student.pdfUrl}
                alt={student.filename || 'Student upload'}
                className={styles.pdfImage}
                width={800}
                height={1200}
                style={{ width: '100%', height: 'auto' }}
              />
            ) : (
              <>
                {!iframeLoaded && (
                  <div className={styles.iframeLoader}>
                    <div className={styles.iframeLoaderSpinner} />
                    <span>Loading PDF…</span>
                  </div>
                )}
                <iframe
                  src={`${student.pdfUrl}#toolbar=0`}
                  className={`${styles.pdfIframe} ${iframeLoaded ? styles.iframeVisible : ''}`}
                  title={`PDF — ${student.studentName}`}
                  onLoad={() => setIframeLoaded(true)}
                />
              </>
            )}
          </ZoomableViewer>
        ) : (
          <div className={styles.pdfFallback}>
            <FileIcon size={36} />
            <p>No file uploaded</p>
            <span>{student.filename || 'Unknown file'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
