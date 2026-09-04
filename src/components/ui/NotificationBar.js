'use client';

import React, { useEffect, useState } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import styles from './NotificationBar.module.css';

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const SuccessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ToastItem = ({ notif, hideNotification }) => {
  const { id, message, type, duration, action } = notif;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration <= 0) return;
    const interval = 10;
    const step = 100 / (duration / interval);
    const timer = setInterval(() => {
      setProgress((p) => Math.max(p - step, 0));
    }, interval);
    return () => clearInterval(timer);
  }, [duration]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <SuccessIcon />;
      case 'warning': return <WarningIcon />;
      case 'error': return <ErrorIcon />;
      default: return <InfoIcon />;
    }
  };

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <div className={styles.toastContent}>
        <div className={styles.iconWrap}>{getIcon()}</div>
        <p className={styles.message}>{message}</p>
        
        {action && (
          <button 
            className={styles.actionBtn} 
            onClick={() => {
              action.onClick();
              hideNotification(id);
            }}
          >
            {action.label}
          </button>
        )}

        <button className={styles.closeBtn} onClick={() => hideNotification(id)} aria-label="Close">
          <CloseIcon />
        </button>
      </div>
      
      {duration > 0 && (
        <div className={styles.progressContainer}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
};

export default function NotificationBar() {
  const { notifications, hideNotification } = useNotification();

  if (!notifications || notifications.length === 0) return null;

  return (
    <div className={styles.container}>
      {notifications.map((notif) => (
        <ToastItem key={notif.id} notif={notif} hideNotification={hideNotification} />
      ))}
    </div>
  );
}
