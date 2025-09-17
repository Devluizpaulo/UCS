
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/firebase-admin-config'; // Using admin to check claims in the future if needed

// This middleware is now simplified. Its primary role is to handle public vs. private routes
// and the special case of the first login. The actual token validation for API routes
// should be handled within each API route or a dedicated API middleware.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('auth-token')?.value;

  // If there's no token, redirect any protected route to the login page.
  if (!authToken) {
      if (pathname.startsWith('/login') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password')) {
          return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/login', request.url));
  }

  // If there is a token, try to verify it to check claims.
  try {
      const decodedToken = await auth.verifySessionCookie(authToken, true);
      const { isFirstLogin } = decodedToken;

      // If it's the user's first login, force them to the password reset page.
      if (isFirstLogin && pathname !== '/first-login-password-reset') {
          return NextResponse.redirect(new URL('/first-login-password-reset', request.url));
      }
      
      // If the user has already completed the first login but tries to access that page, redirect them.
      if (!isFirstLogin && pathname === '/first-login-password-reset') {
          return NextResponse.redirect(new URL('/', request.url));
      }

  } catch (error) {
      // If the token is invalid (expired, etc.), clear the cookie and redirect to login.
      console.log('Middleware: Invalid auth token. Redirecting to login.');
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
  }
  
  // If the user is authenticated and not on a special page, let them proceed.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes are handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - image (public images folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|image).*)',
  ],
};
