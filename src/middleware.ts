import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/', '/analysis', '/settings', '/alerts'];
const PUBLIC_ROUTES = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('firebaseIdToken')?.value;

  // If the user is trying to access a protected route without a token,
  // redirect them to the login page.
  if (PROTECTED_ROUTES.includes(pathname) && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If the user is authenticated and tries to access the login page,
  // redirect them to the dashboard.
  if (PUBLIC_ROUTES.includes(pathname) && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except for static files, API routes, and image optimization.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
