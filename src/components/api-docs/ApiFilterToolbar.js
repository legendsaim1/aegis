"use client";

import styles from "@/app/docs/api/page.module.css";
import { useApiDocsFilter } from "./ApiDocsFilterContext";

const METHODS = ["ALL", "GET", "POST", "PATCH", "DELETE"];

export default function ApiFilterToolbar() {
  const { activeMethod, setActiveMethod, searchQuery, setSearchQuery } = useApiDocsFilter();

  return (
    <div className={styles.filterToolbar}>
      <div className={styles.searchBox}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          placeholder="Filter endpoints by path or keyword (e.g. exams, grading, copy)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
          aria-label="Filter endpoints"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className={styles.clearSearchBtn}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <div className={styles.methodFilters}>
        {METHODS.map((m) => {
          const isActive = activeMethod === m;
          const methodClass = m !== "ALL" ? (styles[m.toLowerCase()] || "") : "";
          return (
            <button
              key={m}
              type="button"
              className={`${styles.methodPill} ${isActive ? `${styles.methodPillActive} ${methodClass}` : ""}`}
              onClick={() => setActiveMethod(m)}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}
