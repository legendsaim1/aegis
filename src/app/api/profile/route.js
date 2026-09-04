import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';
import { deleteExamStorageFolder } from '@/lib/utils/storage';

// ---------- GET — Fetch the logged-in teacher's own profile ----------
// Source of truth for name/avatar is the `teachers` table, NOT
// Supabase Auth's user_metadata (nothing else in the app reads from
// user_metadata, so writing there made Settings invisible everywhere else).
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = supabaseServer();

  const { data: teacher, error } = await supabase
    .from('teachers')
    .select('id, email, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  if (error || !teacher) {
    return Response.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Email always comes from the authenticated session, not the editable
  // teachers row, so the UI can never show/send a mismatched value.
  return Response.json({
    id: teacher.id,
    email: user.email,
    full_name: teacher.full_name || '',
    avatar_url: teacher.avatar_url || null,
  });
}

// ---------- PATCH — Update full name ONLY ----------
// Email is intentionally not accepted here. Changing an account's login
// email is a sensitive, separate flow (would need re-verification) and
// is explicitly out of scope for this form.
export async function PATCH(req) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';

  if (!fullName) {
    return Response.json({ error: 'Name cannot be empty' }, { status: 400 });
  }
  if (fullName.length > 120) {
    return Response.json({ error: 'Name is too long' }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from('teachers')
    .update({ full_name: fullName })
    .eq('id', user.id)
    .select('id, full_name, avatar_url')
    .single();

  if (error) {
    return Response.json({ error: `Failed to update profile: ${error.message}` }, { status: 500 });
  }

  return Response.json({ ...data, email: user.email });
}

// ---------- DELETE — Delete account permanently ----------
export async function DELETE() {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = supabaseServer();

  // 1. Clean up storage files for all exams owned by this teacher
  const { data: teacherExams } = await supabase
    .from('exams')
    .select('id')
    .eq('teacher_id', user.id);

  if (teacherExams && teacherExams.length > 0) {
    for (const exam of teacherExams) {
      await deleteExamStorageFolder(supabase, exam.id);
    }
  }

  // 2. Clean up avatar from avatars bucket
  try {
    const { data: avatarFiles } = await supabase.storage.from('avatars').list(user.id);
    if (avatarFiles && avatarFiles.length > 0) {
      const avatarPaths = avatarFiles.map(f => `${user.id}/${f.name}`);
      await supabase.storage.from('avatars').remove(avatarPaths);
    }
  } catch (err) {
    console.warn('Failed to clean up avatar files:', err.message);
  }

  // 3. Deleting from auth.users automatically cascades to the public schema
  const { error } = await supabase.auth.admin.deleteUser(user.id);

  if (error) {
    return Response.json({ error: `Failed to delete account: ${error.message}` }, { status: 500 });
  }

  return Response.json({ success: true });
}

