import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request) {
  // Intercept the request at the Vercel Edge Network
  // This will silently refresh expired tokens AND bounce unauthenticated users instantly
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - all public images and assets
     * - /api/ (API routes handle their own auth to avoid double network calls)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
