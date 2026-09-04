'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import styles from './copied.module.css';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Skeleton from '@/components/ui/Skeleton';
import { useApi } from '@/hooks/useApi';

// --- Icons ---
const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const FlagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
    <line x1="4" y1="22" x2="4" y2="15"></line>
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const HelpCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

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
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

// --- Diff Highlighting ---
function DiffText({ text, otherText }) {
  if (!text) return null;
  if (!otherText) return <span>{text}</span>;
  const words = text.split(/(\s+)/);
  const otherWordsSet = new Set(otherText.toLowerCase().split(/\s+/));
  return (
    <>
      {words.map((word, i) => {
        if (!word.trim()) return <span key={i}>{word}</span>;
        const normalized = word.toLowerCase().replace(/[.,!?;:()]/g, '');
        if (!otherWordsSet.has(normalized)) {
          return <span key={i} className={styles.highlightDiff}>{word}</span>;
        }
        return <span key={i}>{word}</span>;
      })}
    </>
  );
}

// --- PDF Panel ---
function PdfPanel({ student }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const hasPdf = student.pdfUrl && typeof student.pdfUrl === 'string';
  const isImage = student.filename?.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;

  return (
    <div className={styles.pdfPanel}>
      <div className={styles.pdfPanelHeader}>
        <div className={styles.avatar}>{student.name.slice(0, 2).toUpperCase()}</div>
        <div className={styles.studentInfo}>
          <span className={styles.studentName}>{student.name}</span>
          <span className={styles.studentRoll}>{student.roll}</span>
        </div>
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
          isImage ? (
            <div className={styles.pdfImageWrap}>
              <Image 
                src={student.pdfUrl} 
                alt={student.filename || 'Student upload'} 
                className={styles.pdfImage}
                width={800}
                height={1200}
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
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
                title={`PDF — ${student.name}`}
                onLoad={() => setIframeLoaded(true)}
              />
            </>
          )
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

// --- PDF Modal ---
function PdfModal({ flag, onClose }) {
  const modalRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!flag) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [flag, onClose]);

  if (!flag) return null;

  const sim = Math.round((flag.similarityScore || 0) * 100);
  const isHighSim = sim >= 90;

  return (
    <div className={styles.pdfModal} onClick={onClose} role="dialog" aria-modal="true">
      <div
        ref={modalRef}
        className={styles.pdfModalBox}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.pdfModalHeader}>
          <div className={styles.pdfModalTitle}>
            <span className={isHighSim ? styles.iconDanger : styles.iconWarning}><AlertIcon /></span>
            <span>{flag.questionLabel}</span>
            <span className={styles.pdfModalTitleSep}>·</span>
            <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>PDF Comparison</span>
          </div>
          <div className={styles.pdfModalHeaderRight}>
            <span className={`${styles.simBadge} ${isHighSim ? styles.badgeHigh : styles.badgeMid}`}>
              {sim}% similar
            </span>
            <button className={styles.closeBtn} onClick={onClose} title="Close (Esc)">
              <XIcon />
            </button>
          </div>
        </div>

        {/* AI Reason Banner */}
        {flag.reason && (
          <div className={styles.pdfReasonBanner}>
            <span className={styles.pdfReasonLabel}>AI Reason:</span>
            <span className={styles.pdfReasonText}>{flag.reason}</span>
          </div>
        )}

        {/* Side-by-side PDF panels */}
        <div className={styles.pdfPanels}>
          <PdfPanel student={flag.studentA} />
          <div className={styles.pdfDivider} />
          <PdfPanel student={flag.studentB} />
        </div>
      </div>
    </div>
  );
}

// --- Inline Confirmation Button ---
function ApplyBothButton({ onConfirm, disabled }) {
  const [pending, setPending] = useState(false);

  if (pending) {
    return (
      <span className={styles.confirmInline}>
        <span>Apply to both?</span>
        <button className={styles.btnDanger} onClick={() => { onConfirm(); setPending(false); }} disabled={disabled}>Yes</button>
        <button className={styles.btnGhost} onClick={() => setPending(false)}>Cancel</button>
      </span>
    );
  }

  return (
    <button className={styles.btnPrimary} onClick={() => setPending(true)} disabled={disabled}>
      Apply Lowest to Both
    </button>
  );
}

// --- Main Page ---
export default function CopiedPage({ params }) {
  const examId = params.examId;
  const { data: rawFlags, error: apiError, isLoading: loading, mutate } = useApi(examId ? `/api/copied/${examId}` : null);
  const flags = useMemo(() => (Array.isArray(rawFlags) ? rawFlags : []), [rawFlags]);
  const error = apiError?.message || null;
  const [searchQuery, setSearchQuery] = useState('');
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState({});
  const [toasts, setToasts] = useState({});
  const [activePdfFlag, setActivePdfFlag] = useState(null);
  const [confirmModalState, setConfirmModalState] = useState({ isOpen: false, flagId: null });

  const handleMarkChange = (flagId, studentKey, val, maxMarks) => {
    let num = parseFloat(val);
    if (isNaN(num)) num = 0;
    num = Math.max(0, Math.min(num, maxMarks));
    setEdits(prev => ({ ...prev, [flagId]: { ...(prev[flagId] || {}), [studentKey]: num } }));
  };

  const getMark = useCallback((flag, studentKey) => {
    const edit = edits[flag.flagId]?.[studentKey];
    return edit !== undefined ? edit : flag[studentKey].currentMarks;
  }, [edits]);

  const showToast = useCallback((flagId, msg) => {
    setToasts(prev => ({ ...prev, [flagId]: msg }));
    setTimeout(() => setToasts(prev => ({ ...prev, [flagId]: null })), 3000);
  }, []);

  const executeSave = useCallback(async (flagId, updates) => {
    setSaving(prev => ({ ...prev, [flagId]: true }));
    try {
      const res = await fetch(`/api/copied/${examId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
      if (!res.ok) throw new Error('Failed to update marks');

      mutate(prev => (Array.isArray(prev) ? prev.map(f => {
        if (f.flagId !== flagId) return f;
        const nf = { ...f, studentA: { ...f.studentA }, studentB: { ...f.studentB } };
        updates.forEach(u => {
          if (u.studentId === nf.studentA.studentId) nf.studentA.currentMarks = u.newMarks;
          if (u.studentId === nf.studentB.studentId) nf.studentB.currentMarks = u.newMarks;
        });
        return nf;
      }) : []), false);

      setEdits(prev => {
        const next = { ...prev };
        if (next[flagId]) {
          const savedIds = new Set(updates.map(u => u.studentId));
          const flag = flags.find(f => f.flagId === flagId);
          if (flag) {
            const newEdits = { ...(next[flagId] || {}) };
            if (savedIds.has(flag.studentA.studentId)) delete newEdits.studentA;
            if (savedIds.has(flag.studentB.studentId)) delete newEdits.studentB;
            if (Object.keys(newEdits).length === 0) delete next[flagId];
            else next[flagId] = newEdits;
          }
        }
        return next;
      });

      showToast(flagId, 'Marks saved!');
    } catch (err) {
      showToast(flagId, `Error: ${err.message}`);
    } finally {
      setSaving(prev => ({ ...prev, [flagId]: false }));
    }
  }, [examId, flags, mutate, showToast]);

  const handleSave = useCallback((flagId, mode) => {
    const flag = flags.find(f => f.flagId === flagId);
    if (!flag) return;
    const markA = getMark(flag, 'studentA');
    const markB = getMark(flag, 'studentB');
    const updates = [];
    if ((mode === 'both' || mode === 'a') && flag.studentA.answerId)
      updates.push({ answerId: flag.studentA.answerId, studentId: flag.studentA.studentId, newMarks: markA });
    if ((mode === 'both' || mode === 'b') && flag.studentB.answerId)
      updates.push({ answerId: flag.studentB.answerId, studentId: flag.studentB.studentId, newMarks: markB });
    if (updates.length > 0) executeSave(flagId, updates);
  }, [flags, getMark, executeSave]);

  const handleApplyToBoth = useCallback(async (flagId) => {
    const flag = flags.find(f => f.flagId === flagId);
    if (!flag) return;
    const markA = getMark(flag, 'studentA');
    const markB = getMark(flag, 'studentB');
    const lowest = Math.min(markA, markB);
    const updates = [];
    if (flag.studentA.answerId) updates.push({ answerId: flag.studentA.answerId, studentId: flag.studentA.studentId, newMarks: lowest });
    if (flag.studentB.answerId) updates.push({ answerId: flag.studentB.answerId, studentId: flag.studentB.studentId, newMarks: lowest });
    
    // Optimistic removal: remove from UI immediately
    mutate(prev => (Array.isArray(prev) ? prev.filter(f => f.flagId !== flagId) : []), false);
    setSaving(prev => ({ ...prev, [flagId]: true }));
    try {
      const res = await fetch(`/api/copied/${examId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
      if (!res.ok) throw new Error('Failed to update marks');

      const res2 = await fetch(`/api/copied/${examId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagId })
      });
      if (!res2.ok) throw new Error('Failed to resolve flag');
    } catch (err) {
      // Rollback on error
      mutate(prev => (Array.isArray(prev) ? [...prev, flag] : [flag]), false);
      showToast(flagId, `Error: ${err.message}`);
    } finally {
      setSaving(prev => ({ ...prev, [flagId]: false }));
    }
  }, [examId, flags, getMark, mutate, showToast]);

  const handleResolveRequest = useCallback((flagId) => {
    setConfirmModalState({ isOpen: true, flagId });
  }, []);

  const executeResolve = useCallback(async () => {
    const flagId = confirmModalState.flagId;
    const targetFlag = flags.find(f => f.flagId === flagId);
    setConfirmModalState({ isOpen: false, flagId: null });
    
    // Optimistic removal: remove from UI immediately
    mutate(prev => (Array.isArray(prev) ? prev.filter(f => f.flagId !== flagId) : []), false);
    setSaving(prev => ({ ...prev, [flagId]: true }));
    try {
      const res = await fetch(`/api/copied/${examId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagId })
      });
      if (!res.ok) throw new Error('Failed to resolve flag');
    } catch (err) {
      // Rollback on error
      if (targetFlag) {
        mutate(prev => (Array.isArray(prev) ? [...prev, targetFlag] : [targetFlag]), false);
      }
      showToast(flagId, `Error: ${err.message}`);
    } finally {
      setSaving(prev => ({ ...prev, [flagId]: false }));
    }
  }, [examId, flags, mutate, showToast, confirmModalState.flagId]);

  const filteredFlags = useMemo(() => {
    if (!searchQuery.trim()) return flags;
    const q = searchQuery.toLowerCase();
    return flags.filter(f =>
      f.studentA.name.toLowerCase().includes(q) ||
      f.studentA.roll.toLowerCase().includes(q) ||
      f.studentB.name.toLowerCase().includes(q) ||
      f.studentB.roll.toLowerCase().includes(q) ||
      f.questionLabel.toLowerCase().includes(q)
    );
  }, [flags, searchQuery]);

  const uniqueQuestions = new Set(flags.map(f => f.questionId)).size;
  const uniqueStudents = new Set(flags.flatMap(f => [f.studentA.studentId, f.studentB.studentId])).size;
  const activePdfFlagObj = flags.find(f => f.flagId === activePdfFlag);

  if (loading) {
    return (
      <div className={styles.container}>
        {/* Summary Bar Skeleton */}
        <div className={styles.summaryBar}>
          <div className={styles.statsGroup}>
            <div className={styles.statItem}>
              <Skeleton width="90px" height="12px" />
              <Skeleton width="40px" height="24px" />
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <Skeleton width="90px" height="12px" />
              <Skeleton width="40px" height="24px" />
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <Skeleton width="90px" height="12px" />
              <Skeleton width="40px" height="24px" />
            </div>
          </div>
          <div className={styles.controlsGroup}>
            <Skeleton width="280px" height="40px" borderRadius="var(--radius-full)" />
          </div>
        </div>

        {/* Cards List Skeleton */}
        <div className={styles.cardsList}>
          {[1, 2].map((i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft} style={{ gap: 'var(--space-3)' }}>
                  <Skeleton width="80px" height="18px" />
                  <Skeleton width="70px" height="22px" borderRadius="var(--radius-full)" />
                  <Skeleton width="180px" height="14px" />
                </div>
              </div>
              <div className={styles.comparisonContainer}>
                {[1, 2].map((j) => (
                  <div key={j} className={styles.studentPanel}>
                    <div className={styles.studentHeader}>
                      <Skeleton width="32px" height="32px" borderRadius="50%" />
                      <div className={styles.studentInfo}>
                        <Skeleton width="110px" height="16px" />
                        <Skeleton width="60px" height="12px" />
                      </div>
                    </div>
                    <Skeleton width="100%" height="90px" borderRadius="var(--radius-md)" />
                    <Skeleton width="140px" height="36px" borderRadius="var(--radius-md)" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle} style={{ color: 'var(--danger)' }}>Failed to load</p>
          <p className={styles.emptyStateText}>{error}</p>
          <button className={styles.btnSecondary} onClick={fetchFlags} style={{ marginTop: 'var(--space-4)' }}>Retry</button>
        </div>
      </div>
    );
  }

  if (flags.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <CheckCircleIcon />
          <h3 className={styles.emptyStateTitle}>All Clear!</h3>
          <p className={styles.emptyStateText}>No copying was detected by the AI in this exam. All students appear to have submitted original work.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.summaryBar}>
        <div className={styles.statsGroup}>
          <div className={styles.statItem}>
            <div className={`${styles.statIconWrap} ${styles.dangerIcon}`}><FlagIcon /></div>
            <div className={styles.statTextGroup}>
              <span className={styles.statLabel}>Flagged Pairs</span>
              <span className={`${styles.statValue} ${styles.dangerValue}`}>{flags.length}</span>
            </div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={`${styles.statIconWrap} ${styles.accentIcon}`}><HelpCircleIcon /></div>
            <div className={styles.statTextGroup}>
              <span className={styles.statLabel}>Questions Affected</span>
              <span className={styles.statValue}>{uniqueQuestions}</span>
            </div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={styles.statIconWrap}><UsersIcon /></div>
            <div className={styles.statTextGroup}>
              <span className={styles.statLabel}>Students Involved</span>
              <span className={styles.statValue}>{uniqueStudents}</span>
            </div>
          </div>
        </div>
        <div className={styles.controlsGroup}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}><SearchIcon /></span>
            <input
              type="text"
              placeholder="Search by name, roll no. or question…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>

      <div className={styles.cardsList}>
        {filteredFlags.map((flag, idx) => {
          const markA = getMark(flag, 'studentA');
          const markB = getMark(flag, 'studentB');
          const isChangedA = markA !== flag.studentA.currentMarks;
          const isChangedB = markB !== flag.studentB.currentMarks;
          const hasAnyChange = isChangedA || isChangedB;
          const sim = Math.round((flag.similarityScore || 0) * 100);
          const isHighSim = sim >= 90;
          const toast = toasts[flag.flagId];
          const isSaving = saving[flag.flagId];

          return (
            <div
              key={flag.flagId}
              className={`${styles.card} ${isHighSim ? styles.cardHigh : styles.cardMid}`}
              style={{ animationDelay: `${Math.min(idx * 60, 300)}ms` }}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <span className={isHighSim ? styles.iconDanger : styles.iconWarning}><AlertIcon /></span>
                  <span className={styles.qLabel}>{flag.questionLabel}</span>
                  <span className={`${styles.simBadge} ${isHighSim ? styles.badgeHigh : styles.badgeMid}`}>
                    {sim}% similar
                  </span>
                  <span className={styles.reasonText} title={flag.reason}>
                    "{flag.reason}"
                  </span>
                </div>
              </div>

              <div className={styles.comparisonContainer}>
                <div className={styles.studentPanel}>
                  <div className={styles.studentHeader}>
                    <div className={styles.avatar}>{flag.studentA.name.slice(0, 2).toUpperCase()}</div>
                    <div className={styles.studentInfo}>
                      <span className={styles.studentName}>{flag.studentA.name}</span>
                      <span className={styles.studentRoll}>{flag.studentA.roll}</span>
                    </div>
                  </div>
                  <div className={styles.answerBox}>
                    <DiffText text={flag.studentA.extractedText} otherText={flag.studentB.extractedText} />
                  </div>
                  <div className={`${styles.marksEditor} ${isChangedA ? styles.hasChanged : ''}`}>
                    <span className={styles.marksLabel}>Marks</span>
                    <div className={styles.marksInputWrap}>
                      <input
                        type="number" min="0" max={flag.maxMarks}
                        value={markA} disabled={isSaving}
                        onChange={e => handleMarkChange(flag.flagId, 'studentA', e.target.value, flag.maxMarks)}
                        className={styles.marksInput}
                      />
                      <span className={styles.maxMarks}>/ {flag.maxMarks}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.studentPanel}>
                  <div className={styles.studentHeader}>
                    <div className={styles.avatar}>{flag.studentB.name.slice(0, 2).toUpperCase()}</div>
                    <div className={styles.studentInfo}>
                      <span className={styles.studentName}>{flag.studentB.name}</span>
                      <span className={styles.studentRoll}>{flag.studentB.roll}</span>
                    </div>
                  </div>
                  <div className={styles.answerBox}>
                    <DiffText text={flag.studentB.extractedText} otherText={flag.studentA.extractedText} />
                  </div>
                  <div className={`${styles.marksEditor} ${isChangedB ? styles.hasChanged : ''}`}>
                    <span className={styles.marksLabel}>Marks</span>
                    <div className={styles.marksInputWrap}>
                      <input
                        type="number" min="0" max={flag.maxMarks}
                        value={markB} disabled={isSaving}
                        onChange={e => handleMarkChange(flag.flagId, 'studentB', e.target.value, flag.maxMarks)}
                        className={styles.marksInput}
                      />
                      <span className={styles.maxMarks}>/ {flag.maxMarks}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.footerLeft}>
                  {toast && (
                    <span className={`${styles.toastMsg} ${toast.startsWith('Error') ? styles.toastError : styles.toastSuccess}`}>
                      {!toast.startsWith('Error') && <CheckIcon />} {toast}
                    </span>
                  )}
                  {!hasAnyChange && !toast && (
                    <span className={styles.noEditsLabel}>No pending edits</span>
                  )}
                </div>
                <div className={styles.footerActions}>
                  <button
                    className={styles.btnGhost}
                    onClick={() => setActivePdfFlag(flag.flagId)}
                    title="View original PDF answer sheets"
                  >
                    <FileIcon /> See PDFs
                  </button>

                  {!hasAnyChange && (
                    <button className={styles.btnSuccess} onClick={() => handleResolveRequest(flag.flagId)} disabled={isSaving}>
                      <CheckIcon /> Mark As Resolved
                    </button>
                  )}

                  {isChangedA && (
                    <button className={styles.btnSecondary} onClick={() => handleSave(flag.flagId, 'a')} disabled={isSaving}>
                      Save {flag.studentA.name.split(' ')[0]}
                    </button>
                  )}
                  {isChangedB && (
                    <button className={styles.btnSecondary} onClick={() => handleSave(flag.flagId, 'b')} disabled={isSaving}>
                      Save {flag.studentB.name.split(' ')[0]}
                    </button>
                  )}
                  <ApplyBothButton
                    onConfirm={() => handleApplyToBoth(flag.flagId)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PDF Modal */}
      <PdfModal flag={activePdfFlagObj} onClose={() => setActivePdfFlag(null)} />

      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title="Resolve Flag"
        message="Are you sure you want to mark this as resolved? The current marks will be kept, and the plagiarism flag will be removed."
        confirmText="Resolve"
        isDanger={false}
        onConfirm={executeResolve}
        onCancel={() => setConfirmModalState({ isOpen: false, flagId: null })}
      />
    </div>
  );
}
