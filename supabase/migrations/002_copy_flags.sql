CREATE TABLE copy_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    student_a_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_b_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    similarity_score FLOAT,
    reason TEXT,
    confirmed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add an index to easily query copy flags for a specific exam
CREATE INDEX idx_copy_flags_exam ON copy_flags(exam_id);

-- Enable Row Level Security (RLS)
ALTER TABLE copy_flags ENABLE ROW LEVEL SECURITY;
