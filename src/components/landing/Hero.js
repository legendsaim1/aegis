"use client";

import styles from "./Hero.module.css";

export default function Hero({ onSignupClick }) {
  return (
    <section className={styles.hero}>
      {/* Dot pattern background (SVG, not radial gradient) */}
      <div className={styles.pattern} aria-hidden="true" />

      <div className={styles.container}>
        {/* Left Column: Text Content */}
        <div className={styles.textContent}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            AI-Powered Academic Intelligence
          </div>

          <h1 className={styles.title}>
            Grade Exams Smarter,
            <br />
            <span className={styles.titleAccent}>Not Harder.</span>
          </h1>

          <p className={styles.subtitle}>
            AEGIS uses Gemini AI to read handwritten answer sheets, grade them against
            your custom rubrics, detect plagiarism, and deliver instant analytics with
            full confidence scores — so you can focus on teaching, not paperwork.
          </p>

          <div className={styles.actions}>
            <a href="?modal=signup" onClick={onSignupClick} className={styles.btnPrimary}>
              Get Started Free
              <svg className={styles.btnIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
            <a href="#how-it-works" className={styles.btnSecondary}>
              See How It Works
            </a>
          </div>
        </div>

        {/* Right Column: Visual Anchor */}
        <div className={styles.visualContent} aria-hidden="true">
          
          {/* Base Paper/Sheet Mockup (Back Card) */}
          <div className={styles.mockSheetWrapper}>
            <div className={styles.mockSheet}>
              <div className={styles.mockHeader}>
                <div className={styles.mockLines}>
                  <div className={styles.mockLine} style={{ width: "40%" }} />
                  <div className={styles.mockLine} style={{ width: "70%" }} />
                </div>
                {/* Grounded A+ Grade Badge */}
                <div className={styles.mockGradeBadge}>A+</div>
              </div>
              
              <div className={styles.mockBody}>
                <div className={styles.mockAnswer}>
                  <div className={styles.mockHandwritingLine} style={{ width: "90%" }} />
                  <div className={styles.mockHandwritingLine} style={{ width: "85%" }} />
                  {/* Fake handwriting squiggle */}
                  <svg className={styles.mockSquiggle} viewBox="0 0 100 12" preserveAspectRatio="none">
                    <path d="M0,6 Q10,0 20,6 T40,6 T60,6 T80,6 T100,6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <div className={styles.mockHandwritingLine} style={{ width: "60%" }} />
                </div>
                
                <div className={styles.mockAIFeedback}>
                  <div className={styles.mockIcon}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div className={styles.mockFeedbackText}>
                    Excellent analysis. Correctly identified the core themes.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Dashboard Card (Front Card) */}
          <div className={styles.mockCardWrapper}>
            <div className={styles.mockCard}>
              <div className={styles.mockCardHeader}>
                <span>Batch Grading</span>
                <span className={styles.mockCardStatus}>Processing</span>
              </div>
              <div className={styles.mockCardRow}>
                <div className={styles.mockAvatar}>S1</div>
                <div className={styles.mockRowInfo}>
                  <div className={styles.mockRowName}>Student 104</div>
                  <div className={styles.mockRowScore}>92/100</div>
                </div>
                <div className={styles.mockConfidence}>98% Conf.</div>
              </div>
              <div className={styles.mockCardRow}>
                <div className={styles.mockAvatar}>S2</div>
                <div className={styles.mockRowInfo}>
                  <div className={styles.mockRowName}>Student 105</div>
                  <div className={styles.mockRowScore}>88/100</div>
                </div>
                <div className={styles.mockConfidence}>95% Conf.</div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Bordered Proof Strip for Stats */}
      <div className={styles.statsContainer}>
        <div className={styles.statsStrip}>
          <div className={styles.stat}>
            <span className={styles.statValue}>10×</span>
            <span className={styles.statLabel}>Faster Grading</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>95%+</span>
            <span className={styles.statLabel}>OCR Accuracy</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>Zero</span>
            <span className={styles.statLabel}>Human Bias</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>100%</span>
            <span className={styles.statLabel}>Data Privacy</span>
          </div>
        </div>
      </div>
    </section>
  );
}
