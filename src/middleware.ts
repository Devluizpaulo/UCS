
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('firebaseIdToken')?.value;

  // Paths that are public and don't require authentication
  const publicPaths = ['/login', '/image/login.jpg'];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // API route for scheduled jobs needs a different kind of auth (e.g. bearer token)
  if (pathname.startsWith('/api/scheduled-job')) {
    return NextResponse.next();
  }

  // If no token cookie, redirect to login for any other path
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If token exists, let the request through.
  // The actual validation of the token will be handled on the client-side
  // or in server components/API routes where the full Node.js environment is available.
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
