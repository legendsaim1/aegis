"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./PublicNavbar.module.css";
import AuthModal from "@/components/auth/AuthModal";

export default function PublicNavbar({ isLandingPage = false, isDocsPage = false }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [authModalMode, setAuthModalMode] = useState(() => {
    if (typeof window === "undefined") return null;
    const modal = new URLSearchParams(window.location.search).get("modal");
    return modal === "login" || modal === "signup" ? modal : null;
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      if (isLandingPage) {
        // Scroll spy for active link highlighting
        const sections = ["features", "how-it-works", "faq"];
        let current = "";
        for (const section of sections) {
          const el = document.getElementById(section);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 150 && rect.bottom >= 150) {
              current = section;
            }
          }
        }
        setActiveSection(current);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLandingPage]);

  const openModal = (e, mode) => {
    e.preventDefault();
    setAuthModalMode(mode);
    setMenuOpen(false);
    // Optionally update URL without reload
    const currentPath = window.location.pathname;
    window.history.pushState({}, '', `${currentPath}?modal=${mode}`);
  };

  const closeModal = () => {
    setAuthModalMode(null);
    const currentPath = window.location.pathname;
    window.history.pushState({}, '', currentPath);
  };

  // Close menu when clicking a link
  const closeMenu = () => setMenuOpen(false);

  // Link generation helper (handles whether we're on the landing page or another page)
  const getHref = (id) => isLandingPage ? `#${id}` : `/#${id}`;

  return (
    <>
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo} onClick={closeMenu}>
            <span className={styles.logoIcon}>✦</span>
            <span className={styles.logoText}>AEGIS</span>
          </Link>

          {isLandingPage ? (
            <>
              {/* Desktop Nav Links */}
              <div className={styles.navLinks}>
                <Link href="/about-us" className={styles.navLink}>
                  About
                </Link>
                <Link
                  href={getHref("features")}
                  className={`${styles.navLink} ${activeSection === "features" ? styles.navLinkActive : ""}`}
                >
                  Features
                </Link>
                <Link
                  href={getHref("how-it-works")}
                  className={`${styles.navLink} ${activeSection === "how-it-works" ? styles.navLinkActive : ""}`}
                >
                  How It Works
                </Link>
                <Link
                  href={getHref("faq")}
                  className={`${styles.navLink} ${activeSection === "faq" ? styles.navLinkActive : ""}`}
                >
                  FAQ
                </Link>
                <Link href="/docs/api" className={styles.navLink}>
                  Docs
                </Link>
              </div>

              <div className={styles.navActions}>
                <a href="?modal=login" onClick={(e) => openModal(e, "login")} className={styles.navLogin}>Log In</a>
                <a href="?modal=signup" onClick={(e) => openModal(e, "signup")} className={styles.navSignup}>Get Started</a>
              </div>

              {/* Mobile Menu Toggle */}
              <button
                className={styles.mobileToggle}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <span className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ""}`} />
              </button>
            </>
          ) : (
            /* Sub-pages navbar: only "← Back to AEGIS" */
            <div className={styles.navActions}>
              <Link href="/" className={styles.backLink}>
                &larr; Back to AEGIS
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Dropdown Menu (only on landing page) */}
        {isLandingPage && (
          <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`}>
            <div className={styles.mobileMenuInner}>
              <Link href="/about-us" className={styles.mobileNavLink} onClick={closeMenu}>About</Link>
              <Link href={getHref("features")} className={styles.mobileNavLink} onClick={closeMenu}>Features</Link>
              <Link href={getHref("how-it-works")} className={styles.mobileNavLink} onClick={closeMenu}>How It Works</Link>
              <Link href={getHref("faq")} className={styles.mobileNavLink} onClick={closeMenu}>FAQ</Link>
              <Link href="/docs/api" className={styles.mobileNavLink} onClick={closeMenu}>Docs</Link>
              <div className={styles.mobileNavActions}>
                <a href="?modal=login" className={styles.mobileNavLogin} onClick={(e) => openModal(e, "login")}>Log In</a>
                <a href="?modal=signup" className={styles.mobileNavSignup} onClick={(e) => openModal(e, "signup")}>Get Started</a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Auth Modal Overlay */}
      {authModalMode && (
        <AuthModal 
          key={authModalMode}
          initialMode={authModalMode} 
          onClose={closeModal} 
        />
      )}
    </>
  );
}
