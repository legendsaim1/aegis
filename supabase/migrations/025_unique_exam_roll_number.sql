-- Migration 025: Unique constraint on (exam_id, roll_number)
-- Prevents duplicate student roll numbers within the same exam

ALTER TABLE students
ADD CONSTRAINT unique_exam_roll UNIQUE (exam_id, roll_number);
