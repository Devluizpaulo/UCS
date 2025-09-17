import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Criar resposta de logout
    const response = NextResponse.json({
      message: 'Logout realizado com sucesso!'
    });

    // Limpar o cookie de autenticação
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0 // Expira imediatamente
    });

    return response;

  } catch (error: any) {
    console.error('Erro na API de logout:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
