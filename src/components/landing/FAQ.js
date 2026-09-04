"use client";

import styles from "./FAQ.module.css";

const faqs = [
  {
    question: "Is it accurate on messy handwriting?",
    answer: "Yes. AEGIS uses Google Gemini's advanced multi-modal capabilities combined with state-of-the-art OCR to read cursive, print, and even extremely messy handwriting. If the AI is unsure, it flags the answer with a low OCR confidence score for your manual review."
  },
  {
    question: "Can I override the AI grades?",
    answer: "Absolutely. You always have the final say. AEGIS acts as an intelligent assistant, assigning marks based on your rubric, but you can override any grade, edit the feedback, or add manual comments before finalizing the results."
  },
  {
    question: "Is student data stored securely?",
    answer: "Data privacy is our priority. All uploaded answer sheets are processed via secure endpoints. We do not use your students' data to train our core AI models."
  },
  {
    question: "Does it detect cheating or copied answers?",
    answer: "Yes! Our Copy Detection feature uses semantic similarity analysis to flag answers that are suspiciously similar across the batch, even if the student used slightly different wording."
  },
  {
    question: "How long does grading take?",
    answer: "AEGIS processes a batch of 30 students in approximately 3–6 minutes depending on handwriting and question complexity, compared to 10–15 hours of manual grading."
  },
  {
    question: "What file formats and sizes are supported?",
    answer: "Answer sheets can be uploaded as PDF, JPG, PNG, or WebP. Question papers support the same formats for automated AI extraction. Maximum file size is 20MB per upload."
  },
  {
    question: "Is AEGIS free to use?",
    answer: "AEGIS was developed as an open educational assessment platform for the Alibaba Cloud AI Hackathon Pakistan 2026. It is free for teachers and academic evaluators during our public preview."
  }
];

export default function FAQ() {
  return (
    <section id="faq" className={styles.section}>
      <div className="dotPattern" aria-hidden="true" />
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.label}>FAQ</span>
          <h2 className={styles.title}>Frequently Asked Questions</h2>
          <p className={styles.subtitle}>
            Everything you need to know about integrating AI into your grading workflow.
          </p>
        </div>

        <div className={styles.accordionContainer}>
          {faqs.map((faq, index) => (
            <details key={index} className={styles.details}>
              <summary className={styles.summary}>
                {faq.question}
                <svg className={styles.chevron} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </summary>
              <div className={styles.content}>
                <p>{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
