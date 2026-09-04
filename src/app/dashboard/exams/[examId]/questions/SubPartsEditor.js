'use client';

import React from 'react';
import styles from './SubPartsEditor.module.css';
import RubricEditor from './RubricEditor';
import { TrashIcon } from './QuestionIcons';

export function SubPartsEditor({
  parts = [],
  removePart,
  updatePart,
  handleGenerateRubric,
  generatingRubricId
}) {
  if (!parts || parts.length === 0) return null;

  return (
    <div className={styles.partsList}>
      {parts.map((p) => (
        <div key={p.id} className={styles.partCard}>
          <div className={styles.partHeader}>
            <span className={styles.partBadge}>Part {p.sub_part}</span>
            <div className={styles.controlsGroup}>
              <select
                className={styles.select}
                value={p.type}
                onChange={(e) => updatePart(p.id, 'type', e.target.value)}
              >
                <option value="mcq">Multiple Choice</option>
                <option value="short">Short Answer</option>
                <option value="long">Long Answer</option>
                <option value="blank">Fill in Blank</option>
              </select>
              <span className={styles.marksLabel}>Marks:</span>
              <input
                type="number"
                min="1"
                className={styles.marksInput}
                value={p.marks}
                onChange={(e) => updatePart(p.id, 'marks', e.target.value)}
                placeholder="1"
              />
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => removePart(p.id)}
                title="Remove part"
              >
                <TrashIcon />
              </button>
            </div>
          </div>

          <textarea
            className={styles.textarea}
            placeholder="Type part question here..."
            value={p.text}
            onChange={(e) => updatePart(p.id, 'text', e.target.value)}
            rows="2"
          />

          <RubricEditor
            rubric={p.rubric}
            onChangeRubric={(val) => updatePart(p.id, 'rubric', val)}
            instructions={p.teacher_instructions}
            onChangeInstructions={(val) => updatePart(p.id, 'teacher_instructions', val)}
            onGenerateRubric={() => handleGenerateRubric(p.id)}
            isGenerating={generatingRubricId === p.id}
            showLabel={false}
            instructionLabel="Grading Instructions (Optional)"
          />
        </div>
      ))}
    </div>
  );
}

export default SubPartsEditor;
