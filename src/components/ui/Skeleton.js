'use client';

import React from 'react';

export function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-md, 6px)',
  style = {},
  className = '',
  ...props
}) {
  return (
    <div
      className={`skeleton-pulse ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--skeleton-bg, #E5E1D8)',
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

export default Skeleton;
