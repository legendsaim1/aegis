'use client';

import React, { useState, useEffect } from 'react';
import styles from './QuestionForm.module.css';
import Button from '@/components/ui/Button';
import RubricEditor from './RubricEditor';
import SubPartsEditor from './SubPartsEditor';
import { PlusIcon } from './QuestionIcons';
import { useToast } from '@/hooks/useToast';

export function QuestionForm({ isOpen, mode, group, onClose, onSave, examId }) {
  const toast = useToast();
  const [formData, setFormData] = useState(() => {
    if (mode === 'add') {
      return {
        question_number: '', text: '', type: 'short', marks: 5, rubric: '', teacher_instructions: '', parts: []
      };
    } else {
      return {
        id: null,
        text: '',
        type: 'short',
        marks: 5,
        rubric: '',
        teacher_instructions: '',
        parts: []
      };
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [generatingRubricId, setGeneratingRubricId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && group) {
        const mainQ = group.parent || group.parts[0];
        setFormData({
          id: mainQ.id,
          question_number: mainQ.question_number,
          text: group.parent ? group.parent.question_text : mainQ.question_text,
          type: mainQ.question_type,
          marks: mainQ.max_marks,
          rubric: group.parent ? group.parent.rubric_json || '' : mainQ.rubric_json || '',
          teacher_instructions: group.parent ? group.parent.teacher_instructions || '' : mainQ.teacher_instructions || '',
          parts: group.parts.map(p => ({
            id: p.id,
            sub_part: p.sub_part,
            text: p.question_text || '',
            type: p.question_type || 'short',
            marks: p.max_marks || 1,
            rubric: p.rubric_json || '',
            teacher_instructions: p.teacher_instructions || ''
          }))
        });
      } else {
        setFormData({
          id: null,
          text: '',
          type: 'short',
          marks: 5,
          rubric: '',
          teacher_instructions: '',
          parts: []
        });
      }
    }
  }, [isOpen, mode, group]);

  if (!isOpen) return null;

  const addPart = () => {
    setFormData(prev => {
      const parts = prev.parts || [];
      const nextSubPartChar = String.fromCharCode(97 + parts.length);
      return {
        ...prev,
        parts: [...parts, {
          id: `new-${Date.now()}`,
          sub_part: nextSubPartChar,
          text: '',
          type: 'short',
          marks: 1,
          rubric: '',
          teacher_instructions: ''
        }]
      };
    });
  };

  const removePart = (partId) => {
    setFormData(prev => {
      const newParts = prev.parts.filter(p => p.id !== partId).map((p, idx) => ({
        ...p,
        sub_part: String.fromCharCode(97 + idx)
      }));
      return { ...prev, parts: newParts };
    });
  };

  const updatePart = (partId, field, value) => {
    setFormData(prev => ({
      ...prev,
      parts: prev.parts.map(p => p.id === partId ? { ...p, [field]: value } : p)
    }));
  };

  const handleGenerateRubric = async (partId = null) => {
    let targetText = formData.text;
    if (partId) {
      const p = formData.parts.find(x => x.id === partId);
      targetText = `${formData.text}\n\nPart ${p.sub_part}: ${p.text}`;
    }

    if (!targetText || !targetText.trim()) {
      toast.error('Please enter question text before generating a rubric.');
      return;
    }

    setGeneratingRubricId(partId || 'parent');
    try {
      const res = await fetch('/api/questions/generate-rubrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: targetText,
          maxMarks: partId ? formData.parts.find(x => x.id === partId).marks : formData.marks
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate rubric');

      let finalRubric = data.rubric;
      try {
        const parsed = JSON.parse(finalRubric);
        const formatted = [];
        if (parsed.criteria && parsed.criteria.length > 0) {
          formatted.push('Grading Criteria:');
          parsed.criteria.forEach(c => {
            formatted.push(`- ${c.point} (${c.marks} marks)`);
          });
        }
        if (parsed.correct_answer) {
          formatted.push(`\nCorrect Answer: ${parsed.correct_answer}`);
        }
        if (parsed.keywords && parsed.keywords.length > 0) {
          formatted.push(`\nKeywords: ${parsed.keywords.join(', ')}`);
        }
        if (parsed.partial_credit !== undefined) {
          formatted.push(`\nPartial Credit Allowed: ${parsed.partial_credit ? 'Yes' : 'No'}`);
        }
        finalRubric = formatted.join('\n').trim();
      } catch (e) {
        console.error('Failed to parse AI rubric JSON:', e);
      }

      if (partId) {
        updatePart(partId, 'rubric', finalRubric);
      } else {
        setFormData(prev => ({ ...prev, rubric: finalRubric }));
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGeneratingRubricId(null);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSave(formData, mode, group);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const hasParts = formData.parts && formData.parts.length > 0;
  const totalPartsMarks = formData.parts.reduce((s, p) => s + (Number(p.marks) || 0), 0);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <h2 className={styles.modalTitle}>{mode === 'add' ? 'Add Question' : 'Edit Question'}</h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} title="Close">&times;</button>
        </div>

        <div className={styles.modalBody}>
          {/* Top Control Bar */}
          <div className={styles.metaRow}>
            <div className={styles.metaLeft}>
              <div className={styles.inputGroup}>
                <span className={styles.inputLabel}>Q.</span>
                <input 
                  type="number" 
                  min="1"
                  className={styles.numInput}
                  value={formData.question_number || ''} 
                  onChange={e => setFormData({...formData, question_number: e.target.value})} 
                  placeholder="No." 
                />
              </div>

              {!hasParts ? (
                <>
                  <select 
                    className={styles.select}
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="short">Short Answer</option>
                    <option value="long">Long Answer</option>
                    <option value="blank">Fill in Blank</option>
                  </select>
                  <div className={styles.inputGroup}>
                    <span className={styles.inputLabel}>Marks:</span>
                    <input 
                      type="number" 
                      min="1"
                      className={styles.numInput}
                      value={formData.marks} 
                      onChange={e => setFormData({...formData, marks: e.target.value})} 
                      placeholder="Marks" 
                    />
                  </div>
                </>
              ) : (
                <span className={styles.autoMarksBadge}>
                  Total: {totalPartsMarks} marks (calculated from parts)
                </span>
              )}
            </div>

            <button 
              type="button" 
              onClick={addPart}
              className={styles.addPartBtn}
            >
              <PlusIcon /> Add Sub-Part
            </button>
          </div>

          {/* Question Text / Context */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {hasParts ? 'Main Question / Group Context' : 'Question Text'}
            </label>
            <textarea
              className={styles.textarea}
              placeholder={hasParts ? 'e.g. Attempt all parts from the following section...' : 'Type your question here...'}
              value={formData.text}
              onChange={e => setFormData({...formData, text: e.target.value})}
              rows={hasParts ? 2 : 3}
            />
          </div>

          {/* Rubric for Main Question (Only if no parts) */}
          {!hasParts && (
            <RubricEditor
              rubric={formData.rubric}
              onChangeRubric={(val) => setFormData(prev => ({ ...prev, rubric: val }))}
              instructions={formData.teacher_instructions}
              onChangeInstructions={(val) => setFormData(prev => ({ ...prev, teacher_instructions: val }))}
              onGenerateRubric={() => handleGenerateRubric(null)}
              isGenerating={generatingRubricId === 'parent'}
              showLabel={true}
              instructionLabel="Grading Instructions (Optional)"
            />
          )}

          {/* Sub-parts List */}
          {hasParts && (
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Sub-Parts ({formData.parts.length})</label>
              <SubPartsEditor
                parts={formData.parts}
                removePart={removePart}
                updatePart={updatePart}
                handleGenerateRubric={handleGenerateRubric}
                generatingRubricId={generatingRubricId}
              />
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <Button onClick={onClose} variant="ghost" disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSubmit} variant="primary" loading={isSaving}>Save Question</Button>
        </div>
      </div>
    </div>
  );
}

export default QuestionForm;
