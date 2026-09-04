-- Add CASCADE delete to teachers table so deleting an auth user automatically deletes their teacher profile
ALTER TABLE public.teachers
DROP CONSTRAINT IF EXISTS teachers_id_fkey,
ADD CONSTRAINT teachers_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
