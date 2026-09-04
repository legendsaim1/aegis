import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';

export const maxDuration = 60;

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

// ---------- POST — Upload a profile picture ----------
// Runs server-side with the service role key, same pattern as the
// answer-sheet upload route. The previous version tried to upload
// straight from the browser with the anon key, which the "answer-sheets"
// bucket's storage policies were never configured to allow — that's why
// "Change Picture" silently failed.
export async function POST(req) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'Please upload a PNG, JPG, WEBP, or GIF image.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return Response.json({ error: 'Image must be under 3MB.' }, { status: 400 });
  }

  const supabase = supabaseServer();

  const fileExt = file.name.split('.').pop() || 'jpg';
  const filePath = `avatars/${user.id}/${Date.now()}.${fileExt}`;
  const fileBuffer = await file.arrayBuffer();

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return Response.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(uploadData.path);

  const { error: updateError } = await supabase
    .from('teachers')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id);

  if (updateError) {
    return Response.json({ error: `Uploaded, but failed to save to profile: ${updateError.message}` }, { status: 500 });
  }

  return Response.json({ avatar_url: publicUrl });
}
