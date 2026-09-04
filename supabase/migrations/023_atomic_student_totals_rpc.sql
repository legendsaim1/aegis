-- Migration 023: Atomic Student Total Recalculation RPC
-- Eliminates read-then-write race conditions when updating student scores across concurrent sessions

CREATE OR REPLACE FUNCTION recalculate_student_total(p_student_id UUID)
RETURNS numeric AS $$
DECLARE
    computed_total numeric;
BEGIN
    -- 1. Atomically calculate the sum of all obtained marks for this student directly in SQL
    SELECT COALESCE(SUM(obtained_marks), 0)
    INTO computed_total
    FROM answers
    WHERE student_id = p_student_id;

    -- 2. Atomically update the student record in the same transaction
    UPDATE students
    SET total_obtained_marks = computed_total,
        status = 'manually_graded',
        overall_grade_confidence = NULL
    WHERE id = p_student_id;

    RETURN computed_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
