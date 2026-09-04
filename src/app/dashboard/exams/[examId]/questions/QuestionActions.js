'use client';

import React from 'react';
import styles from '../questionsTab.module.css';
import { EyeIcon, InfoIcon, EditIcon, TrashIcon } from './QuestionIcons';

export function QuestionActions({
  item,
  group,
  onToggleRubric,
  onToggleInstruction,
  onEdit,
  onDelete,
  style
}) {
  return (
    <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto', alignItems: 'flex-start', ...style }}>
      <button
        type="button"
        className={styles.actionBtn}
        style={{ padding: '6px' }}
        onClick={() => onToggleRubric?.(item.id)}
        title="Toggle Rubric"
      >
        <EyeIcon />
      </button>
      <button
        type="button"
        className={styles.actionBtn}
        style={{ padding: '6px' }}
        onClick={() => onToggleInstruction?.(item.id)}
        title="Toggle Instructions"
      >
        <InfoIcon />
      </button>
      <button
        type="button"
        className={styles.actionBtn}
        style={{ padding: '6px' }}
        onClick={() => onEdit?.(group)}
        title="Edit"
      >
        <EditIcon />
      </button>
      <button
        type="button"
        className={`${styles.actionBtn} ${styles.deleteBtn}`}
        style={{ padding: '6px' }}
        onClick={() => onDelete?.(item.id)}
        title="Delete"
      >
        <TrashIcon />
      </button>
    </div>
  );
}

export default QuestionActions;
