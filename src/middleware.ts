import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/firebase-admin-config';

// Define as rotas públicas que não exigem autenticação
const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('auth-token')?.value;

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  // 1. Se não houver token e a rota não for pública, redirecione para o login
  if (!authToken && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Se houver token, verifique-o
  if (authToken) {
    try {
      const decodedToken = await auth.verifySessionCookie(authToken, true);
      const { isFirstLogin } = decodedToken;

      // 2a. Se for o primeiro login, force o redirecionamento para a troca de senha
      if (isFirstLogin && pathname !== '/first-login-password-reset') {
        return NextResponse.redirect(new URL('/first-login-password-reset', request.url));
      }

      // 2b. Se NÃO for o primeiro login, impeça o acesso à página de troca de senha
      if (!isFirstLogin && pathname === '/first-login-password-reset') {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // 2c. Se o usuário estiver logado e tentar acessar uma rota pública, redirecione-o para o painel
      if (isPublicRoute) {
        return NextResponse.redirect(new URL('/', request.url));
      }

    } catch (error) {
      // 2d. Se o token for inválido, limpe o cookie e redirecione para o login
      console.log('Middleware: Invalid auth token. Redirecting to login.');
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }
  }

  // 3. Se nenhuma das condições acima for atendida, permita o acesso
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos de solicitação, exceto aqueles que começam com:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (arquivos de otimização de imagem)
     * - favicon.ico (arquivo de favicon)
     * - image (pasta de imagens públicas)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|image).*)',
  ],
};
