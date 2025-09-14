
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { completeFirstLogin, updateUserPasswordInAuth } from '@/lib/profile-service';

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
    const { newPassword } = body;

    if (!newPassword) {
      return NextResponse.json({ error: 'Nova senha é obrigatória' }, { status: 400 });
    }
    
    if (newPassword.length < 6 || newPassword.length > 8) {
        return NextResponse.json({ error: 'A nova senha deve ter entre 6 e 8 caracteres' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9]+$/.test(newPassword)) {
        return NextResponse.json({ error: 'A senha deve conter apenas letras e números' }, { status: 400 });
    }

    try {
      // Atualiza a senha no Firebase Auth
      await updateUserPasswordInAuth(user.uid, newPassword);
      // Atualiza a claim 'isFirstLogin' para false
      await completeFirstLogin(user.uid);
      
      // O cliente fará o refresh do token para obter as novas claims
      return NextResponse.json({ message: 'Senha alterada com sucesso. Faça login novamente para continuar.' });

    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      return NextResponse.json({ error: 'Erro interno do servidor ao alterar a senha.' }, { status: 500 });
    }

  } catch (error: any) => {
    console.error('Erro na API de alteração de senha:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
