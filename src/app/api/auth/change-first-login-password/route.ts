
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { completeFirstLogin } from '@/lib/profile-service';

/**
 * Esta API tem uma única responsabilidade:
 * Marcar o primeiro login como concluído após o cliente ter alterado a senha.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (!user.isFirstLogin) {
      return NextResponse.json({ error: 'Esta operação só é permitida no primeiro login' }, { status: 403 });
    }
    
    await completeFirstLogin(user.uid);
      
    // O cliente fará o refresh do token para obter as novas claims
    return NextResponse.json({ message: 'Status do usuário atualizado com sucesso.' });

  } catch (error: any) {
    console.error('Erro ao completar o primeiro login:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao atualizar status do usuário.' }, { status: 500 });
  }
}
