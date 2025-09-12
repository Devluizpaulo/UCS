
import { NextRequest, NextResponse } from 'next/server';
import { authenticateFirestoreUser } from '@/lib/firestore-auth-service';
import jwt from 'jsonwebtoken';
import { auth } from '@/lib/firebase-admin-config';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validações básicas
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    // Autenticar usuário
    const user = await authenticateFirestoreUser(email, password);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos.' },
        { status: 401 }
      );
    }
    
    // Criar um token customizado do Firebase
    const additionalClaims = {
        role: user.role,
        isFirstLogin: user.isFirstLogin || false,
    };
    const firebaseToken = await auth.createCustomToken(user.uid, additionalClaims);

    // Gerar JWT token que será usado para a sessão de cookie. O cliente irá usar o firebaseToken para logar no SDK.
    const token = jwt.sign(
      {
        uid: user.uid,
        email: user.email,
        ...additionalClaims
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Criar resposta com cookie seguro
    const response = NextResponse.json({
      message: 'Login realizado com sucesso!',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isFirstLogin: user.isFirstLogin
      },
      firebaseToken: firebaseToken, // Enviar o token do Firebase para o cliente
    });

    // Definir cookie com o token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 horas
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('Erro na API de login:', error);
    
    const status = error.message?.includes('desativada') ? 403 : 401;
    
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor.' },
      { status }
    );
  }
}
