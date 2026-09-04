'use client';

import React, { useState } from 'react';
import styles from '../questionsTab.module.css';
import QuestionActions from './QuestionActions';
import { EyeIcon, InfoIcon, EditIcon, TrashIcon } from './QuestionIcons';

export const QuestionCard = React.memo(function QuestionCard({ group, examId, onEdit, onDelete }) {
  const { parent, parts } = group;
  const mainQ = parent || parts[0];
  const qNum = mainQ?.question_number;

  const [expandedRubrics, setExpandedRubrics] = useState({});
  const [expandedInstructions, setExpandedInstructions] = useState({});

  const toggleRubric = (id) => setExpandedRubrics(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleInstruction = (id) => setExpandedInstructions(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className={styles.questionCard}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        
        {parent ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', width: '100%' }}>
              <strong style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Q{qNum}:</strong>
              <span style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', flex: 1, lineHeight: '1.5' }}>
                {parent.question_text}
              </span>
              {parts.length === 0 && (
                <span style={{ color: 'var(--text-tertiary)', whiteSpace: 'nowrap', fontSize: '0.9em' }}>
                  ({parent.max_marks} marks)
                </span>
              )}
            </div>
            
            {/* Expanded details for parent */}
            {expandedRubrics[parent.id] && (
              <div className={styles.qRubric} style={{ marginTop: '8px', marginLeft: '0' }}>
                <span className={styles.rubricLabel}>Rubric:</span>
                <span style={{ whiteSpace: 'pre-wrap' }}>
                  {parent.rubric_json ? `"${parent.rubric_json}"` : <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No rubric provided.</span>}
                </span>
              </div>
            )}
            {expandedInstructions[parent.id] && (
              <div className={styles.qRubric} style={{ marginTop: '8px', marginLeft: '0', background: 'var(--accent-light)', borderLeft: '2px solid var(--accent)' }}>
                <span className={styles.rubricLabel}>Instructions:</span>
                <span style={{ whiteSpace: 'pre-wrap' }}>
                  {parent.teacher_instructions ? parent.teacher_instructions : <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No instructions provided.</span>}
                </span>
              </div>
            )}
            {/* Action buttons in footer — only shown for non-grouped (no parts) */}
            {parts.length === 0 && (
              <div className={styles.cardFooter}>
                <QuestionActions
                  item={parent}
                  group={group}
                  onToggleRubric={toggleRubric}
                  onToggleInstruction={toggleInstruction}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            )}
          </div>
        ) : parts.length > 0 ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', width: '100%' }}>
            <strong style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Q{qNum}:</strong>
            <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', flex: 1 }}>
              (Context text missing)
            </span>
            <button
              type="button"
              className={styles.actionBtn}
              style={{ padding: '6px', marginLeft: 'auto' }}
              onClick={() => onEdit(group)}
              title="Edit Group"
            >
              <EditIcon /> Fix Question
            </button>
          </div>
        ) : null}

        {parts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: parent ? '8px' : '0' }}>
            {parts.map(p => (
              <div key={p.id} style={{ 
                fontSize: '0.9em', 
                color: 'var(--text-secondary)', 
                padding: '12px 16px', 
                background: 'var(--bg-primary)', 
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                display: 'flex', 
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', width: '100%' }}>
                  <strong style={{ whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>Part {p.sub_part}:</strong>
                  <span style={{ whiteSpace: 'pre-wrap', flex: 1, lineHeight: '1.5' }}>{p.question_text}</span>
                  <span style={{ color: 'var(--text-tertiary)', whiteSpace: 'nowrap', fontSize: '0.85em' }}>({p.max_marks} marks)</span>
                </div>

                {/* Expanded details for part */}
                {expandedRubrics[p.id] && (
                  <div className={styles.qRubric} style={{ marginTop: '0', marginLeft: '0' }}>
                    <span className={styles.rubricLabel}>Rubric:</span>
                    <span style={{ whiteSpace: 'pre-wrap' }}>
                      {p.rubric_json ? `"${p.rubric_json}"` : <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No rubric provided.</span>}
                    </span>
                  </div>
                )}
                {expandedInstructions[p.id] && (
                  <div className={styles.qRubric} style={{ marginTop: '0', marginLeft: '0', background: 'var(--accent-light)', borderLeft: '2px solid var(--accent)' }}>
                    <span className={styles.rubricLabel}>Instructions:</span>
                    <span style={{ whiteSpace: 'pre-wrap' }}>
                      {p.teacher_instructions ? p.teacher_instructions : <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No instructions provided.</span>}
                    </span>
                  </div>
                )}
                <div className={styles.partFooter}>
                  <QuestionActions
                    item={p}
                    group={group}
                    onToggleRubric={toggleRubric}
                    onToggleInstruction={toggleInstruction}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Card-level footer for grouped questions: rubric/instructions for parent, edit/delete for whole group */}
        {parts.length > 0 && (
          <div className={styles.cardFooter}>
            {parent && (
              <>
                <button
                  type="button"
                  className={styles.actionBtn}
                  style={{ padding: '6px' }}
                  onClick={() => toggleRubric(parent.id)}
                  title="View Parent Rubric"
                >
                  <EyeIcon />
                </button>
                <button
                  type="button"
                  className={styles.actionBtn}
                  style={{ padding: '6px' }}
                  onClick={() => toggleInstruction(parent.id)}
                  title="View Parent Instructions"
                >
                  <InfoIcon />
                </button>
              </>
            )}
            <button
              type="button"
              className={styles.actionBtn}
              style={{ padding: '6px' }}
              onClick={() => onEdit(group)}
              title="Edit Group"
            >
              <EditIcon />
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              style={{ padding: '6px' }}
              onClick={() => onDelete(parent ? parent.id : parts[0].id)}
              title="Delete Group"
            >
              <TrashIcon />
            </button>
          </div>
        )}

      </div>
    </div>
  );
});

export default QuestionCard;
