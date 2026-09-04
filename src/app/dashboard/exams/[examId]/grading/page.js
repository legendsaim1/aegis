export const dynamic = 'force-dynamic';

import Link from 'next/link';
import styles from './grading.module.css';
import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { getSignedAnswerSheetUrl } from '@/lib/utils/storage';



const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

export default async function GradingPage({ params, searchParams }) {
  const resolvedParams = await params;
  const { examId } = resolvedParams;
  const resolvedSearchParams = await searchParams;
  const selectedStudentId = resolvedSearchParams?.student;

  const user = await getAuthenticatedUser();

  if (!user) {
    return <div>Unauthorized. Please log in.</div>;
  }

  const supabase = supabaseServer();

  // 1. Verify exam ownership (defense-in-depth)
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('id')
    .eq('id', examId)
    .eq('teacher_id', user.id)
    .single();

  if (examError || !exam) {
    return <div>Exam not found or access denied.</div>;
  }

  // 2. Fetch Graded Students directly
  const { data: studentsData } = await supabase
    .from('students')
    .select('*')
    .eq('exam_id', examId)
    .eq('status', 'graded')
    .order('roll_number', { ascending: true });

  const students = studentsData || [];

  // 2. Determine Active Student
  const activeStudentId = selectedStudentId || (students.length > 0 ? students[0].id : null);
  const currentStudent = students.find(s => s.id === activeStudentId);
  const signedAnswerSheetUrl = currentStudent?.answer_sheet_url
    ? await getSignedAnswerSheetUrl(supabase, currentStudent.answer_sheet_url)
    : null;

  // 3. Fetch Answers + Questions for Active Student
  let answers = [];
  if (activeStudentId) {
    const { data: answersData } = await supabase
      .from('answers')
      .select(`
        *,
        questions (
          question_number,
          sub_part,
          max_marks
        )
      `)
      .eq('student_id', activeStudentId);

    if (answersData) {
      // Sort sequentially by question number
      answersData.sort((a, b) => {
        const numA = a.questions?.question_number || 0;
        const numB = b.questions?.question_number || 0;
        return numA - numB;
      });
      answers = answersData;
    }
  }

  return (
    <div className={styles.container}>

      {/* Sidebar List */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3 className={styles.sidebarTitle}>Students ({students.length})</h3>
        </div>

        <div className={styles.studentList}>
          {students.map(student => (
            <Link
              key={student.id}
              href={`/dashboard/exams/${examId}/grading?student=${student.id}`}
              className={`${styles.studentItem} ${activeStudentId === student.id ? styles.activeItem : ''}`}
              aria-current={activeStudentId === student.id ? 'page' : undefined}
              style={{ textDecoration: 'none' }}
            >
              <div className={styles.studentInfo}>
                <span className={styles.studentName}>{student.student_name}</span>
                {student.overall_grade_confidence < 0.6 && <span className={styles.flagIcon} title="Low Confidence"><AlertIcon /></span>}
              </div>
              <span className={styles.studentScore}>{student.total_obtained_marks} pts</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Panel */}
      <div className={styles.mainPanel}>
        {currentStudent ? (
          <>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>{currentStudent.student_name} ({currentStudent.roll_number})</h2>
                <p className={styles.panelSubtitle}>AI Graded with {Math.round(currentStudent.overall_grade_confidence * 100)}% Confidence</p>
              </div>
              <div className={styles.totalScoreBox}>
                <span className={styles.totalScoreLabel}>Total Score</span>
                <span className={styles.totalScoreValue}>
                  {currentStudent.total_obtained_marks}
                </span>
              </div>
            </div>

            <div className={styles.scannedImageArea}>
              <div className={styles.imagePlaceholder}>
                <a href={signedAnswerSheetUrl || currentStudent.answer_sheet_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                  Click to View Original PDF Answer Sheet
                </a>
              </div>
            </div>

            <div className={styles.gradingBreakdown}>
              <h3 className={styles.breakdownTitle}>Grading Breakdown</h3>
              <table className={styles.breakdownTable}>
                <thead>
                  <tr>
                    <th className={styles.th}>Q. No</th>
                    <th className={styles.th}>Extracted Text</th>
                    <th className={styles.th}>AI Feedback</th>
                    <th className={styles.th} style={{ textAlign: 'right' }}>Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {answers.map(ans => {
                    const qNum = ans.questions ? `${ans.questions.question_number}${ans.questions.sub_part ? `(${ans.questions.sub_part})` : ''}` : 'Q?';
                    const max = ans.questions ? ans.questions.max_marks : '-';

                    return (
                      <tr key={ans.id} className={styles.tr}>
                        <td className={styles.td}>{qNum}</td>
                        <td className={styles.td} style={{ maxWidth: '250px' }}>
                          <p className={styles.extractedText}>{ans.extracted_text}</p>
                          {ans.ocr_confidence_score < 0.7 && (
                            <span className={styles.flagBadge} style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', marginTop: 'var(--space-1)' }}>Low OCR Confidence ({Math.round(ans.ocr_confidence_score * 100)}%)</span>
                          )}
                        </td>
                        <td className={styles.td}>
                          <p className={styles.feedbackText}>{ans.ai_feedback}</p>
                          {ans.needs_review && (
                            <span className={styles.flagBadge} style={{ marginTop: 'var(--space-1)' }}>Flagged: {ans.flag_reason}</span>
                          )}
                        </td>
                        <td className={styles.td} style={{ textAlign: 'right' }}>
                          <input type="number" defaultValue={ans.obtained_marks} className={styles.markInput} /> / {max}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            Select a graded student to view results.
          </div>
        )}
      </div>
    </div>
  );
}