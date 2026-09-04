"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Topbar.module.css";
import { supabaseClient } from "@/lib/supabase/client";

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5v14"/>
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const ChevronDownIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
  </svg>
);

const examSubjectCache = new Map();

export default function Topbar({ toggleSidebar, userName = "Teacher", userEmail = "teacher@school.edu", userInitial = "T", avatarUrl = null, onLogout }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const bellRef = useRef(null);
  const avatarRef = useRef(null);

  const handleLogoutClick = (e) => {
    e.preventDefault();
    setIsAvatarOpen(false);
    onLogout();
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications?limit=5');
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.notifications.filter(n => !n.is_read).length);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };

    fetchNotifications();

    window.addEventListener('refreshNotifications', fetchNotifications);
    return () => window.removeEventListener('refreshNotifications', fetchNotifications);
  }, []);

  useEffect(() => {
    const mainEl = document.querySelector('[class*="mainContent"]');
    if (!mainEl) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = mainEl.scrollTop > 8;
          setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };

    mainEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => mainEl.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setIsBellOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setIsAvatarOpen(false);
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsBellOpen(false);
        setIsAvatarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const [examSubjects, setExamSubjects] = useState({});

  useEffect(() => {
    if (!pathname) return;
    const segments = pathname.replace("/dashboard/", "").split("/").filter(Boolean);
    const examId = segments.find(s => s.length === 36 && s.includes('-'));
    
    if (examId) {
      if (examSubjectCache.has(examId)) {
        setExamSubjects(prev => prev[examId] ? prev : ({ ...prev, [examId]: examSubjectCache.get(examId) }));
      } else if (!examSubjects[examId]) {
        fetch(`/api/exams/${examId}?fields=subject`)
          .then(r => r.json())
          .then(data => {
            if (data && data.subject) {
              examSubjectCache.set(examId, data.subject);
              setExamSubjects(prev => ({ ...prev, [examId]: data.subject }));
            }
          })
          .catch(() => {});
      }
    }
  }, [pathname, examSubjects]);

  const getBreadcrumbs = () => {
    if (!pathname || pathname === "/dashboard") return [{ label: "Overview", href: "/dashboard" }];
    const segments = pathname.replace("/dashboard/", "").split("/").filter(Boolean);
    let path = "/dashboard";
    return segments.map((seg) => {
      path += `/${seg}`;
      let label = seg.charAt(0).toUpperCase() + seg.slice(1);
      if (seg.length === 36 && seg.includes('-')) {
        label = examSubjects[seg] || 'Exam';
      }
      return { label, href: path };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className={`${styles.topbar} ${isScrolled ? styles.scrolled : ""}`}>
      {/* Left — mobile menu + breadcrumb */}
      <div className={styles.left}>
        <button
          className={styles.menuBtn}
          onClick={toggleSidebar}
          aria-label="Toggle navigation"
        >
          <MenuIcon />
        </button>

        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/dashboard" className={styles.breadcrumbRoot}>
            AEGIS
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className={styles.breadcrumbCrumb}>
              <span className={styles.breadcrumbSep}>/</span>
              {index === breadcrumbs.length - 1 ? (
                <span className={styles.breadcrumbCurrent}>{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className={styles.breadcrumbRoot} style={{ textTransform: 'none', fontSize: '14px', letterSpacing: 'normal' }}>
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right — search, CTA, bell, avatar */}
      <div className={styles.right}>
        {/* Search removed as requested */}


        {/* Bell Dropdown */}
        <div className={styles.dropdownWrap} ref={bellRef}>
          <button 
            className={`${styles.iconBtn} ${isBellOpen ? styles.iconBtnActive : ""}`}
            onClick={() => setIsBellOpen(!isBellOpen)}
            aria-label="Notifications"
            aria-expanded={isBellOpen}
          >
            <BellIcon />
            {unreadCount > 0 && <span className={styles.badge} aria-hidden="true">{unreadCount}</span>}
          </button>
          
          {isBellOpen && (
            <div className={styles.dropdownPanel}>
              <div className={styles.dropdownHeader}>
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <button 
                    className={styles.markReadBtn}
                    onClick={async () => {
                      setUnreadCount(0);
                      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                      await fetch('/api/notifications', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ markAll: true })
                      }).catch(console.error);
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <ul className={styles.notificationList}>
                {notifications.length === 0 ? (
                  <li className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                      <BellIcon />
                    </div>
                    <p>You're all caught up!</p>
                    <span>No new notifications</span>
                  </li>
                ) : (
                  notifications.map(notif => {
                    const timeAgo = Math.round((new Date() - new Date(notif.created_at)) / 60000);
                    const timeStr = timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo/60)}h ago`;
                    
                    const NotificationContent = () => (
                      <div className={`${styles.notifContent} ${!notif.is_read ? styles.unread : ''}`}>
                        <div className={`${styles.notifIconWrap} ${styles[notif.type] || styles.info}`}>
                          {notif.type === 'warning' || notif.type === 'error' ? '!' : '✓'}
                        </div>
                        <div className={styles.notifTextWrap}>
                          <p className={styles.notifTitle}>{notif.title || 'Notification'}</p>
                          <p className={styles.notifMessage}>{notif.message}</p>
                          <span className={styles.notifTime}>{timeStr}</span>
                        </div>
                        {!notif.is_read && <div className={styles.unreadDot} />}
                      </div>
                    );

                    return (
                      <li key={notif.id} className={styles.notificationItem}>
                        <NotificationContent />
                      </li>
                    );
                  })
                )}
              </ul>
              <div className={styles.dropdownFooter}>
                <Link href="/dashboard/activity" onClick={() => setIsBellOpen(false)}>View all activity</Link>
              </div>
            </div>
          )}
        </div>

        {/* Avatar Dropdown */}
        <div className={styles.dropdownWrap} ref={avatarRef}>
          <button
            type="button"
            className={styles.avatarChip}
            onClick={() => setIsAvatarOpen(!isAvatarOpen)}
            aria-label="User account"
            aria-expanded={isAvatarOpen}
          >
            <div className={styles.avatar} style={avatarUrl ? { position: 'relative', overflow: 'hidden' } : undefined}>
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" fill sizes="40px" style={{ objectFit: 'cover' }} />
              ) : userInitial}
            </div>
            <ChevronDownIcon className={styles.avatarChevron} />
          </button>

          {isAvatarOpen && (
            <div className={`${styles.dropdownPanel} ${styles.accountPanel}`}>
              <div className={styles.accountHeader}>
                <div className={styles.avatarLarge} style={avatarUrl ? { position: 'relative', overflow: 'hidden' } : undefined}>
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="" fill sizes="60px" style={{ objectFit: 'cover' }} />
                  ) : userInitial}
                </div>
                <div className={styles.accountHeaderText}>
                  <p className={styles.userName}>{userName}</p>
                  <p className={styles.userEmail}>{userEmail}</p>
                </div>
              </div>

              <div className={styles.accountDivider} />

              <ul className={styles.accountMenu}>
                <li>
                  <Link
                    href="/dashboard/settings"
                    className={styles.accountMenuItem}
                    onClick={() => setIsAvatarOpen(false)}
                  >
                    <SettingsIcon /> Settings
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    className={`${styles.accountMenuItem} ${styles.accountMenuItemDanger}`}
                    onClick={handleLogoutClick}
                  >
                    <LogoutIcon /> Sign Out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
