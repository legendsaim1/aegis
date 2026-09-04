'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import styles from './results.module.css';
import { useApi } from '@/hooks/useApi';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

export default function ResultsPage() {
  const toast = useToast();
  const { data: rawExams, isLoading: loading } = useApi('/api/results/global');
  const exams = useMemo(() => (Array.isArray(rawExams) ? rawExams : []), [rawExams]);
  const [expandedExams, setExpandedExams] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const handleExport = async (e, examId, subjectTitle) => {
    e.stopPropagation();
    if (downloadingId) return;
    setDownloadingId(examId);
    try {
      const res = await fetch(`/api/export/${examId}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${subjectTitle || 'Exam'}_Results.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Excel file downloaded');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to download Excel file');
    } finally {
      setDownloadingId(null);
    }
  };

  const toggleExam = (examId) => {
    setExpandedExams(prev => ({
      ...prev,
      [examId]: !prev[examId]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const visibleExams = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return exams
      .filter(exam =>
        !term ||
        exam.title.toLowerCase().includes(term) ||
        exam.subject.toLowerCase().includes(term) ||
        exam.class_grade.toLowerCase().includes(term)
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [exams, searchTerm]);

  // Global summaries
  const totalExams = visibleExams.length;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Skeleton width="180px" height="32px" style={{ marginBottom: 'var(--space-2)' }} />
          <Skeleton width="380px" height="18px" />
        </div>

        {/* Summary Bar Skeleton */}
        <div className={styles.summaryBar}>
          <div className={styles.statsGroup}>
            <Skeleton width="100px" height="24px" />
          </div>
          <div className={styles.controlsGroup}>
            <Skeleton width="220px" height="36px" borderRadius="var(--radius-md)" />
          </div>
        </div>

        {/* Skeleton Exam Blocks */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.examBlock} style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', width: '60%' }}>
                <Skeleton width="40%" height="22px" />
                <Skeleton width="60%" height="16px" />
              </div>
              <Skeleton width="90px" height="32px" borderRadius="var(--radius-md)" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Results</h1>
        <p className={styles.subtitle}>Aggregate performance metrics and statistics for your evaluated exams.</p>
      </div>

      {/* Summary Bar */}
      <div className={styles.summaryBar}>
        <div className={styles.statsGroup}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total Exams</span>
            <span className={styles.statValue}>{totalExams}</span>
          </div>
        </div>
        <div className={styles.controlsGroup}>
          <input
            type="text"
            placeholder="Search subject"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {visibleExams.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyStateTitle}>No matches</h3>
          <p className={styles.emptyStateText}>No exams match "{searchTerm}".</p>
        </div>
      ) : visibleExams.map(exam => {
        const isExamExpanded = !!expandedExams[exam.id];
        return (
          <div key={exam.id} className={styles.examBlock}>
            <div
              className={styles.examHeader}
              onClick={() => toggleExam(exam.id)}
              role="button"
              tabIndex={0}
              aria-expanded={isExamExpanded}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExam(exam.id); } }}
            >
              <div className={styles.examHeaderLeft}>
                <span className={`${styles.chevron} ${isExamExpanded ? styles.chevronOpen : ''}`}>
                  <ChevronRightIcon />
                </span>
                <div className={styles.examHeaderText}>
                  <div className={styles.examTitle}>{exam.subject}</div>
                  <div className={styles.examMeta}>
                    <span>{exam.class_grade}</span>
                    <span className={styles.metaDot}>&middot;</span>
                    <span>{exam.title}</span>
                  </div>
                  <div className={styles.examMeta}>
                    <span>{formatDate(exam.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className={styles.examHeaderRight}>
                <button
                  className={styles.exportBtn}
                  onClick={(e) => handleExport(e, exam.id, exam.subject || exam.title)}
                  disabled={downloadingId === exam.id}
                  title="Export results"
                >
                  <DownloadIcon /> {downloadingId === exam.id ? 'Exporting...' : 'Export'}
                </button>
              </div>
            </div>

            <div className={`${styles.studentListWrap} ${isExamExpanded ? styles.expanded : ''}`}>
              <div className={styles.studentListInner}>
                
                {/* 4-Card Metric Grid inside the expanded area */}
                <div className={styles.metricsGrid}>
                  <div className={`${styles.metricCard} ${styles.metricCardTotal}`}>
                    <div className={styles.metricCardLabel}>Total Marks</div>
                    <div className={styles.metricCardValue}>{exam.total_marks || 'N/A'}</div>
                  </div>
                  <div className={`${styles.metricCard} ${styles.metricCardPassed}`}>
                    <div className={styles.metricCardLabel}>Passed</div>
                    <div className={styles.metricCardValue}>{exam.stats.passedCount}</div>
                  </div>
                  <div className={`${styles.metricCard} ${styles.metricCardFailed}`}>
                    <div className={styles.metricCardLabel}>Failed</div>
                    <div className={`${styles.metricCardValue} ${exam.stats.failedCount > 0 ? styles.statValueDanger : ''}`}>
                      {exam.stats.failedCount}
                    </div>
                  </div>
                  <div className={`${styles.metricCard} ${styles.metricCardAvg}`}>
                    <div className={styles.metricCardLabel}>Average Marks</div>
                    <div className={styles.metricCardValue}>{exam.stats.averageMarks}</div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
