'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useCallback } from 'react';
import styles from './manualRecheck.module.css';
import { useToast } from '@/hooks/useToast';
import { useApi } from '@/hooks/useApi';
import Skeleton from '@/components/ui/Skeleton';
import ErrorCard from '@/components/ui/ErrorCard';
import PdfViewer from '@/components/exam/PdfViewer';

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

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
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

const StudentManualCard = React.memo(function StudentManualCard({ studentGroup, onUpdateMark }) {
  const { studentId, studentName, studentRoll, answers } = studentGroup;
  const [qIndex, setQIndex] = useState(0);
  const activeAnswer = answers[qIndex];
  const toast = useToast();

  const [overrideData, setOverrideData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleOverrideChange = (val) => {
    setOverrideData(prev => ({
      ...prev,
      [activeAnswer.id]: val
    }));
  };

  const handleSave = async () => {
    const inputMark = overrideData[activeAnswer.id];
    if (inputMark === undefined || inputMark === '') {
      toast.error('Please enter marks');
      return;
    }
    
    const numericMark = parseFloat(inputMark);
    if (isNaN(numericMark) || numericMark < 0 || numericMark > activeAnswer.max_marks) {
      toast.error(`Enter valid marks between 0 and ${activeAnswer.max_marks}`);
      return;
    }

    const previousMark = activeAnswer.obtained_marks;

    // Optimistic UI update in 0ms
    onUpdateMark(studentId, activeAnswer.id, numericMark);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/answers/${activeAnswer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obtained_marks: numericMark }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save manual marks');
      toast.success('Marks updated');
    } catch (err) {
      // Rollback on failure
      onUpdateMark(studentId, activeAnswer.id, previousMark);
      toast.error(err.message || 'Failed to save marks');
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeAnswer) return null;

  const currentInput = overrideData[activeAnswer.id] ?? '';

  return (
    <div className={styles.studentCard}>
      <div className={styles.studentCardHeader}>
        <div className={styles.headerStudentInfo}>
          <div className={styles.avatar}>{studentName.slice(0, 2).toUpperCase()}</div>
          <div>
            <div className={styles.studentName}>{studentName}</div>
            <div className={styles.studentRoll}>{studentRoll || 'No Roll Number'}</div>
          </div>
        </div>
        <div className={styles.headerProgress}>
          {answers.length} {answers.length === 1 ? 'question' : 'questions'} available
        </div>
      </div>

      <div className={styles.cardBody}>
        <PdfViewer student={studentGroup} />

        <div className={styles.questionPanel}>
          <div className={styles.questionNav}>
            <button
              className={styles.navBtn}
              disabled={qIndex === 0 || submitting}
              onClick={() => setQIndex(qIndex - 1)}
            >
              <ChevronLeftIcon />
            </button>
            <div className={styles.questionNavTitle}>
              Q{activeAnswer.question_number}{activeAnswer.sub_part ? `(${activeAnswer.sub_part})` : ''}
            </div>
            <button
              className={styles.navBtn}
              disabled={qIndex === answers.length - 1 || submitting}
              onClick={() => setQIndex(qIndex + 1)}
            >
              <ChevronRightIcon />
            </button>
          </div>

          <div className={styles.questionContent}>
            <div className={styles.detailSection}>
              <span className={styles.detailLabel}>Extracted Text</span>
              <div className={styles.extractedTextBox}>
                {activeAnswer.extracted_text || '(No text extracted)'}
              </div>
            </div>

            <div className={styles.detailSection}>
              <span className={styles.detailLabel}>AI Feedback</span>
              <div className={styles.aiFeedbackBlock}>
                {activeAnswer.ai_feedback || 'No feedback available'}
              </div>
            </div>
          </div>

          <div className={styles.teacherActions}>
            <div className={styles.inputsRow} style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div className={styles.inputGroup}>
                <label>Current Marks</label>
                <div>
                  <span className={styles.marksChip}>
                    {activeAnswer.obtained_marks} <span>/ {activeAnswer.max_marks}</span>
                  </span>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>New Marks</label>
                <input
                  type="number"
                  step="0.5"
                  className={styles.marksInput}
                  placeholder={activeAnswer.obtained_marks}
                  min={0}
                  max={activeAnswer.max_marks}
                  value={currentInput}
                  onChange={(e) => handleOverrideChange(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className={styles.actionsFooter}>
              <div className={styles.btnGroup}>
                <button
                  className={styles.btnAccept}
                  onClick={handleSave}
                  disabled={submitting}
                >
                  <CheckIcon /> {submitting ? 'Saving...' : 'Save Manual Marks'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function ManualRecheckPage({ params }) {
  const { examId } = params;

  const { data: apiData, error, isLoading: loading, mutate } = useApi(
    examId ? `/api/manual-recheck/${examId}` : null,
    { dedupingInterval: 30000 }
  );

  const studentGroups = useMemo(() => apiData?.studentGroups || [], [apiData]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const handleUpdateMark = useCallback((studentId, answerId, newMarks) => {
    mutate(
      (current) => {
        if (!current?.studentGroups) return current;
        return {
          ...current,
          studentGroups: current.studentGroups.map(group => {
            if (group.studentId !== studentId) return group;
            return {
              ...group,
              answers: group.answers.map(ans => 
                ans.id === answerId ? { ...ans, obtained_marks: newMarks } : ans
              )
            };
          })
        };
      },
      false
    );
  }, [mutate]);

  if (loading) {
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

  if (error && studentGroups.length === 0) {
    return (
      <div className={styles.container}>
        <ErrorCard
          title="Failed to load manual recheck data"
          message={error?.message}
          onRetry={() => mutate()}
        />
      </div>
    );
  }

  if (studentGroups.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <CheckCircleIcon />
          <h3 className={styles.emptyStateTitle}>No Students Available</h3>
          <p className={styles.emptyStateText}>No graded students are currently available for manual recheck.</p>
        </div>
      </div>
    );
  }

  if (selectedStudentId) {
    const group = studentGroups.find(g => g.studentId === selectedStudentId);
    
    if (!group) {
      return (
        <div className={styles.container}>
          <div className={styles.detailViewHeader}>
            <button className={styles.backBtn} onClick={() => setSelectedStudentId(null)}>
              <ArrowLeftIcon /> Back to Students
            </button>
          </div>
          <div className={styles.emptyState}>
            <CheckCircleIcon />
            <h3 className={styles.emptyStateTitle}>Student not found</h3>
          </div>
        </div>
      );
    }
    
    return (
      <div className={styles.container}>
        <div className={styles.detailViewHeader}>
          <button className={styles.backBtn} onClick={() => setSelectedStudentId(null)}>
            <ArrowLeftIcon /> Back to Students
          </button>
        </div>
        <StudentManualCard
          studentGroup={group}
          onUpdateMark={handleUpdateMark}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Student</th>
              <th className={styles.th}>Roll No</th>
              <th className={styles.th}>Marks</th>
              <th className={`${styles.th} ${styles.hideOnMobile}`}>Total Questions</th>
            </tr>
          </thead>
          <tbody>
            {studentGroups.map(group => {
              const totalObtained = group.answers.reduce((sum, a) => sum + (a.obtained_marks || 0), 0);
              const totalMax = group.answers.reduce((sum, a) => sum + (a.max_marks || 0), 0);

              return (
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
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{totalObtained}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}> / {totalMax}</span>
                  </td>
                  <td className={`${styles.td} ${styles.hideOnMobile}`}>
                    <span className={styles.headerProgress}>{group.answers.length} questions</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
