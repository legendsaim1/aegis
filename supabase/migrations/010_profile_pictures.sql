-- 1. Add the avatar_url column to the teachers table
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Create the "avatars" bucket inside Supabase Storage (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable Storage Row Level Security (RLS) on the objects table

-- POLICY 1: Public Read Access
-- Anyone can view the profile pictures (needed so the UI can load them without auth tokens)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- POLICY 2: Authenticated Insert
-- Teachers can only upload files into a folder that matches their exact User ID
CREATE POLICY "Teachers can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- POLICY 3: Authenticated Update
-- Teachers can overwrite/update files in their own folder
CREATE POLICY "Teachers can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- POLICY 4: Authenticated Delete
-- Teachers can delete files from their own folder
CREATE POLICY "Teachers can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);