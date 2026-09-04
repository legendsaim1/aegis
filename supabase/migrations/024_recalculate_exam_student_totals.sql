-- Migration 024: Recalculate all student totals for an exam on question mutations
-- Automatically updates total_obtained_marks for all students when questions are dropped or modified

CREATE OR REPLACE FUNCTION recalculate_exam_student_totals(p_exam_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE students s
    SET total_obtained_marks = (
        SELECT COALESCE(SUM(a.obtained_marks), 0)
        FROM answers a
        WHERE a.student_id = s.id
    )
    WHERE s.exam_id = p_exam_id
      AND s.status IN ('graded', 'review', 'manually_graded');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
