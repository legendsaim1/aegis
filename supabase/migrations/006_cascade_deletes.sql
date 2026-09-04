-- exams
ALTER TABLE exams DROP CONSTRAINT IF EXISTS exams_teacher_id_fkey;
ALTER TABLE exams ADD CONSTRAINT exams_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE;

-- questions
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_exam_id_fkey;
ALTER TABLE questions ADD CONSTRAINT questions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

-- students
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_exam_id_fkey;
ALTER TABLE students ADD CONSTRAINT students_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

-- answers
ALTER TABLE answers DROP CONSTRAINT IF EXISTS answers_student_id_fkey;
ALTER TABLE answers ADD CONSTRAINT answers_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE answers DROP CONSTRAINT IF EXISTS answers_question_id_fkey;
ALTER TABLE answers ADD CONSTRAINT answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;

-- recheck_requests
ALTER TABLE recheck_requests DROP CONSTRAINT IF EXISTS recheck_requests_student_id_fkey;
ALTER TABLE recheck_requests ADD CONSTRAINT recheck_requests_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE recheck_requests DROP CONSTRAINT IF EXISTS recheck_requests_question_id_fkey;
ALTER TABLE recheck_requests ADD CONSTRAINT recheck_requests_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;
