-- Migration 015: Add missing B-Tree indices for foreign keys
-- This prevents Full Table Scans when looking up related records

CREATE INDEX IF NOT EXISTS idx_exams_teacher_id ON public.exams(teacher_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON public.questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_students_exam_id ON public.students(exam_id);
CREATE INDEX IF NOT EXISTS idx_answers_student_id ON public.answers(student_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers(question_id);
CREATE INDEX IF NOT EXISTS idx_recheck_requests_student_id ON public.recheck_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_recheck_requests_question_id ON public.recheck_requests(question_id);
