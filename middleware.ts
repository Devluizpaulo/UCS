import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Permitir acesso livre à página de login e APIs
  if (pathname === '/login' || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Verificar autenticação JWT para outras rotas
  const user = verifyAuth(request);
  
  if (!user) {
    // Se não autenticado, redirecionar para login
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Se autenticado, permitir acesso
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};