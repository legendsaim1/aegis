-- Step 1: Turn on the RLS Firewall for all tables
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recheck_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_flags ENABLE ROW LEVEL SECURITY;

-- Step 2: Define the Ownership Rules (Policies)

-- 1. Teachers: Can only access and modify their own row
CREATE POLICY "Teachers can manage their own profile"
ON teachers FOR ALL
USING (id = auth.uid());

-- 2. Exams: Can only access and modify their own exams
CREATE POLICY "Teachers can manage their own exams"
ON exams FOR ALL
USING (teacher_id = auth.uid());

-- 3. Questions: Can only access and modify questions belonging to their exams
CREATE POLICY "Teachers can manage questions for their exams"
ON questions FOR ALL
USING (exam_id IN (SELECT id FROM exams WHERE teacher_id = auth.uid()));

-- 4. Students: Can only access and modify students belonging to their exams
CREATE POLICY "Teachers can manage students for their exams"
ON students FOR ALL
USING (exam_id IN (SELECT id FROM exams WHERE teacher_id = auth.uid()));

-- 5. Copy Flags: Can only access and modify copy flags for their exams
CREATE POLICY "Teachers can manage copy flags for their exams"
ON copy_flags FOR ALL
USING (exam_id IN (SELECT id FROM exams WHERE teacher_id = auth.uid()));

-- 6. Answers: Deep relationship (Answer -> Student -> Exam -> Teacher)
CREATE POLICY "Teachers can manage answers for their exams"
ON answers FOR ALL
USING (student_id IN (
    SELECT id FROM students WHERE exam_id IN (
        SELECT id FROM exams WHERE teacher_id = auth.uid()
    )
));

-- 7. Recheck Requests: Deep relationship (Recheck -> Student -> Exam -> Teacher)
CREATE POLICY "Teachers can manage recheck requests for their exams"
ON recheck_requests FOR ALL
USING (student_id IN (
    SELECT id FROM students WHERE exam_id IN (
        SELECT id FROM exams WHERE teacher_id = auth.uid()
    )
));