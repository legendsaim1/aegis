"use client";

import { useEffect, useState } from 'react';
import styles from './DocsSidebar.module.css';

export default function DocsSidebar({ navigation }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      let currentId = '';
      for (const group of navigation) {
        if (group.items) {
          for (const section of group.items) {
            const el = document.getElementById(section.id);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= 250 && rect.bottom >= 100) {
                currentId = section.id;
              }
            }
          }
        } else {
          // Flattened structure fallback
          const el = document.getElementById(group.id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 250 && rect.bottom >= 100) {
              currentId = group.id;
            }
          }
        }
      }
      if (currentId) setActiveId(currentId);
    };

    window.addEventListener('scroll', handleScroll);
    setTimeout(handleScroll, 100);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navigation]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const getIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  );

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {navigation.map((group, gIdx) => {
          // Handle structured groups
          if (group.group && group.items) {
            return (
              <div key={gIdx} className={styles.group}>
                <h4 className={styles.groupLabel}>{group.group}</h4>
                <div className={styles.groupItems}>
                  {group.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`${styles.navItem} ${activeId === item.id ? styles.active : ''}`}
                    >
                      {getIcon()}
                      <span>{item.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          // Handle flat items
          return (
            <button
              key={group.id}
              onClick={() => scrollToSection(group.id)}
              className={`${styles.navItem} ${activeId === group.id ? styles.active : ''}`}
            >
              {getIcon()}
              <span>{group.title}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
