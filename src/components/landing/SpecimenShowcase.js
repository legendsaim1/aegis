"use client";

import { useState } from "react";
import styles from "./SpecimenShowcase.module.css";

const SPECIMENS = [
  {
    id: "physics",
    tabLabel: "Physics Derivation",
    subject: "AP Physics 1 — Kinematics",
    studentId: "STU-1049 (Section B)",
    question: "Q3. A particle accelerates from rest at 4.0 m/s² for 5.0 s. Calculate final velocity and distance traveled. (5 Marks)",
    handwritten: `Given: u = 0 m/s, a = 4.0 m/s², t = 5.0 s
(1) v = u + at
    v = 0 + (4.0)(5.0) = 20 m/s

(2) s = ut + ½ at²
    s = 0(5.0) + ½(4.0)(5.0)²
    s = 2.0 × 25 = 50 m`,
    ocrConfidence: "98%",
    gradingConfidence: "96%",
    status: "Auto-Approved",
    isWarning: false,
    score: "5.0 / 5.0",
    rubric: [
      { name: "Correct velocity formula & substitution", award: "2.0 / 2.0" },
      { name: "Correct distance formula & substitution", award: "2.0 / 2.0" },
      { name: "Accurate units (m/s, m)", award: "1.0 / 1.0" }
    ],
    reasoning: "Step-by-step derivation with both formulas stated clearly. Proper substitutions and units provided in both parts."
  },
  {
    id: "literature",
    tabLabel: "Humanities Essay",
    subject: "World Literature — Hamlet",
    studentId: "STU-1082 (Section A)",
    question: "Q2. Analyze how Shakespeare uses dramatic irony in Hamlet's hesitation to kill Claudius during prayer. (7 Marks)",
    handwritten: `Shakespeare creates acute dramatic irony because the audience knows Claudius is unable to truly repent ("Words without thoughts never to heaven go"). 

Hamlet refrains from killing him, believing he would send Claudius's soul straight to salvation. 

This tragic misjudgment underscores Hamlet's paralysis: his desire for perfect revenge prevents immediate justice.`,
    ocrConfidence: "97%",
    gradingConfidence: "94%",
    status: "Auto-Approved",
    isWarning: false,
    score: "6.5 / 7.0",
    rubric: [
      { name: "Clear thesis on dramatic irony", award: "2.0 / 2.0" },
      { name: "Textual quote / evidence cited", award: "2.5 / 3.0" },
      { name: "Insight on tragic paralysis", award: "2.0 / 2.0" }
    ],
    reasoning: "Insightful thesis highlighting the contrast between Claudius's confession and Hamlet's assumption. Minor deduction for brief quotation length."
  },
  {
    id: "review",
    tabLabel: "Review Safety Net",
    subject: "Organic Chemistry — Reaction Mechanism",
    studentId: "STU-1104 (Section C)",
    question: "Q5. Outline the SN2 transition state for bromomethane reacting with hydroxide ion. (5 Marks)",
    handwritten: `HO⁻ attacks CH₃Br from backside.
Transition state: [HO···CH₃···Br]‡
Inversion of stereochemistry occurs.
Rate = k [CH₃Br] [OH⁻]² (?)`,
    ocrConfidence: "78%",
    gradingConfidence: "68%",
    status: "Needs Teacher Review",
    isWarning: true,
    score: "3.5 / 5.0 (Proposed)",
    rubric: [
      { name: "Backside attack & transition state", award: "2.5 / 2.5" },
      { name: "Stereochemical outcome stated", award: "1.0 / 1.0" },
      { name: "Rate law formula verification", award: "0.0 / 1.5 (?)" }
    ],
    reasoning: "Ambiguous exponent detected in rate law: student wrote second order in OH⁻ with a question mark. Flagged for teacher discretion."
  }
];

export default function SpecimenShowcase() {
  const [activeTab, setActiveTab] = useState("physics");

  const current = SPECIMENS.find((s) => s.id === activeTab) || SPECIMENS[0];

  return (
    <section className={styles.section} id="specimens">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.label}>TRANSPARENT EVALUATION</span>
          <h2 className={styles.title}>See How AEGIS Evaluates Real Student Work</h2>
          <p className={styles.subtitle}>
            From messy mathematical calculations to nuanced essays and borderline flags, 
            AEGIS pairs handwriting OCR with granular rubric grading and instant safety-net reviews.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabs}>
          {SPECIMENS.map((specimen) => (
            <button
              key={specimen.id}
              type="button"
              className={`${styles.tab} ${activeTab === specimen.id ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(specimen.id)}
            >
              {specimen.tabLabel}
            </button>
          ))}
        </div>

        {/* Live Specimen Viewer */}
        <div className={styles.viewer}>
          {/* Left: Handwritten Paper Specimen */}
          <div className={styles.sheetPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTag}>Raw Student Answer Sheet</span>
              <span className={styles.studentMeta}>{current.studentId}</span>
            </div>
            <div className={styles.sheetPaper}>
              <div className={styles.questionPrompt}>{current.question}</div>
              <div className={styles.handwrittenText}>{current.handwritten}</div>
            </div>
          </div>

          {/* Right: AEGIS Real-Time Grading Breakdown */}
          <div className={styles.analysisPanel}>
            <div className={styles.statusRow}>
              <span className={`${styles.statusBadge} ${current.isWarning ? styles.statusWarning : styles.statusSuccess}`}>
                {current.isWarning ? "⚠️" : "✓"} {current.status}
              </span>
              <span className={styles.scorePill}>{current.score}</span>
            </div>

            {/* Confidence Metrics */}
            <div className={styles.confidenceGrid}>
              <div className={styles.confidenceCard}>
                <span className={styles.confidenceLabel}>OCR Handwriting Fidelity</span>
                <span className={styles.confidenceValue}>{current.ocrConfidence}</span>
              </div>
              <div className={styles.confidenceCard}>
                <span className={styles.confidenceLabel}>Grading Confidence</span>
                <span className={styles.confidenceValue}>{current.gradingConfidence}</span>
              </div>
            </div>

            {/* Rubric Breakdown */}
            <div className={styles.rubricBox}>
              <span className={styles.rubricTitle}>Rubric Criteria Matched</span>
              {current.rubric.map((item, idx) => (
                <div key={idx} className={styles.rubricItem}>
                  <span className={styles.rubricName}>{item.name}</span>
                  <span className={styles.rubricAward}>{item.award}</span>
                </div>
              ))}
            </div>

            {/* AI Teacher Reasoning */}
            <div className={styles.reasoningCard}>
              <span className={styles.reasoningLabel}>AI Evaluator Note</span>
              <p className={styles.reasoningText}>{current.reasoning}</p>
            </div>

            {/* Simulated Teacher Actions */}
            <div className={styles.actionRow}>
              <button type="button" className={styles.btnAccept}>
                {current.isWarning ? "Approve Proposed Score" : "Confirmed by Teacher"}
              </button>
              <button type="button" className={styles.btnOverride}>
                Manual Override
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
