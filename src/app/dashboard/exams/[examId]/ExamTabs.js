'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './examLayout.module.css';

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

export default function ExamTabs({ examId }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const tabs = [
    { id: 'questions', label: 'Question Paper', path: `/dashboard/exams/${examId}` },
    { id: 'upload', label: 'Answer Sheets', path: `/dashboard/exams/${examId}/upload` },
    { id: 'results', label: 'Results', path: `/dashboard/exams/${examId}/results` },
    { id: 'analytics', label: 'Analytics', path: `/dashboard/exams/${examId}/analytics` },
    { id: 'recheck', label: 'Review', path: `/dashboard/exams/${examId}/recheck` },
    { id: 'copied', label: 'Copied', path: `/dashboard/exams/${examId}/copied` },
    { id: 'manual-recheck', label: 'Manual Recheck', path: `/dashboard/exams/${examId}/manual-recheck` },
  ];

  const getActiveTab = () => {
    const active = tabs.find(tab => 
      tab.id === 'questions' ? pathname === tab.path : pathname.includes(tab.path)
    );
    return active ? active : tabs[0];
  };

  const activeTab = getActiveTab();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className={`${styles.tabsContainer} ${styles.desktopTabs}`}>
        {tabs.map(tab => {
          // Exact match for Questions tab, includes for others
          const isActive = tab.id === 'questions' 
            ? pathname === tab.path 
            : pathname.includes(tab.path);

          return (
            <Link 
              key={tab.id} 
              href={tab.path}
              className={`${styles.tab} ${isActive ? styles.activeTab : ''}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className={styles.mobileTabsContainer} ref={dropdownRef}>
        <button 
          className={`${styles.customDropdownBtn} ${isDropdownOpen ? styles.dropdownOpen : ''}`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span>{activeTab.label}</span>
          <span className={styles.dropdownIcon}><ChevronDownIcon /></span>
        </button>

        {isDropdownOpen && (
          <div className={styles.customDropdownMenu}>
            {tabs.map(tab => {
               const isActive = tab.id === activeTab.id;
               return (
                 <button
                   key={tab.id}
                   className={`${styles.dropdownItem} ${isActive ? styles.dropdownItemActive : ''}`}
                   onClick={() => {
                     setIsDropdownOpen(false);
                     router.push(tab.path);
                   }}
                 >
                   {tab.label}
                 </button>
               );
            })}
          </div>
        )}
      </div>
    </>
  );
}
