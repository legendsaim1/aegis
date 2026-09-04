-- Migration 019: Provision private answer-sheets bucket and Storage RLS policies

-- 1. Create the private "answer-sheets" bucket inside Supabase Storage (if it doesn't exist)
-- Sets public = false, 20MB file size limit, and restricts allowed MIME types to PDFs and images.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'answer-sheets',
  'answer-sheets',
  false,
  20971520, -- 20 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 2. Storage Row Level Security (RLS) policies
-- Note: RLS is enabled by default on storage.objects in Supabase.
-- Clean up any pre-existing policies for answer-sheets to prevent duplicates
DROP POLICY IF EXISTS "Teachers can read answer sheets for their exams" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload answer sheets to their exams" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update answer sheets for their exams" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete answer sheets for their exams" ON storage.objects;

-- POLICY 1: Authenticated Read
-- Teachers can only read/download files for exams they own (folder name is exam_id)
CREATE POLICY "Teachers can read answer sheets for their exams"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'answer-sheets'
  AND EXISTS (
    SELECT 1 FROM public.exams
    WHERE exams.id::text = (storage.foldername(name))[1]
    AND exams.teacher_id = auth.uid()
  )
);

-- POLICY 2: Authenticated Insert
-- Teachers can only upload files into folders matching their own exam IDs
CREATE POLICY "Teachers can upload answer sheets to their exams"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'answer-sheets'
  AND EXISTS (
    SELECT 1 FROM public.exams
    WHERE exams.id::text = (storage.foldername(name))[1]
    AND exams.teacher_id = auth.uid()
  )
);

-- POLICY 3: Authenticated Update
CREATE POLICY "Teachers can update answer sheets for their exams"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'answer-sheets'
  AND EXISTS (
    SELECT 1 FROM public.exams
    WHERE exams.id::text = (storage.foldername(name))[1]
    AND exams.teacher_id = auth.uid()
  )
);

-- POLICY 4: Authenticated Delete
CREATE POLICY "Teachers can delete answer sheets for their exams"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'answer-sheets'
  AND EXISTS (
    SELECT 1 FROM public.exams
    WHERE exams.id::text = (storage.foldername(name))[1]
    AND exams.teacher_id = auth.uid()
  )
);
