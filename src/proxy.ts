import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const path = request.nextUrl.pathname;

  // Let setup and public files pass through
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/setup') ||
    path === '/setup' ||
    path === '/favicon.ico'
  ) {
    return supabaseResponse;
  }

  // Redirect rule: Not logged in
  if (!user) {
    if (path !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return supabaseResponse;
  }

  // Fetch the role from user profile
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;

    // Logged in and trying to access login page
    if (path === '/login' || path === '/') {
      if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      if (role === 'faculty') return NextResponse.redirect(new URL('/faculty/dashboard', request.url));
      if (role === 'student') return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }

    // Protect Role Routes
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (path.startsWith('/faculty') && role !== 'faculty') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (path.startsWith('/student') && role !== 'student') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch (error) {
    console.error('Middleware role fetch error:', error);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/public (public API routes if any)
     * - static (static files)
     * - image (image files)
     */
    '/((?!api/public|static|image).*)',
  ],
};
