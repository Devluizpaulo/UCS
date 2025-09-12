
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { updateUserPassword, completeFirstLoginInFirestore } from '@/lib/firestore-auth-service';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (!user.isFirstLogin) {
      return NextResponse.json({ error: 'Esta operação só é permitida no primeiro login' }, { status: 403 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Senha atual e nova senha são obrigatórias' }, { status: 400 });
    }
    
    if (newPassword.length < 6 || newPassword.length > 8) {
        return NextResponse.json({ error: 'A nova senha deve ter entre 6 e 8 caracteres' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9]+$/.test(newPassword)) {
        return NextResponse.json({ error: 'A senha deve conter apenas letras e números' }, { status: 400 });
    }

    try {
      await updateUserPassword(user.uid, currentPassword, newPassword);
      
      const newToken = jwt.sign(
        { uid: user.uid, email: user.email, role: user.role, isFirstLogin: false },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response = NextResponse.json({ message: 'Senha alterada com sucesso' });

      response.cookies.set('auth-token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60,
        path: '/',
      });

      return response;

    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      
      if (error.message?.includes('senha atual está incorreta')) {
        return NextResponse.json({ error: 'A senha atual fornecida está incorreta' }, { status: 400 });
      }
      
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Erro na API de alteração de senha:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
