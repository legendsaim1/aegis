"use client";

import styles from "./HowItWorks.module.css";

const steps = [
  {
    number: "01",
    title: "Create Exam",
    description: "Upload your question paper or type questions. AI extracts and structures them automatically.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
    )
  },
  {
    number: "02",
    title: "Upload Sheets",
    description: "Drag and drop handwritten answer sheets for your entire class at once.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    )
  },
  {
    number: "03",
    title: "AI Analysis",
    description: "Gemini OCR reads handwriting, grades against your rubric, and flags uncertainty for review.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2a2 2 0 0 1 2-2z"/><path d="M12 6v16"/><path d="M12 12l4-4"/><path d="M12 12l-4-4"/></svg>
    )
  },
  {
    number: "04",
    title: "Review Results",
    description: "Verify confidence scores, resolve flagged answers, dismiss copy alerts, and override grades.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>
    )
  },
  {
    number: "05",
    title: "Export & Done",
    description: "Download a clean, formatted XLSX gradebook ready for submission to your administration.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    )
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className="dotPattern" aria-hidden="true" />
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.label}>WORKFLOW</span>
          <h2 className={styles.title}>
            From upload to results in
            <span className={styles.titleAccent}> minutes</span>
          </h2>
          <p className={styles.subtitle}>
            Four simple steps to automate your grading pipeline.
          </p>
        </div>

        <div className={styles.timeline}>
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={styles.step}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={styles.stepIconWrapper}>
                <div className={styles.stepIcon} aria-hidden="true">
                  {step.icon}
                </div>
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepNumber}>{step.number}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
