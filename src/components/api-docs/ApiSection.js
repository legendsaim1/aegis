"use client";

import { useState } from 'react';
import styles from './ApiSection.module.css';
import CodeBlock from './CodeBlock';
import { useApiDocsFilter } from './ApiDocsFilterContext';

export default function ApiSection({ id, title, method, path, description, status, children, codeBlocks }) {
  const [copiedPath, setCopiedPath] = useState(false);
  const { activeMethod, searchQuery } = useApiDocsFilter();

  // Method filtering
  if (activeMethod !== 'ALL') {
    if (!method) return null;
    if (method.toUpperCase() !== activeMethod.toUpperCase()) return null;
  }

  // Keyword search filtering
  if (searchQuery && searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    const matchesPath = path?.toLowerCase().includes(q);
    const matchesTitle = title?.toLowerCase().includes(q);
    const matchesDesc = description?.toLowerCase().includes(q);
    const matchesMethod = method?.toLowerCase().includes(q);
    if (!matchesPath && !matchesTitle && !matchesDesc && !matchesMethod) {
      return null;
    }
  }

  const defaultStatus = status || (method ? (method.toUpperCase() === 'POST' ? '201 Created' : '200 OK') : null);

  const copyPath = () => {
    if (!path) return;
    navigator.clipboard.writeText(path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  return (
    <section id={id} className={styles.section}>
      <div className={styles.prose}>
        {title && <h2 className={styles.title}>{title}</h2>}
        {(method || path) && (
          <div className={styles.endpoint}>
            {method && <span className={`${styles.method} ${styles[method.toLowerCase()] || ''}`}>{method}</span>}
            {path && <span className={styles.path}>{path}</span>}
            {path && (
              <button
                type="button"
                className={`${styles.copyPathBtn} ${copiedPath ? styles.copyPathSuccess : ''}`}
                onClick={copyPath}
                title={copiedPath ? "Path Copied!" : "Copy endpoint path"}
                aria-label="Copy endpoint path"
              >
                {copiedPath ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                )}
              </button>
            )}
            {defaultStatus && <span className={styles.statusBadge}>{defaultStatus}</span>}
          </div>
        )}
        <div className={styles.description}>
          {description && <p>{description}</p>}
          {children}
        </div>
      </div>
      <div className={styles.code}>
        {codeBlocks?.map((block, idx) => (
          <CodeBlock 
            key={idx} 
            title={block.title} 
            code={block.code} 
            language={block.language} 
          />
        ))}
      </div>
    </section>
  );
}
