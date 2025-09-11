import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação JWT
    const user = verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Retornar dados do usuário
    return NextResponse.json({
      uid: user.uid,
      email: user.email,
      displayName: user.email, // Usar email como displayName por padrão
      role: user.role
    });

  } catch (error: any) {
    console.error('Erro na verificação de autenticação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}