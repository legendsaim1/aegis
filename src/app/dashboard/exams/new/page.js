'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './newExam.module.css';
import ConfirmModal from '@/components/ui/ConfirmModal';
import AutoResizeTextarea from '@/components/ui/AutoResizeTextarea';
import { useToast } from '@/hooks/useToast';

// SVG Icons
const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"></rect>
    <circle cx="12" cy="5" r="2"></circle>
    <path d="M12 7v4"></path>
    <line x1="8" y1="16" x2="8" y2="16"></line>
    <line x1="16" y1="16" x2="16" y2="16"></line>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const extractQuestionId = (idStr, index) => {
  const str = String(idStr).trim();
  const match = str.match(/\d+/);
  let qNum = index + 1;
  let subPart = null;
  
  if (match) {
    qNum = parseInt(match[0], 10);
    let afterText = str.slice(match.index + match[0].length).trim();
    afterText = afterText.replace(/^[.)\-\s]+/, '').trim();
    afterText = afterText.replace(/^\((.+)\)$/, '$1');
    if (afterText.length > 0) {
      subPart = afterText;
    }
  }
  return { qNum, subPart };
};

export default function NewExamPage() {
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Upload State
  const fileInputRef = useRef(null);
  const [paperFile, setPaperFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [generatingRubricId, setGeneratingRubricId] = useState(null);
  const [confirmModalState, setConfirmModalState] = useState({ isOpen: false, id: null, partId: null, isQuestion: true });
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingNavigationUrl, setPendingNavigationUrl] = useState('/dashboard/exams');

  // Step 1 State
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    class_grade: '',
    instructions: '',
    passing_percentage: 50,
  });

  // Step 2 State
  const [mode, setMode] = useState('manual'); // 'manual' or 'upload'
  const [questions, setQuestions] = useState([
    { id: 1, text: '', type: 'short', marks: 5, rubric: '', teacher_instructions: '', parts: [] }
  ]);

  // Warn before browser unload or intercept navigation clicks (sidebar, header, etc.) if user has created questions
  useEffect(() => {
    const hasUnsavedWork = questions.some(q => q.text.trim() !== '' || (q.parts && q.parts.length > 0));
    if (!hasUnsavedWork || isSubmitting) return;

    // 1. Browser tab close / refresh
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 2. Intercept any in-app link click (Sidebar links, Topbar links, logo, etc.)
    const handleCaptureClick = (e) => {
      const anchor = e.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || anchor.target === '_blank') return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      // Prevent immediate client-side navigation
      e.preventDefault();
      e.stopPropagation();

      setPendingNavigationUrl(href);
      setShowLeaveModal(true);
    };

    window.addEventListener('click', handleCaptureClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('click', handleCaptureClick, true);
    };
  }, [questions, isSubmitting]);

  const handleRequestLeave = (e) => {
    if (e) e.preventDefault();
    const hasUnsavedWork = questions.some(q => q.text.trim() !== '' || (q.parts && q.parts.length > 0));
    if (hasUnsavedWork && !isSubmitting) {
      setPendingNavigationUrl('/dashboard/exams');
      setShowLeaveModal(true);
    } else {
      router.push('/dashboard/exams');
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const calculatedTotalMarks = questions.reduce((sum, q) => {
    if (q.parts && q.parts.length > 0) {
      return sum + q.parts.reduce((partSum, p) => partSum + (Number(p.marks) || 0), 0);
    }
    return sum + (Number(q.marks) || 0);
  }, 0);

  const addQuestion = () => {
    setQuestions(prev => {
      const maxId = prev.reduce((max, q) => {
        const { qNum } = extractQuestionId(q.id, 0);
        return (!isNaN(qNum) && qNum > max) ? qNum : max;
      }, 0);
      return [
        ...prev,
        { id: maxId + 1, text: '', type: 'short', marks: 5, rubric: '', teacher_instructions: '', parts: [] }
      ];
    });
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const requestRemoveQuestion = (id) => {
    if (questions.length === 1) return; // Prevent deleting the last question
    setConfirmModalState({ isOpen: true, id, partId: null, isQuestion: true });
  };

  const executeRemoveQuestion = () => {
    const id = confirmModalState.id;
    setConfirmModalState({ isOpen: false, id: null, partId: null, isQuestion: true });
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const addPart = (qId) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        const parts = q.parts || [];
        const nextSubPartChar = String.fromCharCode(97 + parts.length); // a, b, c
        return {
          ...q,
          parts: [...parts, { id: `${q.id}-${nextSubPartChar}`, sub_part: nextSubPartChar, text: '', type: 'short', marks: 5, rubric: '', teacher_instructions: '' }]
        };
      }
      return q;
    }));
  };

  const updatePart = (qId, partId, field, value) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          parts: q.parts.map(p => p.id === partId ? { ...p, [field]: value } : p)
        };
      }
      return q;
    }));
  };

  const requestRemovePart = (qId, partId) => {
    setConfirmModalState({ isOpen: true, id: qId, partId, isQuestion: false });
  };

  const executeRemovePart = () => {
    const { id: qId, partId } = confirmModalState;
    setConfirmModalState({ isOpen: false, id: null, partId: null, isQuestion: true });
    setQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        const newParts = q.parts.filter(p => p.id !== partId).map((p, idx) => ({
          ...p,
          sub_part: String.fromCharCode(97 + idx) // Reassign a, b, c
        }));
        return { ...q, parts: newParts };
      }
      return q;
    }));
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (step < 3) setStep(step + 1);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setPaperFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPaperFile(e.target.files[0]);
    }
  };

  const handleGenerateRubric = async (qId, partId = null) => {
    const q = questions.find(question => question.id === qId);
    let target = q;
    let fullTextContext = q.text; // For subparts, provide the parent context as well
    if (partId) {
      target = q.parts.find(p => p.id === partId);
      if (q.text && target.text) {
        fullTextContext = `${q.text}\n\nPart ${target.sub_part}: ${target.text}`;
      } else {
        fullTextContext = target.text;
      }
    }

    if (!target.text) {
      toast.error('Please enter the question text first before generating a rubric.');
      return;
    }

    setGeneratingRubricId(partId || qId);

    try {
      const res = await fetch('/api/questions/generate-rubrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: fullTextContext,
          questionType: target.type,
          maxMarks: target.marks,
          subject: formData.subject || 'General'
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate rubric');

      let finalRubric = json.rubric;
      try {
        const parsed = JSON.parse(json.rubric);
        let formatted = [];

        if (parsed.criteria && parsed.criteria.length > 0) {
          formatted.push("Grading Criteria:");
          parsed.criteria.forEach(c => {
            formatted.push(`- ${c.point} (${c.marks} marks)`);
          });
        }

        if (parsed.correct_answer) {
          formatted.push(`\nCorrect Answer: ${parsed.correct_answer}`);
        }

        if (parsed.keywords && parsed.keywords.length > 0) {
          formatted.push(`\nKeywords: ${parsed.keywords.join(", ")}`);
        }

        if (parsed.partial_credit !== undefined) {
          formatted.push(`\nPartial Credit Allowed: ${parsed.partial_credit ? 'Yes' : 'No'}`);
        }

        finalRubric = formatted.join('\n').trim();
      } catch (e) {
        // Fallback to whatever string the API returned
        console.error("Failed to parse AI rubric JSON:", e);
      }

      if (partId) {
        updatePart(qId, partId, 'rubric', finalRubric);
      } else {
        updateQuestion(qId, 'rubric', finalRubric);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGeneratingRubricId(null);
    }
  };

  const handleExtractQuestions = async () => {
    if (!paperFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsExtracting(true);

    try {
      const formData = new FormData();
      formData.append('file', paperFile);

      const res = await fetch('/api/questions/extract', {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Extraction failed');

      const extracted = json.data;
      if (!Array.isArray(extracted) || extracted.length === 0) {
        throw new Error("No questions found in the document.");
      }

      const grouped = extracted.map((eq, i) => {
        const parentQ = {
          id: eq.question_number,
          text: eq.question_text || '',
          type: eq.suggested_type || 'short',
          marks: eq.suggested_marks || 5,
          rubric: '',
          teacher_instructions: '',
          parts: []
        };

        if (eq.sub_parts && Array.isArray(eq.sub_parts) && eq.sub_parts.length > 0) {
          parentQ.parts = eq.sub_parts.map(sp => ({
            id: `${eq.question_number}-${sp.sub_part}`,
            sub_part: sp.sub_part,
            text: sp.question_text || '',
            type: sp.suggested_type || 'short',
            marks: sp.suggested_marks || 5,
            rubric: '',
            teacher_instructions: ''
          }));
        }

        return parentQ;
      });

      grouped.sort((a, b) => {
        const numA = parseInt(a.id, 10);
        const numB = parseInt(b.id, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return String(a.id).localeCompare(String(b.id));
      });

      const cleaned = grouped.filter(q => q.text.trim() !== '' || q.parts.length > 0);
      setQuestions(cleaned);
      setMode('manual');
      toast.success('Questions successfully extracted!');

    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleProceedToReview = () => {
    const hasValidQuestion = questions.some(q => {
      if (q.parts && q.parts.length > 0) {
        return q.parts.some(p => p.text.trim() !== '');
      }
      return q.text.trim() !== '';
    });

    if (!hasValidQuestion) {
      toast.error('Please add at least one question with text before reviewing.');
      return;
    }
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.title.trim()) {
      toast.error('Exam title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create Exam
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          total_marks: calculatedTotalMarks
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create exam');
      }

      const newExam = await res.json();

      if (mode === 'manual' && questions.length > 0) {
        const submitQuestion = async (payload) => {
          const res = await fetch('/api/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Q${payload.question_number}${payload.sub_part ? ` (${payload.sub_part})` : ''} failed to save`);
          }
          return res.json();
        };

        const payloads = [];
        questions.forEach((q, i) => {
          const hasParts = q.parts && q.parts.length > 0;
          const extracted = extractQuestionId(q.id, i);
          const qNum = typeof q.id === 'number' ? q.id : extracted.qNum;
          const implicitSubPart = typeof q.id === 'number' ? null : extracted.subPart;

          if (!q.text && !q.rubric && !hasParts) return;

          if (hasParts) {
            payloads.push({
              examId: newExam.id,
              question_number: qNum,
              question_text: q.text || 'Question Context',
              question_type: q.parts[0].type,
              max_marks: 0,
              rubric_json: 'CONTEXT_ONLY_DO_NOT_GRADE',
              sub_part: null,
              teacher_instructions: q.teacher_instructions || null,
            });
            q.parts.forEach((part) => {
              payloads.push({
                examId: newExam.id,
                question_number: qNum,
                question_text: part.text || `Part ${part.sub_part}`,
                question_type: part.type,
                max_marks: Number(part.marks) || 1,
                rubric_json: part.rubric || null,
                sub_part: part.sub_part,
                teacher_instructions: part.teacher_instructions || null,
              });
            });
          } else {
            payloads.push({
              examId: newExam.id,
              question_number: qNum,
              question_text: q.text || 'Untitled Question',
              question_type: q.type,
              max_marks: Number(q.marks) || 1,
              rubric_json: q.rubric || null,
              sub_part: implicitSubPart,
              teacher_instructions: q.teacher_instructions || null,
            });
          }
        });

        const results = await Promise.allSettled(payloads.map(submitQuestion));
        const failed = results.filter((r) => r.status === 'rejected');

        if (failed.length > 0) {
          toast.warning(`Exam created, but ${failed.length} of ${payloads.length} question(s) failed to save. Open the exam and add them manually.`);
          setIsSubmitting(false);
          router.push(`/dashboard/exams/${newExam.id}`);
          router.refresh();
          return;
        }
      }

      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Exam Created',
          message: `Your exam "${formData.title}" has been created successfully.`,
          type: 'success',
          link_url: `/dashboard/exams/${newExam.id}`
        })
      }).catch(console.error);
      window.dispatchEvent(new Event('refreshNotifications'));

      toast.success(`Exam "${formData.title}" created successfully!`);
      router.push(`/dashboard/exams/${newExam.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button type="button" onClick={handleRequestLeave} className={styles.backBtn}>
          <ChevronLeftIcon /> Back to Exams
        </button>
        <h1 className={styles.title}>Create New Exam</h1>
      </header>

      {/* Step Indicator */}
      <div className={styles.stepIndicator}>
        <div className={`${styles.stepItem} ${step >= 1 ? styles.stepActive : ''}`}>
          <div className={styles.stepCircle}>{step > 1 ? <CheckIcon /> : '1'}</div>
          <span className={styles.stepLabel}>Exam Info</span>
        </div>
        <div className={styles.stepLine} />
        <div className={`${styles.stepItem} ${step >= 2 ? styles.stepActive : ''}`}>
          <div className={styles.stepCircle}>{step > 2 ? <CheckIcon /> : '2'}</div>
          <span className={styles.stepLabel}>Questions</span>
        </div>
        <div className={styles.stepLine} />
        <div className={`${styles.stepItem} ${step >= 3 ? styles.stepActive : ''}`}>
          <div className={styles.stepCircle}>{step > 3 ? <CheckIcon /> : '3'}</div>
          <span className={styles.stepLabel}>Review</span>
        </div>
      </div>

      <main className={styles.main}>
        {/* ================= STEP 1 ================= */}
        {step === 1 && (
          <form className={styles.formCard} onSubmit={handleNextStep}>
            <div className={styles.formHeader}>
              <h2>Exam Details</h2>
              <p>Set up the basic information for your new exam.</p>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="subject" className={styles.label}>Subject</label>
              <input type="text" id="subject" name="subject" className={styles.input} placeholder="e.g. Math" value={formData.subject} onChange={handleChange} autoComplete="off" required />
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label htmlFor="title" className={styles.label}>Exam Title</label>
                <input type="text" id="title" name="title" className={styles.input} placeholder="e.g. Midterm Mathematics" value={formData.title} onChange={handleChange} autoComplete="off" required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="class_grade" className={styles.label}>Class / Grade</label>
                <input type="text" id="class_grade" name="class_grade" className={styles.input} placeholder="e.g. Grade 10-A" value={formData.class_grade} onChange={handleChange} autoComplete="off" required />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="passing_percentage" className={styles.label}>Passing Percentage (%)</label>
              <p className={styles.helpText}>Used to determine Pass/Fail status in analytics.</p>
              <input type="number" min="1" max="100" id="passing_percentage" name="passing_percentage" className={styles.input} placeholder="e.g. 50" value={formData.passing_percentage} onChange={handleChange} required />
            </div>


            <div className={styles.formGroup}>
              <label htmlFor="instructions" className={styles.label}>Instructions &amp; Rubric Context (Optional)</label>
              <p className={styles.helpText}>Provide any grading instructions or specific criteria you want the AI to consider.</p>
              <AutoResizeTextarea id="instructions" name="instructions" className={styles.textarea} placeholder="e.g. Deduct 1 mark for missing units. Be strict on spelling." rows="3" value={formData.instructions} onChange={handleChange} />
            </div>

            <div className={styles.formFooter}>
              <button type="button" className={styles.secondaryBtn} onClick={handleRequestLeave}>Cancel</button>
              <button type="submit" className={styles.primaryBtn}>Next Step</button>
            </div>
          </form>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 2 && (
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2>Add Questions</h2>
              <p>Define the questions and rubrics for AI grading.</p>
            </div>

            <div className={styles.totalMarksBar}>
              <span>Total marks so far</span>
              <strong>{calculatedTotalMarks}</strong>
            </div>

            {/* Mode Toggle */}
            <div className={styles.modeToggle}>
              <button
                className={`${styles.modeBtn} ${mode === 'manual' ? styles.modeBtnActive : ''}`}
                onClick={() => setMode('manual')}
              >
                <EditIcon /> Type Manually
              </button>
              <button
                className={`${styles.modeBtn} ${mode === 'upload' ? styles.modeBtnActive : ''}`}
                onClick={() => setMode('upload')}
              >
                <FileIcon /> Upload Paper
              </button>
            </div>

            {mode === 'manual' && (
              <div className={styles.questionsList}>
                {questions.map((q, index) => (
                  <div key={`q-${index}`} className={styles.questionCard}>
                    <div className={styles.questionCardHeader}>
                      <div className={styles.questionCardHeaderLeft}>
                        <input
                          type="text"
                          className={styles.qNumberInput}
                          value={q.id}
                          onChange={(e) => updateQuestion(q.id, 'id', e.target.value)}
                          placeholder="No."
                        />
                        <span className={styles.qHeaderLabel}>Question</span>
                      </div>
                      <div className={styles.qToolbar}>
                        <button type="button" className={styles.toolbarBtn} onClick={() => addPart(q.id)}>
                          <PlusIcon /> Part
                        </button>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            className={`${styles.toolbarBtn} ${styles.toolbarBtnIcon} ${styles.toolbarBtnDanger}`}
                            onClick={() => requestRemoveQuestion(q.id)}
                            aria-label="Remove question"
                            title="Remove Question"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={styles.questionCardBody}>
                      <AutoResizeTextarea
                        className={styles.questionTextarea}
                        placeholder={q.parts && q.parts.length > 0 ? "Type main question context here..." : "Type your question here..."}
                        value={q.text}
                        onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                        rows="2"
                      />

                      {(!q.parts || q.parts.length === 0) && (
                        <div className={styles.metaRow}>
                          <div className={styles.metaField}>
                            <span className={styles.metaLabel}>Type</span>
                            <select className={styles.select} value={q.type} onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}>
                              <option value="mcq">Multiple Choice</option>
                              <option value="short">Short Answer</option>
                              <option value="long">Long Answer</option>
                              <option value="blank">Fill in Blank</option>
                            </select>
                          </div>
                          <div className={styles.metaField}>
                            <span className={styles.metaLabel}>Marks</span>
                            <input type="number" min="1" className={styles.marksInput} value={q.marks} onChange={(e) => updateQuestion(q.id, 'marks', e.target.value)} />
                          </div>
                        </div>
                      )}

                      {q.parts && q.parts.length > 0 && (
                        <div className={styles.metaRow}>
                          <span className={styles.marksDisplay}>
                            {q.parts.reduce((s, p) => s + (Number(p.marks) || 0), 0)} marks total — from parts below
                          </span>
                        </div>
                      )}

                      {(!q.parts || q.parts.length === 0) && (
                        <div className={styles.gradingPanel}>
                          <div className={styles.gradingPanelHeader}>
                            <span className={styles.gradingPanelTitle}>Grading Rubric</span>
                            <button
                              type="button"
                              className={styles.aiBtn}
                              onClick={() => handleGenerateRubric(q.id)}
                              disabled={generatingRubricId === q.id}
                            >
                              {generatingRubricId === q.id ? <span className={styles.spinnerAccent} /> : <BotIcon />}
                              {generatingRubricId === q.id ? 'Generating...' : 'Generate with AI'}
                            </button>
                          </div>
                          <AutoResizeTextarea
                            className={styles.textarea}
                            placeholder="Define how this question should be graded..."
                            value={q.rubric}
                            onChange={(e) => updateQuestion(q.id, 'rubric', e.target.value)}
                            rows="2"
                          />
                          <div className={styles.instructionsField}>
                            <span className={styles.instructionsLabel}>Grading Instructions (optional)</span>
                            <AutoResizeTextarea
                              className={styles.textarea}
                              placeholder="e.g. Accept any valid formula. Deduct 0.5 marks for unit errors."
                              value={q.teacher_instructions}
                              onChange={(e) => updateQuestion(q.id, 'teacher_instructions', e.target.value)}
                              rows="2"
                            />
                          </div>
                        </div>
                      )}

                      {q.parts && q.parts.length > 0 && (
                        <div className={styles.partsList}>
                          {q.parts.map((p) => (
                            <div key={p.id} className={styles.partCard}>
                              <div className={styles.partCardHeader}>
                                <span className={styles.partBadge}>Part {p.sub_part}</span>
                                <div className={styles.qToolbar}>
                                  <select className={styles.selectSmall} value={p.type} onChange={(e) => updatePart(q.id, p.id, 'type', e.target.value)}>
                                    <option value="mcq">Multiple Choice</option>
                                    <option value="short">Short Answer</option>
                                    <option value="long">Long Answer</option>
                                    <option value="blank">Fill in Blank</option>
                                  </select>
                                  <input type="number" min="1" className={styles.marksInputSmall} value={p.marks} onChange={(e) => updatePart(q.id, p.id, 'marks', e.target.value)} />
                                  <button
                                    type="button"
                                    className={`${styles.toolbarBtn} ${styles.toolbarBtnIcon} ${styles.toolbarBtnDanger}`}
                                    onClick={() => requestRemovePart(q.id, p.id)}
                                    aria-label="Remove part"
                                    title="Remove Part"
                                  >
                                    <TrashIcon />
                                  </button>
                                </div>
                              </div>
                              <div className={styles.partCardBody}>
                                <AutoResizeTextarea
                                  className={styles.questionTextarea}
                                  placeholder="Type part question here..."
                                  value={p.text}
                                  onChange={(e) => updatePart(q.id, p.id, 'text', e.target.value)}
                                  rows="2"
                                />
                                <div className={styles.gradingPanel}>
                                  <div className={styles.gradingPanelHeader}>
                                    <span className={styles.gradingPanelTitle}>Grading Rubric</span>
                                    <button
                                      type="button"
                                      className={styles.aiBtn}
                                      onClick={() => handleGenerateRubric(q.id, p.id)}
                                      disabled={generatingRubricId === p.id}
                                    >
                                      {generatingRubricId === p.id ? <span className={styles.spinnerAccent} /> : <BotIcon />}
                                      {generatingRubricId === p.id ? 'Generating...' : 'Generate with AI'}
                                    </button>
                                  </div>
                                  <AutoResizeTextarea
                                    className={styles.textarea}
                                    placeholder="Rubric / Expected Answer..."
                                    value={p.rubric}
                                    onChange={(e) => updatePart(q.id, p.id, 'rubric', e.target.value)}
                                    rows="2"
                                  />
                                  <div className={styles.instructionsField}>
                                    <span className={styles.instructionsLabel}>Grading Instructions (optional)</span>
                                    <AutoResizeTextarea
                                      className={styles.textarea}
                                      placeholder="e.g. Accept any valid formula. Deduct 0.5 marks for unit errors."
                                      value={p.teacher_instructions}
                                      onChange={(e) => updatePart(q.id, p.id, 'teacher_instructions', e.target.value)}
                                      rows="2"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <button type="button" className={styles.addQuestionBtn} onClick={addQuestion}>
                  <PlusIcon /> Add Question
                </button>
              </div>
            )}

            {mode === 'upload' && (
              <div
                className={`${styles.uploadZone} ${dragActive ? styles.dragActive : ''}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf,image/*"
                  style={{ display: 'none' }}
                />
                <FileIcon />
                <h3>Drag &amp; drop question paper</h3>
                <p>PDF or Image files supported</p>
                {paperFile && (
                  <p style={{ color: 'var(--accent)', margin: 'var(--space-2) 0', fontWeight: 'bold' }}>
                    Selected: {paperFile.name}
                  </p>
                )}
                <button type="button" className={styles.secondaryBtn} onClick={() => fileInputRef.current?.click()}>
                  Browse Files
                </button>
              </div>
            )}

            <div className={styles.formFooter}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setStep(1)}>Back</button>
              {mode === 'manual' ? (
                <button type="button" className={styles.primaryBtn} onClick={handleProceedToReview}>Review &amp; Create</button>
              ) : (
                <button type="button" className={styles.primaryBtn} onClick={handleExtractQuestions} disabled={isExtracting || !paperFile}>
                  {isExtracting && <span className={styles.spinner} style={{ marginRight: '6px' }} />}
                  {isExtracting ? 'Extracting...' : 'Extract Questions with AI'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 3 ================= */}
        {step === 3 && (
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2>Review &amp; Create</h2>
              <p>Review your exam setup before finalizing.</p>
            </div>

            <div className={styles.summarySection}>
              <h3>{formData.title || 'Untitled Exam'}</h3>
              <p className={styles.summaryMeta}>
                <span>{formData.subject}</span> • <span>{formData.class_grade}</span> • <span>{calculatedTotalMarks} Marks</span>
              </p>
              {formData.instructions && (
                <div className={styles.summaryInstructions}>
                  <strong>Instructions:</strong> {formData.instructions}
                </div>
              )}
            </div>

            <div className={styles.summaryQuestions}>
              <h4>Questions ({questions.length})</h4>
              <ul className={styles.summaryQList}>
                {questions.map((q, i) => (
                  <li key={q.id}>
                    <strong>Q{q.id}:</strong> <span style={{ whiteSpace: 'pre-wrap' }}>{q.text || <span style={{ color: 'var(--text-tertiary)' }}>Empty question</span>}</span>
                    {(!q.parts || q.parts.length === 0) && <span className={styles.qMarks}>({q.marks} marks)</span>}
                    {q.parts && q.parts.length > 0 && (
                      <ul style={{ paddingLeft: 'var(--space-4)', marginTop: 'var(--space-2)', listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {q.parts.map(p => (
                          <li key={p.id} style={{ fontSize: '0.9em', color: 'var(--text-secondary)', padding: 'var(--space-2)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                            <strong>Part {p.sub_part}:</strong> <span style={{ whiteSpace: 'pre-wrap' }}>{p.text || 'Empty part'}</span> <span className={styles.qMarks}>({p.marks} marks)</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.formFooter}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setStep(2)}>Back</button>
              <button type="button" className={styles.primaryBtn} onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Creating Exam...' : 'Create Exam'}
              </button>
            </div>
          </div>
        )}
      </main>

      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.isQuestion ? "Remove Question" : "Remove Part"}
        message={confirmModalState.isQuestion ? "Remove this question? This cannot be undone." : "Remove this part? This cannot be undone."}
        confirmText="Remove"
        isDanger={true}
        onConfirm={confirmModalState.isQuestion ? executeRemoveQuestion : executeRemovePart}
        onCancel={() => setConfirmModalState({ isOpen: false, id: null, partId: null, isQuestion: true })}
      />

      <ConfirmModal
        isOpen={showLeaveModal}
        title="Discard Unsaved Exam?"
        message="You have added or extracted questions that haven't been saved yet. Leaving now will discard all your questions."
        confirmText="Discard and Leave"
        cancelText="Keep Editing"
        isDanger={true}
        onConfirm={() => {
          setShowLeaveModal(false);
          router.push(pendingNavigationUrl || '/dashboard/exams');
        }}
        onCancel={() => setShowLeaveModal(false)}
      />
    </div>
  );
}