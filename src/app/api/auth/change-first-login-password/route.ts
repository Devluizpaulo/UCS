
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { completeFirstLogin } from '@/lib/profile-service';
import { auth as adminAuth } from '@/lib/firebase-admin-config';

/**
 * Esta API tem uma única responsabilidade:
 * Marcar o primeiro login como concluído após o cliente ter alterado a senha.
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    // We trust the middleware has validated the token, so we can decode it to get the UID.
    // However, we should still handle cases where the token might be invalid.
    const decodedToken = await adminAuth.verifySessionCookie(token, true);
    const user = await adminAuth.getUser(decodedToken.uid);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    if (!user.customClaims?.isFirstLogin) {
      return NextResponse.json({ error: 'Esta operação só é permitida no primeiro login' }, { status: 403 });
    }
    
    await completeFirstLogin(user.uid);
      
    // O cliente fará o refresh do token para obter as novas claims
    return NextResponse.json({ message: 'Status do usuário atualizado com sucesso.' });

  } catch (error: any) {
    console.error('Erro ao completar o primeiro login:', error);
    if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/session-cookie-revoked') {
        return NextResponse.json({ error: 'Sessão inválida, por favor faça login novamente.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor ao atualizar status do usuário.' }, { status: 500 });
  }
}
