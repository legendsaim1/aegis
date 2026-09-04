'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Spinner from '@/components/ui/Spinner';
import Skeleton from '@/components/ui/Skeleton';
import styles from './review.module.css';
import StudentRecheckCard from '@/components/exam/StudentRecheckCard';

const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
  </svg>
);

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

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

export default function GlobalReviewTab() {
  const [exams, setExams] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [globalStats, setGlobalStats] = useState({ totalExams: 0, totalStudents: 0, totalFlags: 0 });
  
  // New States:
  const [expandedExams, setExpandedExams] = useState({});
  const [selectedStudentGroup, setSelectedStudentGroup] = useState(null);
  const [savedScrollPos, setSavedScrollPos] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState('');

  const fetchExams = async (offset = 0, limit = 7, append = false) => {
    try {
      const appendMode = append ? setLoadingMore : setLoading;
      appendMode(true);
      const res = await fetch(`/api/review/global?limit=${limit}&offset=${offset}`);
      if (!res.ok) throw new Error('Failed to fetch exams');
      const data = await res.json();
      
      if (append) {
        setExams(prev => [...prev, ...data.exams]);
      } else {
        setExams(data.exams);
      }
      if (data.globalStats) {
        setGlobalStats(data.globalStats);
      }
      setHasMore(data.hasMore);
    } catch (err) {
      console.error(err);
    } finally {
      const appendMode = append ? setLoadingMore : setLoading;
      appendMode(false);
    }
  };

  useEffect(() => {
    fetchExams(0, 7, false);
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore) {
      fetchExams(exams.length, 5, true);
    }
  };

  const handleRemoveFlag = useCallback((examId, studentId, flagId) => {
    setExams(prevExams => prevExams.map(exam => {
      if (exam.id !== examId) return exam;
      const updatedGroups = exam.studentGroups.map(group => {
        if (group.studentId !== studentId) return group;
        const newFlags = group.flags.filter(f => f.id !== flagId);
        
        // If we are currently viewing this student and they run out of flags, exit the view
        if (selectedStudentGroup && selectedStudentGroup.studentId === studentId && newFlags.length === 0) {
           setSelectedStudentGroup(null);
        } else if (selectedStudentGroup && selectedStudentGroup.studentId === studentId) {
           // Update the currently selected student group so the UI knows there's one less flag
           setSelectedStudentGroup(prev => ({ ...prev, flags: newFlags }));
        }

        return { ...group, flags: newFlags };
      }).filter(group => group.flags.length > 0);
      
      return { ...exam, studentGroups: updatedGroups };
    }).filter(exam => exam.studentGroups.length > 0));

    // Update global stats optimistic UI
    setGlobalStats(prev => ({
      ...prev,
      totalFlags: Math.max(0, prev.totalFlags - 1)
    }));
  }, [selectedStudentGroup]);

  const toggleExam = (examId) => {
    setExpandedExams(prev => ({ ...prev, [examId]: !prev[examId] }));
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const withTotals = useMemo(() => {
    return exams.map(exam => ({
      ...exam,
      totalFlags: exam.studentGroups.reduce((sum, g) => sum + g.flags.length, 0),
    }));
  }, [exams]);

  const visibleExams = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return withTotals
      .filter(exam =>
        !term ||
        exam.subject.toLowerCase().includes(term)
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [withTotals, searchTerm]);

  const totalStudents = withTotals.reduce((sum, e) => sum + e.studentGroups.length, 0);
  const totalFlags = withTotals.reduce((sum, e) => sum + e.totalFlags, 0);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Skeleton width="160px" height="32px" />
          <Skeleton width="340px" height="18px" />
        </div>

        {/* Summary Bar Skeleton */}
        <div className={styles.summaryBar}>
          <div className={styles.statsGroup}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.statItem}>
                <Skeleton width="60px" height="14px" />
                <Skeleton width="40px" height="28px" />
              </div>
            ))}
          </div>
          <div className={styles.controlsGroup}>
            <Skeleton width="240px" height="40px" borderRadius="var(--radius-full)" />
          </div>
        </div>

        {/* Exam Blocks Skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className={styles.examBlock}>
            <div className={styles.examHeader}>
              <div className={styles.examHeaderLeft}>
                <Skeleton width="20px" height="20px" borderRadius="var(--radius-sm)" />
                <div className={styles.examHeaderText}>
                  <Skeleton width="180px" height="22px" />
                  <Skeleton width="130px" height="14px" />
                </div>
              </div>
              <Skeleton width="90px" height="28px" borderRadius="var(--radius-full)" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <CheckCircleIcon />
          <h3 className={styles.emptyStateTitle}>All caught up!</h3>
          <p className={styles.emptyStateText}>No answers are currently pending manual review across any of your exams.</p>
        </div>
      </div>
    );
  }

  const handleStudentClick = (group, exam) => {
    setSavedScrollPos(window.scrollY);
    setSelectedStudentGroup({ ...group, examId: exam.id, examTitle: exam.title });
    window.scrollTo(0, 0);
  };

  const handleBackToList = () => {
    setSelectedStudentGroup(null);
    setTimeout(() => {
      window.scrollTo({ top: savedScrollPos, behavior: 'instant' });
    }, 0);
  };

  // --- Drill Down View ---
  if (selectedStudentGroup) {
    return (
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <button className={styles.breadcrumbLink} onClick={handleBackToList}>
            <ArrowLeftIcon /> To Review
          </button>
          <span>/</span>
          <span>{selectedStudentGroup.examTitle}</span>
          <span>/</span>
          <span className={styles.breadcrumbCurrent}>{selectedStudentGroup.studentName}</span>
        </div>
        <StudentRecheckCard 
          studentGroup={selectedStudentGroup} 
          onRemoveFlag={(flagId) => handleRemoveFlag(selectedStudentGroup.examId, selectedStudentGroup.studentId, flagId)}
          index={0}
        />
      </div>
    );
  }

  // --- Main List View ---
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>To Review</h1>
        <p className={styles.subtitle}>Consolidated list of answers needing your manual review.</p>
      </div>

      {/* Summary Bar */}
      <div className={styles.summaryBar}>
        <div className={styles.statsGroup}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Exams</span>
            <span className={styles.statValue}>{globalStats.totalExams}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Students</span>
            <span className={styles.statValue}>{globalStats.totalStudents}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Pending Reviews</span>
            <span className={`${styles.statValue} ${globalStats.totalFlags > 0 ? styles.statValueDanger : ''}`}>{globalStats.totalFlags}</span>
          </div>
        </div>
        <div className={styles.controlsGroup}>
          <input
            type="text"
            placeholder="Search subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {visibleExams.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyStateTitle}>No matches</h3>
          <p className={styles.emptyStateText}>No subjects match "{searchTerm}".</p>
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
              <span className={`${styles.examFlagBadge} ${exam.totalFlags > 8 ? styles.examFlagBadgeUrgent : ''}`}>
                {exam.totalFlags} pending
              </span>
            </div>

            <div className={`${styles.studentListWrap} ${isExamExpanded ? styles.expanded : ''}`}>
              <div className={styles.studentListInner}>
                <div className={styles.studentList}>
                  {exam.studentGroups.map(group => (
                    <div
                      key={group.studentId}
                      className={styles.studentRow}
                      onClick={() => handleStudentClick(group, exam)}
                    >
                      <div className={styles.studentInfo}>
                        <div className={styles.avatar}>{group.studentName.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <div className={styles.studentName}>{group.studentName}</div>
                          <div className={styles.studentRoll}>{group.studentRoll || 'N/A'}</div>
                        </div>
                      </div>
                      <div className={styles.studentRowRight}>
                        <div className={`${styles.reviewCount} ${group.flags.length >= 5 ? styles.reviewCountUrgent : ''}`}>
                          <ClipboardIcon /> {group.flags.length} to review
                        </div>
                        <span className={styles.rowChevron}><ChevronRightIcon /></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {hasMore && (
        <div className={styles.loadMoreContainer}>
          <button 
            className={styles.loadMoreBtn} 
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? <Spinner size="sm" /> : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
