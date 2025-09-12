
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Lista de rotas públicas
  const publicPaths = ['/login', '/forgot-password', '/reset-password'];

  // Permitir acesso a rotas públicas e APIs
  if (publicPaths.includes(pathname) || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Verificar autenticação JWT para outras rotas
  const user = await verifyAuth(request);
  
  if (!user) {
    // Se não autenticado, redirecionar para login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = ''; // Limpa query params
    return NextResponse.redirect(url);
  }
  
  // Se autenticado, permitir acesso
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - image/ (image files in public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|image/).*)',
  ],
};
