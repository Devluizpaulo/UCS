import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth, db } from '@/lib/firebase-admin-config';

export async function POST(request: NextRequest) {
  try {
    const { token: idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Token de autenticação não fornecido.' }, { status: 400 });
    }

    // Verificar o ID Token do Firebase para autenticar o usuário
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    // Obter dados adicionais do Firestore (role, isFirstLogin)
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        throw new Error('Perfil de usuário não encontrado no banco de dados.');
    }
    const userData = userDoc.data();
    
    if (!userData?.isActive) {
      throw new Error('Conta desativada. Entre em contato com o administrador.');
    }
    
    // Criar o cookie de sessão usando o Firebase Admin SDK
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 dias
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Retornar a resposta com o cookie seguro
    const response = NextResponse.json({
      message: 'Login realizado com sucesso!',
      user: {
        uid: uid,
        email: email,
        displayName: userData.displayName,
        role: userData.role,
        isFirstLogin: userData.isFirstLogin
      },
    });

    response.cookies.set('auth-token', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: expiresIn / 1000, // maxAge é em segundos
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('Erro na API de login:', error);
    
    let errorMessage = 'Erro interno do servidor.';
    if (error.code === 'auth/id-token-expired') {
        errorMessage = 'Sessão expirada, por favor, faça login novamente.';
    } else if (error.code === 'auth/id-token-revoked') {
        errorMessage = 'Sessão revogada. Faça login novamente.';
    } else if (error.message?.includes('desativada')) {
        errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }
}
