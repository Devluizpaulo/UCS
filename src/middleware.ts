
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// AUTHENTICATION IS TEMPORARILY DISABLED.
// This middleware allows all requests to pass through.
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login
     * - and other public pages
     */
    '/((?!api|_next/static|_next/image|favicon.ico|image|login|forgot-password|reset-password).*)',
  ],
};
