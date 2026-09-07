-- Migration 028: Defense-in-depth non-negativity CHECK constraints on mark columns.
--
-- Mark columns were changed to unbounded `numeric` in migration 003. Upper bounds are
-- enforced in the application layer (validateMarks), but there was no DB-level backstop
-- against negative values. This migration adds non-negativity CHECK constraints.
--
-- Upper bounds (obtained_marks <= questions.max_marks, total <= exams.total_marks) are
-- cross-table and cannot be expressed as CHECK constraints; they remain app-enforced by
-- validateMarks (verified working). Adding triggers for them was deliberately avoided
-- because it would put every mark write path at risk.
--
-- Applied with NOT VALID then VALIDATE so existing rows are not scanned under a long
-- lock, and any pre-existing violation fails loudly instead of passing silently.
-- NULL is allowed (NULL >= 0 is UNKNOWN, which satisfies a CHECK), so ungraded rows
-- with obtained_marks IS NULL are unaffected.
--
-- Pre-check (each MUST return 0 before the corresponding VALIDATE will succeed):
--   SELECT count(*) FROM answers          WHERE obtained_marks       < 0;
--   SELECT count(*) FROM students         WHERE total_obtained_marks < 0;
--   SELECT count(*) FROM questions        WHERE max_marks            < 0;
--   SELECT count(*) FROM recheck_requests WHERE revised_marks        < 0;

ALTER TABLE answers          ADD CONSTRAINT answers_obtained_marks_nonneg CHECK (obtained_marks       >= 0) NOT VALID;
ALTER TABLE students         ADD CONSTRAINT students_total_marks_nonneg   CHECK (total_obtained_marks >= 0) NOT VALID;
ALTER TABLE questions        ADD CONSTRAINT questions_max_marks_nonneg    CHECK (max_marks            >= 0) NOT VALID;
ALTER TABLE recheck_requests ADD CONSTRAINT recheck_revised_marks_nonneg  CHECK (revised_marks        >= 0) NOT VALID;

ALTER TABLE answers          VALIDATE CONSTRAINT answers_obtained_marks_nonneg;
ALTER TABLE students         VALIDATE CONSTRAINT students_total_marks_nonneg;
ALTER TABLE questions        VALIDATE CONSTRAINT questions_max_marks_nonneg;
ALTER TABLE recheck_requests VALIDATE CONSTRAINT recheck_revised_marks_nonneg;
