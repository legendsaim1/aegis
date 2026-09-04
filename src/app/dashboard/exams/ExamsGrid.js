'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ExamCard from '@/components/exam/ExamCard';
import styles from './exams.module.css';

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export default function ExamsGrid({ exams }) {
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const subjects = useMemo(
    () => [...new Set(exams.map((e) => e.subject).filter(Boolean))],
    [exams]
  );

  const filtered = useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch = (exam.title || '').toLowerCase().includes(search.toLowerCase());
      const matchesSubject = subjectFilter === 'all' || exam.subject === subjectFilter;
      const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;
      return matchesSearch && matchesSubject && matchesStatus;
    });
  }, [exams, search, subjectFilter, statusFilter]);

  return (
    <>
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search by exam title..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.select}
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
        >
          <option value="all">All Subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className={styles.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="graded">Graded</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.noResults}>
          No exams match your filters. <Link href="/dashboard/exams/new">Create a new exam</Link>.
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}
    </>
  );
}
