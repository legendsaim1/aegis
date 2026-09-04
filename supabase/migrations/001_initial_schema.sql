create table teachers (
  id uuid primary key references auth.users(id),
  email text,
  full_name text,
  school_name text,
  created_at timestamp default now()
);

create table exams (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references teachers(id),
  title text,
  subject text,
  class_grade text,
  total_marks int,
  instructions text,
  status text default 'draft',
  created_at timestamp default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams(id),
  question_number int,
  question_text text,
  question_type text,
  max_marks int,
  rubric_json text,
  teacher_instructions text
);

create table students (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams(id),
  student_name text,
  roll_number text,
  answer_sheet_url text,
  status text default 'pending',
  ocr_confidence float,
  overall_grade_confidence float,
  total_obtained_marks int,
  processed_at timestamp
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id),
  question_id uuid references questions(id),
  extracted_text text,
  ocr_confidence_score float,
  obtained_marks int,
  grading_confidence_score float,
  ai_feedback text,
  flag_reason text,
  needs_review boolean default false
);

create table recheck_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id),
  question_id uuid references questions(id),
  reason text,
  status text default 'pending',
  revised_marks int,
  teacher_notes text,
  created_at timestamp default now()
);