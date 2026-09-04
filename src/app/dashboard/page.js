'use client';

import React, { useMemo } from 'react';
import Link from "next/link";
import styles from "./page.module.css";
import { useApi } from '@/hooks/useApi';
import Skeleton from '@/components/ui/Skeleton';

/* ---- Icons ---- */

const TrendUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
);
const TrendDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const getStatsIcons = (id) => {
  switch (id) {
    case 'total-exams':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        </svg>
      );
    case 'graded-papers':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case 'ai-confidence-score':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
        </svg>
      );
    case 'pending-review':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
      );
    default:
      return null;
  }
};

const quickActions = [
  {
    id: "create-exam",
    title: "Create New Exam",
    desc: "Set up a question paper & grading rubric",
    href: "/dashboard/exams/new",
    primary: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 17 2 2 4-4" /><path d="m3 7 2 2 4-4" /><path d="M13 6h8" /><path d="M13 12h8" /><path d="M13 18h8" />
      </svg>
    ),
  },
  {
    id: "upload-sheets",
    title: "Upload Answer Sheets",
    desc: "Grade a batch of papers for an exam",
    href: "/dashboard/exams",
    primary: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
      </svg>
    ),
  },
  {
    id: "view-performance",
    title: "View Results",
    desc: "Analyze class statistics & export",
    href: "/dashboard/results",
    primary: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

function getFormattedDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function DashboardPage() {
  const { data: apiData, isLoading: loading } = useApi('/api/dashboard');
  const data = apiData?.success
    ? { stats: apiData.stats, recentExams: apiData.recentExams || [], teacherName: apiData.teacherName || 'Teacher' }
    : { stats: null, recentExams: [], teacherName: 'Teacher' };

  const statsArray = useMemo(() => {
    if (!data.stats) return [];
    return [
      {
        id: "total-exams",
        label: "Total Exams",
        value: data.stats.totalExams || "0",
        trend: "Exams conducted",
        trendUp: true,
        icon: getStatsIcons("total-exams"),
      },
      {
        id: "graded-papers",
        label: "Graded Papers",
        value: data.stats.gradedPapers || "0",
        trend: "Evaluated by AI",
        trendUp: true,
        icon: getStatsIcons("graded-papers"),
      },
      {
        id: "ai-confidence-score",
        label: "Avg. Confidence",
        value: data.stats.aiConfidenceScore || "0%",
        trend: "Overall precision",
        trendUp: true,
        icon: getStatsIcons("ai-confidence-score"),
      },
      {
        id: "pending-review",
        label: "Pending Review",
        value: data.stats.pendingReview || "0",
        trend: data.stats.pendingReview > 0 ? "Needs attention" : "All caught up",
        trendUp: data.stats.pendingReview === 0,
        icon: getStatsIcons("pending-review"),
      },
    ];
  }, [data.stats]);

  return (
    <div className={styles.page}>

      {/* ---- Welcome Banner ---- */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeText}>
          <p className={styles.welcomeDate}>{getFormattedDate()}</p>
          <h2 className={styles.welcomeTitle}>Welcome back, {data.teacherName}</h2>
          <p className={styles.welcomeSub}>Here&apos;s an overview of your grading activity.</p>
        </div>
      </div>

      <div className={styles.divider} />

      {loading ? (
        <>
          {/* Skeleton Stat Cards */}
          <div className={styles.statsGrid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.statCard}>
                <div className={styles.statTop}>
                  <Skeleton width="36px" height="36px" borderRadius="var(--radius-md)" />
                  <Skeleton width="60px" height="18px" />
                </div>
                <div className={styles.statBottom} style={{ gap: 'var(--space-2)' }}>
                  <Skeleton width="80px" height="28px" />
                  <Skeleton width="100px" height="16px" />
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton Main Grid */}
          <div className={styles.mainGrid}>
            <div className={styles.tableCard}>
              <div className={styles.sectionHeader}>
                <Skeleton width="140px" height="24px" />
                <Skeleton width="60px" height="18px" />
              </div>
              <div className={styles.tableWrap} style={{ padding: 'var(--space-4)' }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border-light)' }}>
                    <Skeleton width="40%" height="20px" />
                    <Skeleton width="30%" height="20px" />
                    <Skeleton width="20%" height="20px" />
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.quickActions}>
              <div className={styles.sectionHeader}>
                <Skeleton width="120px" height="24px" />
              </div>
              <div className={styles.actionList}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={styles.actionCard}>
                    <Skeleton width="32px" height="32px" borderRadius="var(--radius-md)" />
                    <div className={styles.actionBody} style={{ gap: 'var(--space-1)' }}>
                      <Skeleton width="70%" height="18px" />
                      <Skeleton width="90%" height="14px" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ---- Stat Cards ---- */}
          <div className={styles.statsGrid}>
            {statsArray.map((stat) => (
              <div key={stat.id} className={styles.statCard}>
                <div className={styles.statTop}>
                  <div className={styles.statIconWrap}>{stat.icon}</div>
                  <div className={`${styles.statTrend} ${stat.trendUp ? styles.trendUp : styles.trendWarn}`}>
                    {stat.trendUp ? <TrendUpIcon /> : <TrendDownIcon />}
                    <span>{stat.trend}</span>
                  </div>
                </div>
                <div className={styles.statBottom}>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ---- Main Two-Column Section ---- */}
          <div className={styles.mainGrid}>

            {/* Recent Exams Table */}
            <div className={styles.tableCard}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Recent Exams</h3>
                <Link href="/dashboard/exams" className={styles.viewAll}>
                  View all <ChevronRightIcon />
                </Link>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Exam Name</th>
                      <th className={styles.th}>Class</th>
                      <th className={styles.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentExams.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                          No exams yet. Create your first exam to get started.
                        </td>
                      </tr>
                    ) : (
                      data.recentExams.map((exam) => (
                        <tr key={exam.id} className={styles.tr}>
                          <td className={`${styles.td} ${styles.examName}`}>
                            <Link href={`/dashboard/exams/${exam.id}`} className={styles.examNameLink}>
                              {exam.name}
                            </Link>
                          </td>
                          <td className={styles.td}>{exam.class}</td>
                          <td className={`${styles.td} ${styles.muted}`}>{exam.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Quick Actions</h3>
              </div>
              <div className={styles.actionList}>
                {quickActions.map((action) => (
                  <Link
                    key={action.id}
                    href={action.href}
                    className={`${styles.actionCard} ${action.primary ? styles.actionPrimary : ""}`}
                  >
                    <div className={`${styles.actionIcon} ${action.primary ? styles.actionIconPrimary : ""}`}>
                      {action.icon}
                    </div>
                    <div className={styles.actionBody}>
                      <span className={styles.actionTitle}>{action.title}</span>
                      <span className={styles.actionDesc}>{action.desc}</span>
                    </div>
                    <span className={styles.actionChevron}><ChevronRightIcon /></span>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}