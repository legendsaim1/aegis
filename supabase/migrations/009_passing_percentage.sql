-- Step 1: Add a configurable pass threshold to the exams table
-- Defaults to 50 so existing hackathon data doesn't break
ALTER TABLE exams 
ADD COLUMN passing_percentage int DEFAULT 50;