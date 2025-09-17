import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('auth-token')?.value;
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  if (!authToken && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (authToken && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|image).*)',
  ],
};
