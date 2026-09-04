import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  // 1. Require a valid authenticated Supabase session
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { id: requestedId, full_name, school_name } = body;

  // 2. Prevent identity spoofing: if an ID is provided, it MUST match the session
  if (requestedId && requestedId !== user.id) {
    return Response.json({ error: 'Forbidden: Cannot create profile for another user' }, { status: 403 });
  }

  // 3. Derive verified identity strictly from the authenticated session
  const teacherId = user.id;
  const email = user.email;
  const fullName = (full_name && String(full_name).trim()) || user.user_metadata?.full_name || user.user_metadata?.name || 'Teacher';
  const schoolName = (school_name && String(school_name).trim().slice(0, 200)) || '';

  const supabase = supabaseServer();

  // 4. Idempotently insert or update the verified teacher profile
  const { data, error } = await supabase
    .from('teachers')
    .upsert(
      {
        id: teacherId,
        email,
        full_name: fullName,
        school_name: schoolName,
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(data);
}