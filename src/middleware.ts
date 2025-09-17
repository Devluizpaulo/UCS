
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Lista de rotas públicas que não exigem autenticação
  const publicPaths = ['/login', '/forgot-password', '/reset-password'];

  // Permitir acesso a rotas públicas e APIs sem verificação de token
  if (publicPaths.includes(pathname) || pathname.startsWith('/api/') || pathname.startsWith('/image/')) {
    return NextResponse.next();
  }
  
  // Verificar autenticação JWT para todas as outras rotas
  const user = await verifyAuth(request);
  
  if (!user) {
    // Se não autenticado, redirecionar para a página de login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = ''; // Limpar quaisquer query params
    return NextResponse.redirect(url);
  }
  
  const isFirstLogin = user.isFirstLogin === true;
  const isFirstLoginPage = pathname === '/first-login-password-reset';

  // Se for o primeiro login e o usuário não estiver na página correta, redireciona para lá
  if (isFirstLogin && !isFirstLoginPage) {
    return NextResponse.redirect(new URL('/first-login-password-reset', request.url));
  }
  
  // Se não for o primeiro login e o usuário tentar acessar a página de troca, redireciona para o painel
  if (!isFirstLogin && isFirstLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Se autenticado e não for o primeiro login (ou já estiver na página correta), permitir acesso
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|image/).*)',
  ],
};
