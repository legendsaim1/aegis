-- Migration: 021_sync_exam_total_marks.sql
-- Description: Automatically maintains exams.total_marks from the sum of gradable questions

CREATE OR REPLACE FUNCTION sync_exam_total_marks()
RETURNS TRIGGER AS $$
DECLARE
    target_exam_id UUID;
    computed_total INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_exam_id := OLD.exam_id;
    ELSE
        target_exam_id := NEW.exam_id;
    END IF;

    IF target_exam_id IS NOT NULL THEN
        -- Compute sum of gradable questions (leaf questions or non-subpart questions)
        SELECT COALESCE(SUM(q.max_marks), 0)
        INTO computed_total
        FROM questions q
        WHERE q.exam_id = target_exam_id
          AND (
            -- Either has a sub_part
            (q.sub_part IS NOT NULL AND q.sub_part <> '')
            OR
            -- Or has no subparts defined for the same question_number
            NOT EXISTS (
                SELECT 1 FROM questions sub
                WHERE sub.exam_id = target_exam_id
                  AND sub.question_number = q.question_number
                  AND sub.sub_part IS NOT NULL
                  AND sub.sub_part <> ''
            )
          );

        -- If questions exist and total > 0, update exams.total_marks
        IF computed_total > 0 THEN
            UPDATE exams
            SET total_marks = computed_total
            WHERE id = target_exam_id;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_sync_exam_total_marks ON questions;

-- Create Trigger on questions table
CREATE TRIGGER trigger_sync_exam_total_marks
AFTER INSERT OR UPDATE OF max_marks, question_number, sub_part OR DELETE
ON questions
FOR EACH ROW
EXECUTE FUNCTION sync_exam_total_marks();

-- One-time backfill: update all existing exams to match their question sums if questions exist
UPDATE exams e
SET total_marks = (
    SELECT COALESCE(SUM(q.max_marks), 0)
    FROM questions q
    WHERE q.exam_id = e.id
      AND (
        (q.sub_part IS NOT NULL AND q.sub_part <> '')
        OR
        NOT EXISTS (
            SELECT 1 FROM questions sub
            WHERE sub.exam_id = e.id
              AND sub.question_number = q.question_number
              AND sub.sub_part IS NOT NULL
              AND sub.sub_part <> ''
        )
      )
)
WHERE EXISTS (
    SELECT 1 FROM questions q WHERE q.exam_id = e.id
);
