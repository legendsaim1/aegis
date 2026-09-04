"use client";

import Link from "next/link";
import styles from "./page.module.css";
import PublicNavbar from "@/components/landing/PublicNavbar";
import Footer from "@/components/landing/Footer";

export default function AboutUsPage() {
  const teamMembers = [
    {
      name: "Ali Saim Salehzadeh",
      initials: "AS",
    },
    {
      name: "Muhammad Hamza Shakeel",
      initials: "HS",
    },
    {
      name: "Hamad Abbasi",
      initials: "HA",
    },
  ];

  const missionPillars = [
    {
      title: "Human-in-the-Loop AI",
      desc: "AI should empower teachers, not replace them. AEGIS provides transparent confidence scores, detailed feedback breakdown, and 1-click grade overrides with full audit logging.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
      ),
    },
    {
      title: "Academic Integrity First",
      desc: "Our hybrid TF-IDF and semantic similarity copy detection flags collusion across batch submissions, safeguarding fair evaluation standards for all students.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
      ),
    },
    {
      title: "Multimodal Accessibility",
      desc: "From handwritten exam sheets to structured PDFs, we combine Gemini vision intelligence with resilient failover pipelines so teachers can grade entire classes in minutes.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
      ),
    },
  ];

  const techStack = [
    {
      badge: "Framework",
      name: "Next.js App Router",
      desc: "Fast, modern React architecture with server actions and optimized API route runtimes.",
    },
    {
      badge: "Database & Auth",
      name: "Supabase",
      desc: "Secure PostgreSQL, tenant-isolated Row Level Security (RLS), and real-time state management.",
    },
    {
      badge: "Vision OCR",
      name: "Google Gemini",
      desc: "Multimodal visual reasoning for messy handwriting transcription and question extraction.",
    },
    {
      badge: "High-Speed LLM",
      name: "Groq Inference",
      desc: "Low-latency evaluation across rubrics, topic analytics, and copy detection comparison.",
    },
  ];

  const milestones = [
    {
      number: "01",
      title: "The Problem Identified",
      desc: "Teachers across educational institutions spend 12–18 hours per week manually marking paper exams. We set out to give that time back to classroom instruction.",
    },
    {
      number: "02",
      title: "Alibaba Cloud AI Hackathon Pakistan 2026",
      desc: "Formed the team and built the initial prototype: multi-modal handwriting OCR combined with strict rubric-based grading.",
    },
    {
      number: "03",
      title: "Resilient Multi-Tier AI Architecture",
      desc: "Architected primary and fallback model pools with automated key rate-limit rotation and 60-second cooldown recovery.",
    },
    {
      number: "04",
      title: "Anti-Collusion & Review Hub",
      desc: "Engineered student copy detection, manual re-check override flows, and single-click XLSX gradebook export.",
    },
  ];

  return (
    <div className={styles.page}>
      <PublicNavbar isLandingPage={false} />

      <main className={styles.main}>
        <div className={styles.container}>
          {/* Hero Section */}
          <div className={styles.hero}>
            <h1 className={styles.title}>
              Built by educators,
              <br />
              <span className={styles.titleAccent}>for educators.</span>
            </h1>
            <p className={styles.subtitle}>
              AEGIS was conceived and developed during the Alibaba Cloud AI Hackathon Pakistan 2026 to address a fundamental challenge in modern education: manual paper grading consumes educators' time that should be spent mentoring and inspiring students.
            </p>
          </div>

          {/* Proof Metrics Strip */}
          <div className={styles.metricsContainer}>
            <div className={styles.metricsStrip}>
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>10–15 hrs</span>
                <span className={styles.metricLabel}>Saved Per Batch</span>
              </div>
              <div className={styles.metricDivider} />
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>95%+</span>
                <span className={styles.metricLabel}>OCR Handwriting Fidelity</span>
              </div>
              <div className={styles.metricDivider} />
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>0%</span>
                <span className={styles.metricLabel}>Student Data Retention</span>
              </div>
              <div className={styles.metricDivider} />
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>100%</span>
                <span className={styles.metricLabel}>Human Override Control</span>
              </div>
            </div>
          </div>

          {/* Mission Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Our Core Values</span>
              <h2 className={styles.sectionTitle}>What Drives AEGIS</h2>
              <p className={styles.sectionDesc}>
                We believe artificial intelligence in education must be transparent, verifiable, and deeply respectful of human judgment.
              </p>
            </div>
            <div className={styles.missionGrid}>
              {missionPillars.map((pillar, i) => (
                <div key={i} className={styles.missionCard}>
                  <div className={styles.missionIcon}>{pillar.icon}</div>
                  <h3 className={styles.missionTitle}>{pillar.title}</h3>
                  <p className={styles.missionText}>{pillar.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Team Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>The Builders</span>
              <h2 className={styles.sectionTitle}>Meet the Team</h2>
              <p className={styles.sectionDesc}>
                Developed with passion for educational equity and academic integrity.
              </p>
            </div>
            <div className={styles.teamGrid}>
              {teamMembers.map((member, i) => (
                <div key={i} className={styles.teamCard}>
                  <div className={styles.avatarCircle}>{member.initials}</div>
                  <div className={styles.memberName}>{member.name}</div>
                  <span className={styles.memberBadge}>AEGIS Core Team</span>
                </div>
              ))}
            </div>
          </section>

          {/* Tech Stack Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Under the Hood</span>
              <h2 className={styles.sectionTitle}>Technology Architecture</h2>
              <p className={styles.sectionDesc}>
                Engineered with industry-standard web and AI infrastructure for speed, stability, and scale.
              </p>
            </div>
            <div className={styles.techGrid}>
              {techStack.map((tech, i) => (
                <div key={i} className={styles.techCard}>
                  <div className={styles.techHeader}>
                    <span className={styles.techBadge}>{tech.badge}</span>
                  </div>
                  <div className={styles.techName}>{tech.name}</div>
                  <p className={styles.techDesc}>{tech.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Hackathon Journey Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Our Journey</span>
              <h2 className={styles.sectionTitle}>From Concept to Production</h2>
              <p className={styles.sectionDesc}>
                How AEGIS evolved during the Alibaba Cloud AI Hackathon Pakistan 2026.
              </p>
            </div>
            <div className={styles.timelineCard}>
              {milestones.map((m, i) => (
                <div key={i} className={styles.timelineItem}>
                  <div className={styles.timelineLine} />
                  <div className={styles.timelineMarker}>{m.number}</div>
                  <div className={styles.timelineContent}>
                    <h3 className={styles.timelineStepTitle}>{m.title}</h3>
                    <p className={styles.timelineStepDesc}>{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Contact / CTA Banner */}
          <div className={styles.ctaBanner}>
            <h2 className={styles.ctaTitle}>Ready to transform your grading workflow?</h2>
            <p className={styles.ctaSubtitle}>
              Experience how AEGIS eliminates paperwork, detects academic collusion, and delivers instant, trustworthy insights.
            </p>
            <div className={styles.ctaActions}>
              <Link href="/?modal=signup" className={styles.btnPrimary}>
                Get Started Free &rarr;
              </Link>
              <a href="mailto:hackathonprojectdev@gmail.com" className={styles.btnSecondary}>
                Contact Team
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
