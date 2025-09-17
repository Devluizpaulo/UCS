
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';

export async function middleware(request: NextRequest) {
  const user = await verifyAuth(request);
  const { pathname } = request.nextUrl;

  // Se o usuário não estiver autenticado, redirecione para o login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { isFirstLogin } = user;

  // Se for o primeiro login, force o usuário a ir para a página de redefinição de senha
  if (isFirstLogin && pathname !== '/first-login-password-reset') {
    return NextResponse.redirect(new URL('/first-login-password-reset', request.url));
  }
  
  // Se o usuário já passou do primeiro login, mas tenta acessar a página de redefinição,
  // redirecione-o para o painel principal.
  if (!isFirstLogin && pathname === '/first-login-password-reset') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Se estiver tudo certo, permita que a requisição continue
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
     * - image (public images folder)
     * - login, forgot-password, reset-password (public auth pages)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|image|login|forgot-password|reset-password).*)',
  ],
};
