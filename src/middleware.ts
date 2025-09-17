import { NextResponse, type NextRequest } from 'next/server';

// Define as rotas públicas que não exigem autenticação
const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('auth-token')?.value;
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  // Se não houver token e a rota não for pública, redirecione para o login
  if (!authToken && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se houver token e o usuário tentar acessar uma rota pública, redirecione para o painel
  if (authToken && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Para o fluxo de primeiro login, o redirecionamento já é tratado no MainLayout
  // que tem acesso ao estado de autenticação do usuário no lado do cliente.
  // Manter essa lógica no middleware é complexo e propenso a erros sem verificar o token.

  // Se nenhuma das condições acima for atendida, permita o acesso
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
