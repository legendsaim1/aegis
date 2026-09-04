"use client";

import Link from "next/link";
import styles from "./About.module.css";

export default function About() {
  return (
    <section id="about" className={styles.section}>
      <div className="dotPattern" aria-hidden="true" />
      <div className={styles.container}>
        <div className={styles.content}>
          <span className={styles.label}>About AEGIS</span>
          <h2 className={styles.title}>
            The exam grading system teachers actually want.
          </h2>
          <p className={styles.description}>
            AEGIS started as a hackathon project for Alibaba Cloud AI Hackathon Pakistan 2026 — 
            built because teachers at Pakistani schools spend 12–18 hours a week on manual paper grading. 
            By combining Google Gemini&apos;s multimodal OCR with intelligent rubric-based evaluation, 
            AEGIS automates grading without losing the nuance that matters in subjective answers. 
            The teacher is always in control — every AI decision can be reviewed, overridden, or re-checked.
          </p>
          <div className={styles.badges}>
            <div className={styles.badge}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Secure Data
            </div>
            <div className={styles.badge}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Time Saving
            </div>
            <div className={styles.badge}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              Zero Lock-in
            </div>
          </div>
          <Link href="/about-us" className={styles.aboutCta}>
            Meet the team &amp; our mission &rarr;
          </Link>
        </div>
        
        {/* Simple visual anchor for the About section */}
        <div className={styles.visual}>
          <div className={styles.mockChart}>
            <div className={styles.chartBar} style={{ height: "40%" }} />
            <div className={styles.chartBar} style={{ height: "65%" }} />
            <div className={styles.chartBar} style={{ height: "100%", backgroundColor: "var(--accent)" }} />
            <div className={styles.chartBar} style={{ height: "55%" }} />
            <div className={styles.chartBar} style={{ height: "80%" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
