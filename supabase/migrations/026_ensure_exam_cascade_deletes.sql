-- Migration 026: Ensure ON DELETE CASCADE for all tables referencing exams(id)

-- 1. questions -> exams
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = 'questions'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'exam_id'
    ) LOOP
        EXECUTE 'ALTER TABLE questions DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE questions
  ADD CONSTRAINT questions_exam_id_fkey
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

-- 2. students -> exams
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = 'students'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'exam_id'
    ) LOOP
        EXECUTE 'ALTER TABLE students DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE students
  ADD CONSTRAINT students_exam_id_fkey
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

-- 3. copy_flags -> exams
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = 'copy_flags'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'exam_id'
    ) LOOP
        EXECUTE 'ALTER TABLE copy_flags DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE copy_flags
  ADD CONSTRAINT copy_flags_exam_id_fkey
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;
