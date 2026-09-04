'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './StudentRecheckCard.module.css';
import PdfViewer from '@/components/exam/PdfViewer';
import { useToast } from '@/hooks/useToast';


const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const Edit2Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
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

export default function StudentRecheckCard({ studentGroup, onRemoveFlag, onRestoreFlag, index }) {
  const { studentId, studentName, studentRoll, flags, examId } = studentGroup;
  const router = useRouter();
  const toast = useToast();

  const [qIndex, setQIndex] = useState(0);
  const activeFlag = flags[qIndex];

  const [overrideData, setOverrideData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (qIndex >= flags.length && flags.length > 0) {
      setQIndex(flags.length - 1);
    }
  }, [flags.length, qIndex]);

  const handleOverrideChange = (field, value) => {
    setOverrideData(prev => ({
      ...prev,
      [activeFlag.id]: { ...(prev[activeFlag.id] || {}), [field]: value }
    }));
  };

  const advanceOrRemove = (removedFlagId) => {
    onRemoveFlag(removedFlagId);
    setOverrideData(prev => {
      const next = { ...prev };
      delete next[removedFlagId];
      return next;
    });
  };

  const handleAccept = async () => {
    const flagToAccept = activeFlag;
    if (!flagToAccept) return;

    // Optimistic UI update: advance/remove immediately
    advanceOrRemove(flagToAccept.id);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/recheck/${examId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerId: flagToAccept.id }),
      });
      if (!res.ok) throw new Error('Failed to accept grade');

      toast.success('Marks updated successfully');
      router.refresh();
    } catch (err) {
      // Rollback optimistic update on error
      if (onRestoreFlag) onRestoreFlag(flagToAccept);
      toast.error(err.message || 'Failed to accept grade');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverride = async () => {
    const input = overrideData[activeFlag.id] || {};
    if (input.marks === undefined || input.marks === '') {
      toast.error('Please enter revised marks');
      return;
    }

    const flagToOverride = activeFlag;
    if (!flagToOverride) return;

    const revisedMarks = Number(input.marks);

    // Optimistic UI update: advance/remove immediately
    advanceOrRemove(flagToOverride.id);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/recheck/${examId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answerId: flagToOverride.id,
          revised_marks: revisedMarks,
          teacher_notes: '',
        }),
      });
      if (!res.ok) throw new Error('Failed to override grade');

      toast.success('Marks updated successfully');
      router.refresh();
    } catch (err) {
      // Rollback optimistic update on error
      if (onRestoreFlag) onRestoreFlag(flagToOverride);
      toast.error(err.message || 'Failed to override grade');
    } finally {
      setSubmitting(false);
    }
  };


  if (!activeFlag) return null;

  const currentInput = overrideData[activeFlag.id] || {};
  const animationDelay = `${Math.min(index * 60, 300)}ms`;

  return (
    <div className={styles.studentCard} style={{ animationDelay }}>
      <div className={styles.studentCardHeader}>
        <div className={styles.headerStudentInfo}>
          <div className={styles.avatar}>{studentName.slice(0, 2).toUpperCase()}</div>
          <div>
            <div className={styles.studentName}>{studentName}</div>
            <div className={styles.studentRoll}>{studentRoll || 'No Roll Number'}</div>
          </div>
        </div>
        <div className={styles.headerProgress}>
          {flags.length} {flags.length === 1 ? 'flag' : 'flags'} pending
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
              {activeFlag.questionTopic}
            </div>
            <button
              className={styles.navBtn}
              disabled={qIndex === flags.length - 1 || submitting}
              onClick={() => setQIndex(qIndex + 1)}
            >
              <ChevronRightIcon />
            </button>
          </div>

          <div className={styles.questionContent}>
            <div className={styles.flagReasonBanner}>
              <span className={styles.flagReasonText} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{activeFlag.questionText}</span>
            </div>

            <div className={styles.detailSection}>
              <span className={styles.detailLabel}>Extracted Text</span>
              <div className={styles.extractedTextBox}>
                {activeFlag.extractedText || '(No text extracted — OCR failed)'}
              </div>
            </div>

            <div className={styles.detailSection}>
              <span className={styles.detailLabel}>AI Feedback</span>
              <div className={styles.aiFeedbackBlock}>
                {activeFlag.feedback || 'No feedback available'}
              </div>
            </div>
          </div>

          <div className={styles.teacherActions}>
            <div className={styles.inputsRow} style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div className={styles.inputGroup}>
                <label>AI Grading</label>
                <div>
                  <span className={styles.marksChip}>
                    {activeFlag.marksObtained} <span>/ {activeFlag.totalMarks}</span>
                  </span>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Revised Marks</label>
                <input
                  type="number"
                  className={styles.marksInput}
                  placeholder={activeFlag.marksObtained}
                  min={0}
                  max={activeFlag.totalMarks}
                  value={currentInput.marks ?? ''}
                  onChange={(e) => handleOverrideChange('marks', e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className={styles.actionsFooter}>
              <div className={styles.toastArea} />
              <div className={styles.btnGroup}>
                <button
                  className={styles.btnAccept}
                  onClick={handleAccept}
                  disabled={submitting}
                >
                  <CheckIcon /> {submitting ? 'Saving...' : 'Accept AI Grade'}
                </button>
                <button
                  className={styles.btnOverride}
                  onClick={handleOverride}
                  disabled={submitting}
                >
                  <Edit2Icon /> {submitting ? 'Saving...' : 'Override'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
