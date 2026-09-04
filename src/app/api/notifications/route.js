import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const supabase = supabaseServer();
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseServer();
    const body = await request.json();
    const { type, title, message, link_url } = body;

    const ALLOWED_TYPES = ['info', 'success', 'warning', 'error'];
    const notificationType = type || 'info';

    if (!ALLOWED_TYPES.includes(notificationType)) {
      return NextResponse.json(
        { error: `Invalid notification type. Must be one of: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('notifications').insert({
      teacher_id: user.id,
      type: notificationType,
      title: title || '',
      message: message || '',
      link_url: link_url || null
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseServer();
    const body = await request.json();
    const { notificationIds, markAll } = body;

    let query = supabase.from('notifications').update({ is_read: true }).eq('teacher_id', user.id);

    if (!markAll && notificationIds && notificationIds.length > 0) {
      query = query.in('id', notificationIds);
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
