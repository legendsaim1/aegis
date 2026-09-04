"use client";

import styles from "./Footer.module.css";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand Column */}
          <div className={styles.brandCol}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoIcon}>✦</span>
              <span className={styles.logoText}>AEGIS</span>
            </Link>
            <p className={styles.brandDescription}>
              Grade exams smarter, not harder. AI-powered grading and OCR for modern educators.
            </p>
            <div className={styles.socials}>
              <a href="mailto:hackathonprojectdev@gmail.com" aria-label="Email" className={styles.socialLink}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className={styles.linkCol}>
            <h4 className={styles.linkTitle}>Product</h4>
            <a href="/#features" className={styles.link}>Features</a>
            <a href="/#how-it-works" className={styles.link}>How It Works</a>
            <a href="/#faq" className={styles.link}>FAQ</a>
          </div>

          {/* Company Links */}
          <div className={styles.linkCol}>
            <h4 className={styles.linkTitle}>Company</h4>
            <Link href="/about-us" className={styles.link}>About Us</Link>
            <Link href="/blog" className={styles.link}>Blog</Link>
          </div>

          {/* Resources Links */}
          <div className={styles.linkCol}>
            <h4 className={styles.linkTitle}>Resources</h4>
            <Link href="/help" className={styles.link}>Help Center</Link>
            <Link href="/docs/api" className={styles.link}>API Reference</Link>
          </div>

          {/* Legal Links */}
          <div className={styles.linkCol}>
            <h4 className={styles.linkTitle}>Legal</h4>
            <Link href="/privacy-policy" className={styles.link}>Privacy Policy</Link>
            <Link href="/terms" className={styles.link}>Terms of Service</Link>
          </div>
        </div>

        <div className={styles.bottom}>
          <div className={styles.copyright}>
            © {new Date().getFullYear()} AEGIS. Built for Alibaba Cloud AI Hackathon Pakistan 2026.
          </div>
        </div>
      </div>
    </footer>
  );
}
