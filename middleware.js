import { NextResponse } from 'next/server';
import { verifySession, COOKIE } from '@/lib/session';

// Page-level gate. API route handlers also check the session + role themselves.
export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api/')) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (pathname === '/login') {
    if (session) return NextResponse.redirect(new URL('/', req.url));
    return NextResponse.next();
  }
  if (!session) return NextResponse.redirect(new URL('/login', req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
