-- Migration: 003_numeric_marks.sql
-- Reason: marks columns were declared as int, which cannot store fractional
-- values (e.g. 2.5 marks for a partially correct answer). The AI grading
-- pipeline (pipeline.js) outputs raw float values from the model — storing
-- them in an int column would either throw a DB error or silently truncate
-- the decimal, producing incorrect totals on student report cards.
-- Changing to numeric preserves full precision for all mark/score fields.

ALTER TABLE questions        ALTER COLUMN max_marks            TYPE numeric;
ALTER TABLE answers          ALTER COLUMN obtained_marks       TYPE numeric;
ALTER TABLE students         ALTER COLUMN total_obtained_marks TYPE numeric;
ALTER TABLE recheck_requests ALTER COLUMN revised_marks        TYPE numeric;
