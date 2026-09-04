'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './results.module.css';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import ErrorCard from '@/components/ui/ErrorCard';
import { useToast } from '@/hooks/useToast';
import { useApi } from '@/hooks/useApi';

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export default function GradingResultsPage({ params }) {
  const examId = params.examId;
  const router = useRouter();
  const toast = useToast();

  const { data: apiData, error: apiError, isLoading, mutate } = useApi(
    examId ? `/api/results/${examId}` : null,
    { dedupingInterval: 30000 }
  );

  const [expandedRow, setExpandedRow] = useState(null);
  const [results, setResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'roll', direction: 'asc' });
  const [editingQId, setEditingQId] = useState(null);
  const [editScoreValue, setEditScoreValue] = useState('');
  const [savingQId, setSavingQId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (apiData?.students) {
      setResults(apiData.students);
    }
  }, [apiData]);

  const passThreshold = apiData?.passThreshold ?? 50;

  const toggleRow = useCallback((id) => {
    setExpandedRow(prev => prev === id ? null : id);
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const res = await fetch(`/api/export/${examId}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Exam_${examId}_Results.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Excel file downloaded');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to download Excel file');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveScore = async (studentId, qId, maxScore) => {
    const numericScore = parseFloat(editScoreValue);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > maxScore) {
      toast.error(`Please enter a valid score between 0 and ${maxScore}`);
      return;
    }

    // 1. Snapshot previous state for rollback
    const previousResults = results;

    // 2. Compute optimistic results immediately
    let expectedTotalMarks = null;
    const optimisticResults = results.map(student => {
      if (student.id !== studentId) return student;
      const targetQ = student.breakdown.find(q => q.qId === qId);
      const oldVal = parseFloat(targetQ?.score?.split('/')?.[0]) || 0;
      const diff = numericScore - oldVal;
      const newScore = Math.max(0, Math.round(((parseFloat(student.score) || 0) + diff) * 10) / 10);
      expectedTotalMarks = newScore;

      const newBreakdown = student.breakdown.map(q => {
        if (q.qId !== qId) return q;
        return {
          ...q,
          score: `${numericScore}/${maxScore}`,
          needsReview: false
        };
      });
      const stillNeedsReview = newBreakdown.some(q => q.needsReview);

      return {
        ...student,
        score: newScore,
        breakdown: newBreakdown,
        needsReview: stillNeedsReview,
        flag: student.isCopied || stillNeedsReview
      };
    });

    // 3. Update UI and close edit mode immediately (0ms)
    setResults(optimisticResults);
    setEditingQId(null);
    mutate((curr) => curr ? { ...curr, students: optimisticResults } : curr, false);

    // 4. Background API call
    try {
      const res = await fetch(`/api/answers/${qId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obtained_marks: numericScore })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      // Sync server-computed total if different
      if (data.newTotalMarks != null && data.newTotalMarks !== expectedTotalMarks) {
        setResults(prev => prev.map(s => s.id === studentId ? { ...s, score: data.newTotalMarks } : s));
      }
      toast.success('Marks updated');
      mutate();
      router.refresh();
    } catch (err) {
      // 5. Rollback on failure
      setResults(previousResults);
      mutate((curr) => curr ? { ...curr, students: previousResults } : curr, false);
      toast.error('Failed to save score: ' + err.message);
    }
  };


  const getConfidBadgeClass = useCallback((score) => {
    if (score >= 75) return styles.badgeHigh;
    if (score >= 50) return styles.badgeMid;
    return styles.badgeLow;
  }, []);

  const { totalMaxScore, avgScore, passRate } = useMemo(() => {
    if (!results.length) return { totalMaxScore: 100, avgScore: 0, passRate: 0 };
    const maxScore = results[0]?.maxScore || 100;
    const avg = Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length);
    const pass = Math.round((results.filter(s => s.score >= (maxScore * (passThreshold / 100))).length / results.length) * 100);
    return { totalMaxScore: maxScore, avgScore: avg, passRate: pass };
  }, [results, passThreshold]);

  // Apply Search & Sorting
  const filteredResults = useMemo(() => {
    let filtered = results.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      // Handle null confidence
      if (sortConfig.key === 'confid') {
        valA = valA === null ? -1 : valA;
        valB = valB === null ? -1 : valB;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [results, searchQuery, sortConfig]);

  if (isLoading && results.length === 0) {
    return (
      <div className={styles.container}>
        {/* Skeleton Summary Bar */}
        <div className={styles.summaryBar}>
          <div className={styles.statsGroup}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.statItem}>
                <Skeleton width="60px" height="14px" />
                <Skeleton width="40px" height="24px" />
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <Skeleton width="280px" height="38px" borderRadius="var(--radius-md)" />
          </div>
          <div className={styles.toolbarRight}>
            <Skeleton width="120px" height="36px" borderRadius="var(--radius-md)" />
            <Skeleton width="110px" height="36px" borderRadius="var(--radius-md)" />
          </div>
        </div>

        {/* Skeleton Table */}
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}><Skeleton width="60px" height="16px" /></th>
                <th className={styles.th}><Skeleton width="120px" height="16px" /></th>
                <th className={styles.th}><Skeleton width="80px" height="16px" /></th>
                <th className={styles.th}><Skeleton width="60px" height="16px" /></th>
                <th className={styles.th}><Skeleton width="90px" height="16px" /></th>
                <th className={styles.th}><Skeleton width="80px" height="16px" /></th>
                <th className={styles.th}><Skeleton width="40px" height="16px" /></th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <tr key={i} className={styles.tr}>
                  <td className={styles.td}><Skeleton width="50px" height="18px" /></td>
                  <td className={styles.td}><Skeleton width="140px" height="18px" /></td>
                  <td className={styles.td}><Skeleton width="70px" height="18px" /></td>
                  <td className={styles.td}><Skeleton width="50px" height="18px" /></td>
                  <td className={styles.td}><Skeleton width="80px" height="22px" borderRadius="var(--radius-full)" /></td>
                  <td className={styles.td}><Skeleton width="75px" height="22px" borderRadius="var(--radius-full)" /></td>
                  <td className={styles.td}><Skeleton width="24px" height="24px" borderRadius="var(--radius-sm)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (apiError && results.length === 0) {
    return (
      <div className={styles.container}>
        <ErrorCard
          title="Failed to load grading results"
          message={apiError?.message}
          onRetry={() => mutate()}
        />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--text-secondary)', background: 'var(--white)', border: '1px dashed var(--border-dark)', borderRadius: 'var(--radius-lg)' }}>
          No grading results available yet. Start grading to see results here.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      {/* Summary Bar */}
      <div className={styles.summaryBar}>
        <div className={styles.statsGroup}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Students</span>
            <span className={styles.statValue}>{results.length}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Avg Score</span>
            <span className={styles.statValue}>{avgScore}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Pass Rate</span>
            <span className={styles.statValue}>{passRate}%</span>
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}><SearchIcon /></span>
            <input
              type="text"
              placeholder="Search student or roll no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          {searchQuery && (
            <span className={styles.resultCount}>
              {filteredResults.length} of {results.length} shown
            </span>
          )}
        </div>
        <div className={styles.toolbarRight}>
          <button className={styles.exportBtn} onClick={handleExport}>
            <DownloadIcon /> Export
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                Student {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className={styles.th} onClick={() => handleSort('roll')} style={{ cursor: 'pointer' }}>
                Roll {sortConfig.key === 'roll' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className={styles.th} onClick={() => handleSort('score')} style={{ cursor: 'pointer' }}>
                Score {sortConfig.key === 'score' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className={styles.th} onClick={() => handleSort('confid')} style={{ cursor: 'pointer' }}>
                Confidence {sortConfig.key === 'confid' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className={styles.th}>Flag</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((student) => (
              <React.Fragment key={student.id}>
                {/* Main Row */}
                <tr
                  className={`${styles.mainRow} ${expandedRow === student.id ? styles.expandedRow : ''}`}
                  onClick={() => toggleRow(student.id)}
                >
                  <td className={styles.td}>{student.name}</td>
                  <td className={styles.td}>{student.roll}</td>
                  <td className={styles.td}>
                    {student.flag ? (
                      <span style={{ textDecoration: 'line-through', color: 'var(--text-tertiary)' }} title={student.isCopied ? "Marks withheld pending plagiarism review" : "Marks withheld pending review"}>
                        {student.score}/{student.maxScore}
                      </span>
                    ) : (
                      <span>{student.score}/{student.maxScore}</span>
                    )}
                  </td>
                  <td className={styles.td}>
                    <div className={styles.confidMeter}>
                      {student.confid != null ? (
                        <span className={`${styles.badge} ${getConfidBadgeClass(student.confid)}`}>
                          {student.confid}%
                        </span>
                      ) : (
                        <span className={styles.badge} style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>NIL</span>
                      )}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      {student.isCopied && (
                        <Badge variant="danger" withDot title="Confirmed Plagiarism Incident">
                          COPIED
                        </Badge>
                      )}
                      {student.needsReview && (
                        <Badge variant="warning" withDot title="Needs Review">
                          REVIEW
                        </Badge>
                      )}
                      {!student.isCopied && !student.needsReview && (
                        <Badge variant="success" withDot>
                          GRADED
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expanded Detail */}
                {expandedRow === student.id && (
                  <tr>
                    <td colSpan={5} style={{ padding: 0 }}>
                      <div className={styles.expandedDetail}>
                        <div className={styles.qBreakdown}>
                          {student.breakdown.map(q => (
                            <div key={q.qId} className={styles.qItem}>

                              <div className={styles.qHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                  <span>{q.label}:</span>
                                  {editingQId === q.qId ? (
                                    <div className={styles.editScoreWrap}>
                                      <input 
                                        type="number" 
                                        step="0.5"
                                        className={styles.editScoreInput}
                                        value={editScoreValue}
                                        onChange={(e) => {
                                          let val = e.target.value;
                                          let max = parseFloat(q.score.split('/')[1]);
                                          if (val !== '') {
                                            let num = parseFloat(val);
                                            if (num < 0) val = '0';
                                            else if (num > max) val = String(max);
                                          }
                                          setEditScoreValue(val);
                                        }}
                                        autoFocus
                                        min="0"
                                        max={q.score.split('/')[1]}
                                        disabled={savingQId === q.qId}
                                      />
                                      <span style={{ color: 'var(--text-tertiary)' }}>/{q.score.split('/')[1]}</span>
                                      <button 
                                        className={styles.saveScoreBtn}
                                        onClick={() => handleSaveScore(student.id, q.qId, parseFloat(q.score.split('/')[1]) || 0)}
                                        disabled={savingQId === q.qId}
                                      >
                                        {savingQId === q.qId ? 'Saving...' : 'Save'}
                                      </button>
                                      <button 
                                        className={styles.cancelScoreBtn}
                                        onClick={() => setEditingQId(null)}
                                        disabled={savingQId === q.qId}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <span>{q.score}</span>
                                      <button 
                                        className={styles.editIconBtn}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingQId(q.qId);
                                          setEditScoreValue(q.score.split('/')[0]);
                                        }}
                                        title="Edit Marks"
                                      >
                                        <EditIcon />
                                      </button>
                                    </>
                                  )}
                                </div>
                                <span style={{ color: 'var(--text-tertiary)' }}>&middot;</span>
                                <div className={styles.confidMeter} style={{ fontWeight: 'normal' }}>
                                  {q.confid != null ? (
                                    <span className={`${styles.badge} ${getConfidBadgeClass(q.confid)}`}>
                                      {q.confid}%
                                    </span>
                                  ) : (
                                    <span className={styles.badge} style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>NIL</span>
                                  )}
                                  {q.needsReview && (
                                    <span className={styles.warningFlag}><AlertTriangleIcon /></span>
                                  )}
                                </div>
                                {q.needsReview && (
                                  <span className={styles.needsReviewBadge}>
                                    [Needs Review]
                                  </span>
                                )}
                              </div>

                              {q.needsReview && q.reviewReason && (
                                <div className={styles.feedbackText}>
                                  <strong>Reason:</strong> {`"${q.reviewReason}"`}
                                </div>
                              )}

                              <div className={styles.feedbackText}>
                                {`Feedback: "${q.feedback}"`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
