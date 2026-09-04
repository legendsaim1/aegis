"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./Sidebar.module.css";
import { supabaseClient } from "@/lib/supabase/client";

const mainNav = [
  {
    name: "Home",
    href: "/dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    name: "Exams",
    href: "/dashboard/exams",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
        <path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>
      </svg>
    ),
  },
  {
    name: "Results",
    href: "/dashboard/results",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    name: "To Review",
    href: "/dashboard/review",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    name: "Activity",
    href: "/dashboard/activity",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
];

const systemNav = [
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
];

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" x2="9" y1="12" y2="12"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

function NavItem({ item, isActive, onClose, isCollapsed }) {
  return (
    <li>
      <Link
        href={item.href}
        className={`${styles.navItem} ${isActive ? styles.active : ""}`}
        onClick={onClose}
        title={isCollapsed ? item.name : undefined}
      >
        <span className={styles.navIcon}>{item.icon}</span>
        {!isCollapsed && <span>{item.name}</span>}
      </Link>
    </li>
  );
}

export default function Sidebar({ isOpen, onClose, isCollapsed, toggleCollapse, userName = "Teacher", userInitial = "T", avatarUrl = null, onLogout }) {
  const pathname = usePathname();
  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname?.startsWith(href);
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""} ${isCollapsed ? styles.collapsed : ""}`}>
      {/* Header — Logo */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>✦</span>
          {!isCollapsed && <span className={styles.logoText}>AEGIS</span>}
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close menu">
          <CloseIcon />
        </button>
      </div>

      {/* Navigation */}
      <nav className={styles.nav} aria-label="Main navigation">
        {/* Main group */}
        <div className={styles.navGroup}>
          {!isCollapsed && <span className={styles.navLabel}>Main</span>}
          <ul className={styles.navList}>
            {mainNav.map((item) => (
              <NavItem key={item.name} item={item} isActive={isActive(item.href)} onClose={onClose} isCollapsed={isCollapsed} />
            ))}
          </ul>
        </div>

        {/* System group */}
        <div className={styles.navGroup}>
          {!isCollapsed && <span className={styles.navLabel}>System</span>}
          <ul className={styles.navList}>
            {systemNav.map((item) => (
              <NavItem key={item.name} item={item} isActive={isActive(item.href)} onClose={onClose} isCollapsed={isCollapsed} />
            ))}
          </ul>
        </div>
      </nav>

      {/* Collapse Toggle */}
      <div className={styles.collapseWrap}>
        <button 
          className={styles.collapseBtn} 
          onClick={toggleCollapse} 
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>

      {/* Footer — User Profile */}
      <div className={styles.footer}>
        <div className={styles.userRow}>
          <div className={styles.avatarWrap} title={isCollapsed ? `${userName} (Educator)` : undefined}>
            <div className={styles.avatar} style={avatarUrl ? { position: 'relative', overflow: 'hidden' } : undefined}>
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" fill sizes="40px" style={{ objectFit: 'cover' }} />
              ) : userInitial}
            </div>
          </div>
          {!isCollapsed && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{userName}</span>
              <span className={styles.userPlan}>Educator</span>
            </div>
          )}
          <button className={styles.logoutBtn} aria-label="Log out" title="Log out" onClick={onLogout}>
            <LogoutIcon />
          </button>
        </div>
      </div>
    </aside>
  );
}
