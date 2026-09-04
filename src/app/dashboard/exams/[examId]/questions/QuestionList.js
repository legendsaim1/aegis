'use client';

import React, { useMemo } from 'react';
import styles from '../questionsTab.module.css';
import QuestionCard from './QuestionCard';
import { PlusIcon } from './QuestionIcons';

export function QuestionList({
  questions = [],
  examId,
  onOpenAdd,
  onOpenEdit,
  onDeleteRequest
}) {
  const groupedQuestions = useMemo(() => {
    const byNumber = {};
    questions.forEach(q => {
      if (!byNumber[q.question_number]) {
        byNumber[q.question_number] = { parent: null, parts: [] };
      }
      if (q.sub_part === null) {
        byNumber[q.question_number].parent = q;
      } else {
        byNumber[q.question_number].parts.push(q);
      }
    });

    const groups = Object.values(byNumber);
    groups.forEach(group => {
      group.parts.sort((a, b) => (a.sub_part || '').localeCompare(b.sub_part || ''));
    });

    groups.sort((a, b) => {
      const numA = a.parent ? a.parent.question_number : (a.parts[0]?.question_number || 0);
      const numB = b.parent ? b.parent.question_number : (b.parts[0]?.question_number || 0);
      return numA - numB;
    });

    return groups;
  }, [questions]);

  if (questions.length === 0) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
          No questions added to this exam yet.
        </div>
        <button type="button" className={styles.addBtn} onClick={onOpenAdd}>
          <PlusIcon /> Add Question
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {groupedQuestions.map((group) => {
        const mainQ = group.parent || group.parts[0];
        if (!mainQ) return null;
        return (
          <QuestionCard
            key={`group-${mainQ.question_number}`}
            group={group}
            examId={examId}
            onEdit={onOpenEdit}
            onDelete={onDeleteRequest}
          />
        );
      })}

      <button type="button" className={styles.addBtn} onClick={onOpenAdd}>
        <PlusIcon /> Add Question
      </button>
    </div>
  );
}

export default QuestionList;
