
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin-config';
import { SignJWT } from 'jose';
import { db } from '@/lib/firebase-admin-config';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production');

export async function POST(request: NextRequest) {
  try {
    const { token: idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Token de autenticação não fornecido.' }, { status: 400 });
    }

    // Verificar o ID Token do Firebase
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email, role, isFirstLogin } = decodedToken;

    // Obter dados adicionais do Firestore se necessário
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        // Isso pode acontecer se o usuário foi criado no Auth mas não no Firestore.
        // É um caso de borda que pode ser tratado criando o perfil aqui.
        throw new Error('Perfil de usuário não encontrado no banco de dados.');
    }
    const userData = userDoc.data();
    
    if (!userData?.isActive) {
      throw new Error('Conta desativada. Entre em contato com o administrador.');
    }
    
    // Gerar JWT token que será usado para a sessão de cookie
    const sessionToken = await new SignJWT({
        uid,
        email,
        role: userData.role, // Usar a role do Firestore como fonte da verdade
        isFirstLogin: userData.isFirstLogin,
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // Criar resposta com cookie seguro
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

    response.cookies.set('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 horas
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
