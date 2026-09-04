'use client';

import React from 'react';
import styles from './Badge.module.css';

export default function Badge({
  children,
  variant = 'neutral',
  withDot = false,
  className = '',
  style = {},
  srLabel = null
}) {
  const variantClass = styles[variant] || styles.neutral;

  return (
    <span className={`${styles.badge} ${variantClass} ${className}`} style={style}>
      {withDot && <span className={styles.dot} aria-hidden="true" />}
      {srLabel && <span className={styles.srOnly}>{srLabel}</span>}
      {children}
    </span>
  );
}
