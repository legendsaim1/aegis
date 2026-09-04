"use client";

import styles from "./Features.module.css";

const features = [
  {
    id: "ai-grading",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
    ),
    title: "AI-Powered Grading",
    description:
      "Automatically grade answers against your rubrics with detailed feedback and marks — powered by Google Gemini.",
    visual: (
      <div className={styles.visualStack}>
        <div className={styles.dataRow}>
          <span className={`${styles.miniBadge} ${styles.badgeSuccess}`}>Match</span>
          <span className={styles.dataText}>2/2 points awarded</span>
        </div>
        <div className={styles.dataRow}>
          <span className={`${styles.miniBadge} ${styles.badgeWarning}`}>Partial</span>
          <span className={styles.dataText}>Missing key concept</span>
        </div>
      </div>
    )
  },
  {
    id: "confidence",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></svg>
    ),
    title: "Dual Confidence",
    description: "Every result includes OCR and grading confidence scores.",
    visual: (
      <div className={styles.visualMiniStack}>
        <div className={styles.confRow}>
          <span className={styles.confLabel}>OCR</span>
          <div className={styles.bar}><div style={{width:'95%'}} className={styles.barFillSuccess}/></div>
        </div>
        <div className={styles.confRow}>
          <span className={styles.confLabel}>AI</span>
          <div className={styles.bar}><div style={{width:'85%'}} className={styles.barFillWarning}/></div>
        </div>
      </div>
    )
  },
  {
    id: "analytics",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v10l5.5 5.5"/></svg>
    ),
    title: "Rich Analytics",
    description: "Visualize score distributions and pass/fail rates.",
    visual: (
      <div className={styles.visualMini}>
        <div className={styles.pieChartWrapper}>
          <div className={styles.pieChart} />
          <div className={styles.pieLegend}>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotAccent}`} /> Pass
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotDark}`} /> Fail
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotLight}`} /> Review
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "copy-detection",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    ),
    title: "Copy Detection",
    description:
      "Flag suspiciously similar answers across students automatically with AI-powered similarity analysis.",
    visual: (
      <div className={styles.visualStack}>
        <div className={styles.dataRow}>
          <span className={styles.dataText}>Student 105</span>
          <span className={`${styles.miniBadge} ${styles.badgeDanger}`}>92% Match</span>
        </div>
        <div className={styles.dataRow}>
          <span className={styles.dataText}>Student 106</span>
          <span className={`${styles.miniBadge} ${styles.badgeNeutral}`}>14% Match</span>
        </div>
      </div>
    )
  },
  {
    id: "manual-recheck",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    ),
    title: "Manual Recheck",
    description:
      "Flag answers for a second look. One-click manual recheck lets you override AI decisions with a complete audit trail.",
    visual: (
      <div className={styles.visualStack}>
        <div className={styles.dataRow}>
          <span className={styles.dataText}>Q2(b) Override</span>
          <span className={`${styles.miniBadge} ${styles.badgeSuccess}`}>4/5 Marks</span>
        </div>
        <div className={styles.dataRow}>
          <span className={styles.dataText}>Audit Trail</span>
          <span className={`${styles.miniBadge} ${styles.badgeNeutral}`}>Teacher Verified</span>
        </div>
      </div>
    )
  },
  {
    id: "question-extraction",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/></svg>
    ),
    title: "PDF Question Extraction",
    description:
      "Upload a question paper and let AEGIS extract, structure, and auto-type all questions using AI OCR — no re-typing needed.",
    visual: (
      <div className={styles.visualStack}>
        <div className={styles.dataRow}>
          <span className={styles.dataText}>Q1 – Q10 Parsed</span>
          <span className={`${styles.miniBadge} ${styles.badgeSuccess}`}>100% Structured</span>
        </div>
        <div className={styles.dataRow}>
          <span className={styles.dataText}>Sub-parts &amp; Rubrics</span>
          <span className={`${styles.miniBadge} ${styles.badgeNeutral}`}>Auto Nested</span>
        </div>
      </div>
    )
  }
];

export default function Features() {
  return (
    <section id="features" className={styles.section}>
      <div className="dotPattern" aria-hidden="true" />
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.label}>Features</span>
          <h2 className={styles.title}>
            Everything you need to grade
            <span className={styles.titleAccent}> smarter</span>
          </h2>
          <p className={styles.subtitle}>
            From question paper upload to XLSX export — AEGIS owns the entire evaluation pipeline so your workflow stays in one place.
          </p>
        </div>

        <div className={styles.grid}>
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={styles.card}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className={styles.pieceNumber} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrapper} aria-hidden="true">
                    {feature.icon}
                  </div>
                  <h3 className={styles.cardTitle}>{feature.title}</h3>
                </div>
                <p className={styles.cardDescription}>{feature.description}</p>
                
                {feature.visual && (
                  <div className={styles.cardVisual} aria-hidden="true">
                    {feature.visual}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
