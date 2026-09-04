import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';

import { validateRequired } from '@/lib/utils/validators';

export const maxDuration = 300;

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}

export async function POST(req) {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { valid, missing } = validateRequired(body, ['title', 'subject']);
  if (!valid) {
    return Response.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
  }

  const trimmedTitle = String(body.title || '').trim();
  const trimmedSubject = String(body.subject || '').trim();

  if (!trimmedTitle) {
    return Response.json({ error: 'Exam title cannot be empty' }, { status: 400 });
  }
  if (!trimmedSubject) {
    return Response.json({ error: 'Exam subject cannot be empty' }, { status: 400 });
  }

  let passingPercentage = 40;
  if (body.passing_percentage !== undefined && body.passing_percentage !== null) {
    const pct = Number(body.passing_percentage);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      return Response.json({ error: 'passing_percentage must be a number between 0 and 100' }, { status: 400 });
    }
    passingPercentage = pct;
  }

  let totalMarks = 0;
  if (body.total_marks !== undefined && body.total_marks !== null) {
    const marks = Number(body.total_marks);
    if (!Number.isFinite(marks) || marks < 0) {
      return Response.json({ error: 'total_marks must be a non-negative number' }, { status: 400 });
    }
    totalMarks = marks;
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('exams')
    .insert({
      title: trimmedTitle,
      subject: trimmedSubject,
      class_grade: body.class_grade ? String(body.class_grade).trim() : null,
      total_marks: totalMarks,
      instructions: body.instructions ? String(body.instructions).trim() : null,
      passing_percentage: passingPercentage,
      teacher_id: user.id,
      status: 'draft', // server-controlled default; not client-settable
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}