import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  const siteUrl = origin; // Dynamically uses the exact domain the request came from
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    
    // We MUST use the SSR client to exchange the code so the session cookie is saved to the browser
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // Ignore if called from a context where cookies can't be set
            }
          },
        },
      }
    );

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && session) {
      // Use the Service Role client strictly for the database insert to bypass any Row Level Security
      const dbClient = supabaseServer();
      
      const { data: teacher } = await dbClient
        .from('teachers')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();
        
      if (!teacher) {
        const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
        await dbClient.from('teachers').insert({
          id: session.user.id,
          email: session.user.email,
          full_name: fullName,
          school_name: ''
        });
      }
      
      return NextResponse.redirect(`${siteUrl}${next}`);
    } else if (error) {
      // If code exchange failed (e.g. signups disabled, code expired), expose the error to the frontend
      return NextResponse.redirect(`${siteUrl}/?error=${encodeURIComponent(error.message)}`);
    }
  }

  // If there's no code (e.g. Implicit flow hash fragment) or exchange failed, 
  // redirect to `next` anyway so the client-side Supabase instance can process the hash fragment.
  // If there was an actual error, it will usually be in the hash or query string.
  if (searchParams.has('error')) {
    return NextResponse.redirect(`${siteUrl}/?error=${searchParams.get('error')}`);
  }

  return NextResponse.redirect(`${siteUrl}${next}`);
}
