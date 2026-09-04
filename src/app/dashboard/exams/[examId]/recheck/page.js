'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './recheck.module.css';
import { useApi } from '@/hooks/useApi';
import Skeleton from '@/components/ui/Skeleton';
import PdfViewer from '@/components/exam/PdfViewer';
import StudentRecheckCard from '@/components/exam/StudentRecheckCard';

// --- Icons ---
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
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





// --- Sub-Components ---



// --- Main Page ---


// --- Main Page ---

export default function RecheckPortalPage({ params }) {
  const { examId } = params;

  const { data: rawFlags, isLoading: loading, mutate } = useApi(examId ? `/api/recheck/${examId}` : null);
  const flags = useMemo(() => (Array.isArray(rawFlags) ? rawFlags : []), [rawFlags]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const handleRemoveFlag = useCallback((flagId) => {
    mutate((prev) => (Array.isArray(prev) ? prev.filter(f => f.id !== flagId) : []), false);
  }, [mutate]);

  const handleRestoreFlag = useCallback((flag) => {
    mutate((prev) => (Array.isArray(prev) ? [...prev, flag] : [flag]), false);
  }, [mutate]);

  // Group flags by student
  const studentGroups = useMemo(() => {
    const map = new Map();
    flags.forEach(flag => {
      if (!map.has(flag.studentId)) {
        map.set(flag.studentId, {
          studentId: flag.studentId,
          studentName: flag.studentName,
          studentRoll: flag.studentRoll,
          pdfUrl: flag.pdfUrl,
          filename: flag.filename,
          examId: examId,
          flags: []
        });
      }
      map.get(flag.studentId).flags.push(flag);
    });
    return Array.from(map.values());
  }, [flags, examId]);

  if (loading) {
    return (
      <div className={styles.container}>
        {/* Skeleton Summary Bar */}
        <div className={styles.summaryBar}>
          <div className={styles.statsGroup}>
            <div className={styles.statItem}>
              <Skeleton width="36px" height="36px" borderRadius="var(--radius-lg)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Skeleton width="80px" height="12px" />
                <Skeleton width="40px" height="18px" />
              </div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <Skeleton width="36px" height="36px" borderRadius="var(--radius-lg)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Skeleton width="90px" height="12px" />
                <Skeleton width="40px" height="18px" />
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}><Skeleton width="90px" height="16px" /></th>
                <th className={styles.th}><Skeleton width="70px" height="16px" /></th>
                <th className={styles.th}><Skeleton width="140px" height="16px" /></th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((i) => (
                <tr key={i} className={styles.mainRow}>
                  <td className={styles.td}>
                    <div className={styles.headerStudentInfo} style={{ gap: 'var(--space-3)' }}>
                      <Skeleton width="28px" height="28px" borderRadius="50%" />
                      <Skeleton width="120px" height="18px" />
                    </div>
                  </td>
                  <td className={styles.td}><Skeleton width="60px" height="18px" /></td>
                  <td className={styles.td}>
                    <Skeleton width="80px" height="22px" borderRadius="var(--radius-full)" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (flags.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <CheckCircleIcon />
          <h3 className={styles.emptyStateTitle}>All caught up!</h3>
          <p className={styles.emptyStateText}>No answers are currently pending manual review.</p>
        </div>
      </div>
    );
  }

  if (selectedStudentId) {
    const group = studentGroups.find(g => g.studentId === selectedStudentId);
    
    // If student is cleared (no flags left), automatically go back to the list
    if (!group) {
      // Defer state update to avoid React warnings during render
      setTimeout(() => setSelectedStudentId(null), 0);
      return null;
    }
    
    return (
      <div className={styles.container}>
        <div className={styles.detailViewHeader}>
          <button className={styles.backBtn} onClick={() => setSelectedStudentId(null)}>
            <ArrowLeftIcon /> Back to Students
          </button>
        </div>
        <StudentRecheckCard
          studentGroup={group}
          onRemoveFlag={handleRemoveFlag}
          onRestoreFlag={handleRestoreFlag}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>

      {/* Summary Bar */}
      <div className={styles.summaryBar}>
        <div className={styles.statsGroup}>
          <div className={styles.statItem}>
            <div className={`${styles.statIconWrap} ${styles.accentIcon}`}><ClipboardIcon /></div>
            <div className={styles.statTextGroup}>
              <span className={styles.statLabel}>Pending Reviews</span>
              <span className={styles.statValue}>{flags.length}</span>
            </div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={styles.statIconWrap}><UsersIcon /></div>
            <div className={styles.statTextGroup}>
              <span className={styles.statLabel}>Students Involved</span>
              <span className={styles.statValue}>{studentGroups.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Students */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Student</th>
              <th className={styles.th}>Roll No</th>
              <th className={styles.th}>Questions Pending Review</th>
            </tr>
          </thead>
          <tbody>
            {studentGroups.map(group => (
              <tr 
                key={group.studentId} 
                className={styles.mainRow}
                onClick={() => setSelectedStudentId(group.studentId)}
              >
                <td className={styles.td}>
                  <div className={styles.headerStudentInfo} style={{ gap: 'var(--space-3)' }}>
                    <div className={styles.avatar} style={{ width: 28, height: 28, fontSize: '11px' }}>
                      {group.studentName.slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600 }}>{group.studentName}</span>
                  </div>
                </td>
                <td className={styles.td}>{group.studentRoll || 'N/A'}</td>
                <td className={styles.td}>
                  <span className={styles.headerProgress}>{group.flags.length} flagged</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
