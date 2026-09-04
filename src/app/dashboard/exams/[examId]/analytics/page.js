'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import nextDynamic from 'next/dynamic';
import styles from './analytics.module.css';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import Skeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';
import ErrorCard from '@/components/ui/ErrorCard';
import { useApi } from '@/hooks/useApi';

const ScoreDistributionChart = nextDynamic(() => import('./ScoreDistributionChart'), {
  ssr: false,
  loading: () => <Skeleton width="100%" height="100%" borderRadius="var(--radius-lg)" />
});

const PassFailChart = nextDynamic(() => import('./PassFailChart'), {
  ssr: false,
  loading: () => <Skeleton width="100%" height="100%" borderRadius="var(--radius-lg)" />
});

const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18"></path><path d="M3 12h18"></path><path d="m8.5 8.5 7 7"></path><path d="m15.5 8.5-7 7"></path>
  </svg>
);

export default function AnalyticsDashboardPage({ params }) {
  const { examId } = params;

  const { data, error, isLoading } = useApi(
    examId ? `/api/analytics/${examId}` : null,
    { dedupingInterval: 60000 }
  );

  const [aiInsights, setAiInsights] = useState(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState(null);

  useEffect(() => {
    if (data?.hasCachedInsights && data?.recommendations) {
      let recList = [];
      if (Array.isArray(data.recommendations)) {
        recList = data.recommendations;
      } else if (data.recommendations.recommendations && Array.isArray(data.recommendations.recommendations)) {
        recList = data.recommendations.recommendations;
      }
      setAiInsights(recList);
    }
  }, [data]);

  const handleGenerateInsights = async (force = false) => {
    const isForce = force === true;
    setGeneratingInsights(true);
    setInsightsError(null);
    try {
      const fetchUrl = `/api/analytics/${examId}?include=recommendations${isForce ? '&forceRegenerate=true' : ''}`;
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error('Failed to generate insights');
      const json = await res.json();
      
      let recList = [];
      if (json.recommendations) {
        if (Array.isArray(json.recommendations)) {
          recList = json.recommendations;
        } else if (json.recommendations.recommendations && Array.isArray(json.recommendations.recommendations)) {
          recList = json.recommendations.recommendations;
        }
      }
      setAiInsights(recList);
    } catch (err) {
      console.error(err);
      setInsightsError('Failed to generate AI insights. Please try again.');
    } finally {
      setGeneratingInsights(false);
    }
  };

  const loading = isLoading && !data;

  if (loading) {
    return (
      <div className={styles.container}>
        {/* Skeleton 4 Stats Cards */}
        <div className={styles.statsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="flex-column" padding="md" hoverable>
              <Skeleton width="60px" height="14px" style={{ marginBottom: 'var(--space-2)' }} />
              <Skeleton width="80px" height="28px" />
            </Card>
          ))}
        </div>

        {/* Skeleton Charts 2x2 Grid */}
        <div className={styles.chartsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="flex-column" padding="md" style={{ gap: 'var(--space-4)' }}>
              <Skeleton width="160px" height="20px" style={{ marginBottom: 'var(--space-4)' }} />
              <div className={styles.chartContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Skeleton width="100%" height="100%" borderRadius="var(--radius-lg)" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <ErrorCard
          title="Failed to load analytics"
          message={error}
        />
      </div>
    );
  }

  if (!data || data.totalStudents === 0) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--text-secondary)', background: 'var(--white)', border: '1px dashed var(--border-dark)', borderRadius: 'var(--radius-lg)' }}>
          No analytics data available yet. Start grading to generate insights.
        </div>
      </div>
    );
  }

  // Calculate display percentages. We use data.examTotalMarks from the API.
  // If highestScore is 0 guard against division by zero.
  const safeDivisor = data.examTotalMarks > 0 ? data.examTotalMarks : 1;
  const avgPercent = Math.min((data.averageScore / safeDivisor) * 100, 100).toFixed(1);
  const highestPercent = Math.min((data.highestScore / safeDivisor) * 100, 100).toFixed(1);
  const lowestPercent = Math.min((data.lowestScore / safeDivisor) * 100, 100).toFixed(1);
  const passRate = Math.min((data.passCount / data.totalStudents) * 100, 100).toFixed(1);

  return (
    <div className={styles.container}>

      {/* 4 Stats Cards */}
      <div className={styles.statsGrid}>
        <Card className="flex-column" padding="md" hoverable>
          <span className={styles.statLabel}>Avg Score</span>
          <span className={styles.statValue}>{avgPercent}%</span>
        </Card>
        <Card className="flex-column" padding="md" hoverable>
          <span className={styles.statLabel}>Highest</span>
          <span className={styles.statValue}>{highestPercent}%</span>
        </Card>
        <Card className="flex-column" padding="md" hoverable>
          <span className={styles.statLabel}>Lowest</span>
          <span className={styles.statValue}>{lowestPercent}%</span>
        </Card>
        <Card className="flex-column" padding="md" hoverable>
          <span className={styles.statLabel}>Pass Rate</span>
          <span className={styles.statValue}>{passRate}%</span>
        </Card>
      </div>

      {/* Charts 2x2 Grid */}
      <div className={styles.chartsGrid}>

        {/* Score Distribution Bar Chart */}
        <Card className="flex-column" padding="md" style={{ gap: 'var(--space-4)' }}>
          <h3 className={styles.chartHeader}>Score Distribution</h3>
          <div className={styles.chartContainer}>
            <ErrorBoundary title="Chart Error" message="Failed to render score distribution chart.">
              <ScoreDistributionChart data={data.scoreDistribution} />
            </ErrorBoundary>
          </div>
        </Card>

        {/* Pass / Fail Donut Chart */}
        <Card className="flex-column" padding="md" style={{ gap: 'var(--space-4)' }}>
          <h3 className={styles.chartHeader}>Pass / Fail Ratio</h3>
          <div className={styles.chartContainer}>
            <ErrorBoundary title="Chart Error" message="Failed to render pass/fail ratio chart.">
              <PassFailChart data={data.passFail} />
            </ErrorBoundary>
          </div>
        </Card>

        {/* Question Difficulty */}
        <Card className="flex-column" padding="md" style={{ gap: 'var(--space-4)' }}>
          <h3 className={styles.chartHeader}>Question-wise Avg Marks</h3>
          <div className={styles.chartContainer} style={{ overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {!data.topicStats || data.topicStats.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                No questions data available
              </div>
            ) : (
              [...data.topicStats].sort((a, b) => {
                if (a.question_number !== b.question_number) return a.question_number - b.question_number;
                return (a.sub_part || '').localeCompare(b.sub_part || '');
              }).map((stat) => {
                const isHard = stat.avg_percentage < 40;
                const isMedium = stat.avg_percentage >= 40 && stat.avg_percentage < 70;
                const barColor = isHard ? 'var(--danger)' : isMedium ? 'var(--warning)' : 'var(--success)';
                const label = `Q${stat.question_number}${stat.sub_part ? ` (${stat.sub_part})` : ''}`;
                
                return (
                  <div key={stat.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ width: '40px', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {label}
                    </div>
                    <div style={{ flex: 1, background: 'var(--border-light)', borderRadius: 'var(--radius-full)', height: '12px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${Math.max(stat.avg_percentage, 2)}%`, 
                        background: barColor, 
                        height: '100%', 
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.5s ease-out'
                      }}></div>
                    </div>
                    <div style={{ width: '45px', textAlign: 'right', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {stat.avg_percentage}%
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Topic Recommendations */}
        {/* Topic Recommendations */}
        <Card className="flex-column" padding="md" style={{ gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: 'var(--space-3)' }}>
            <h3 className={styles.chartHeader} style={{ borderBottom: 'none', paddingBottom: 0, margin: 0 }}>Topic Difficulty & Recommendations</h3>
            {aiInsights && !generatingInsights && (
              <button 
                onClick={() => handleGenerateInsights(true)}
                style={{
                  background: 'transparent', color: 'var(--text-secondary)',
                  border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-md)',
                  padding: '4px 8px', fontSize: 'var(--text-xs)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.borderColor = 'var(--text-secondary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border-dark)';
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Regenerate
              </button>
            )}
          </div>
          
          {!aiInsights && !generatingInsights && !insightsError && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%', 
              minHeight: '235px', 
              textAlign: 'center', 
              padding: 'var(--space-5) var(--space-4)',
              background: 'var(--accent-light)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--accent)',
              marginTop: 'var(--space-2)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'var(--white)',
                color: 'var(--accent)',
                marginBottom: 'var(--space-3)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <SparkleIcon />
              </div>
              <h4 style={{ margin: '0 0 var(--space-1) 0', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                AI Topic Analysis
              </h4>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', lineHeight: 1.5, maxWidth: '280px' }}>
                Analyze student exam scripts to discover learning gaps and get tailored teaching strategies.
              </p>
              <button 
                onClick={handleGenerateInsights}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'var(--accent)', color: 'var(--white)',
                  border: 'none', borderRadius: 'var(--radius-full)',
                  padding: 'var(--space-3) var(--space-6)',
                  fontWeight: 600, cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)', transition: 'all 0.15s ease',
                  fontSize: 'var(--text-sm)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'var(--accent-hover)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'var(--accent)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <SparkleIcon /> {data?.hasCachedInsights ? 'View AI Insights' : 'Generate AI Insights'}
              </button>
            </div>
          )}

          {generatingInsights && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '220px', color: 'var(--text-secondary)' }}>
              <div style={{ 
                width: '32px', height: '32px', border: '3px solid var(--border-light)', 
                borderTopColor: 'var(--accent)', borderRadius: '50%', 
                animation: 'spin 1s linear infinite', marginBottom: 'var(--space-4)' 
              }}></div>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Analyzing answers...</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-light)', marginTop: '2px' }}>This may take a few seconds</p>
            </div>
          )}

          {insightsError && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '220px', color: 'var(--danger)', textAlign: 'center', padding: 'var(--space-4)' }}>
              <p style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>{insightsError}</p>
              <button 
                onClick={handleGenerateInsights}
                style={{
                  background: 'transparent', color: 'var(--danger)',
                  border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-2) var(--space-4)', cursor: 'pointer',
                  fontWeight: 500, fontSize: 'var(--text-xs)'
                }}
              >
                Retry
              </button>
            </div>
          )}

          {aiInsights && !generatingInsights && (
            <div className={styles.recommendationsList} style={{ maxHeight: '280px', paddingRight: '4px' }}>
              {aiInsights.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                  No recommendations generated for this exam.
                </div>
              ) : (
                aiInsights.map((insight, idx) => {
                  const isHard = insight.difficulty_label === 'Hard';
                  const isMedium = insight.difficulty_label === 'Medium';
                  const badgeColor = isHard ? 'var(--danger)' : isMedium ? 'var(--warning)' : 'var(--success)';
                  const badgeBg = isHard ? 'var(--danger-light)' : isMedium ? 'var(--warning-light)' : 'var(--success-light)';
                  
                  return (
                    <div 
                      key={idx} 
                      className={styles.recItem} 
                      style={{ 
                        borderLeftColor: badgeColor, 
                        flexDirection: 'column',
                        gap: 'var(--space-2)',
                        transition: 'transform 0.2s',
                        cursor: 'default'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(2px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                          Q{insight.question_number}{insight.sub_part ? ` (${insight.sub_part})` : ''}
                        </span>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                            Avg: {insight.avg_percentage}%
                          </span>
                          <span style={{ 
                            background: badgeBg, color: badgeColor, 
                            padding: '2px 8px', borderRadius: 'var(--radius-full)', 
                            fontSize: '10px', fontWeight: 700,
                            textTransform: 'uppercase'
                          }}>
                            {insight.difficulty_label}
                          </span>
                        </div>
                      </div>
                      <div className={styles.recText} style={{ margin: 0 }}>
                        {insight.recommendation}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </Card>

      </div>

      {/* Summary Panel */}
      <div className={styles.insightsPanel}>
        <div className={styles.insightsHeader}>
          <SparkleIcon />
          AEGIS Summary
        </div>
        <p className={styles.insightsText}>
          {data.totalStudents} student{data.totalStudents !== 1 ? 's' : ''} graded.{' '}
          {data.passCount} passed, {data.failCount} failed.{' '}
          Class average: {data.averageScore} / {data.examTotalMarks} marks ({avgPercent}%).
        </p>
      </div>

    </div>
  );
}