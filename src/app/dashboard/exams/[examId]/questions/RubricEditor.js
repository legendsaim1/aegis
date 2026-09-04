'use client';

import React from 'react';
import styles from './RubricEditor.module.css';
import { BotIcon } from './QuestionIcons';

export function RubricEditor({
  rubric = '',
  onChangeRubric,
  instructions = '',
  onChangeInstructions,
  onGenerateRubric,
  isGenerating = false,
  showLabel = true,
  instructionLabel = 'Grading Instructions (Optional)',
  style = {}
}) {
  return (
    <div className={styles.rubricContainer} style={style}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>
          {showLabel ? 'Rubric & Expected Answer' : 'Rubric / Criteria'}
        </span>
        <button
          type="button"
          className={styles.aiBtn}
          onClick={onGenerateRubric}
          disabled={isGenerating}
        >
          <BotIcon /> {isGenerating ? 'Generating...' : 'Generate Rubric with AI'}
        </button>
      </div>

      <div className={styles.fieldGroup}>
        <textarea
          className={styles.textarea}
          placeholder="Specify grading criteria, key points, keywords, or expected answers..."
          value={rubric}
          onChange={(e) => onChangeRubric(e.target.value)}
          rows="4"
        />
      </div>

      {instructionLabel && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            {instructionLabel}
          </label>
          <textarea
            className={styles.textarea}
            placeholder="Teacher Instructions (e.g. Deduct 0.5 for spelling, accept any valid formula)..."
            value={instructions}
            onChange={(e) => onChangeInstructions(e.target.value)}
            rows="2"
          />
        </div>
      )}
    </div>
  );
}

export default RubricEditor;
