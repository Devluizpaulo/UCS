import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin-config';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token é obrigatório.' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: 'Nova senha é obrigatória.' },
        { status: 400 }
      );
    }

    // Validar nova senha
    if (newPassword.length < 6 || newPassword.length > 8) {
      return NextResponse.json(
        { error: 'A nova senha deve ter entre 6 e 8 caracteres.' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z]+$|^[0-9]+$|^[a-zA-Z0-9]+$/.test(newPassword)) {
      return NextResponse.json(
        { error: 'A senha deve conter apenas letras, apenas números, ou letras e números.' },
        { status: 400 }
      );
    }

    // Hash do token para busca
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar token no Firestore
    const tokenQuery = await db.collection('password_reset_tokens')
      .where('token', '==', tokenHash)
      .where('used', '==', false)
      .limit(1)
      .get();

    if (tokenQuery.empty) {
      return NextResponse.json(
        { error: 'Token inválido ou já utilizado.' },
        { status: 400 }
      );
    }

    const tokenDoc = tokenQuery.docs[0];
    const tokenData = tokenDoc.data();

    // Verificar se o token não expirou
    const now = new Date();
    const expiresAt = new Date(tokenData.expiresAt);

    if (now > expiresAt) {
      // Marcar token como usado para limpeza
      await tokenDoc.ref.update({ used: true });
      
      return NextResponse.json(
        { error: 'Token expirado. Solicite uma nova recuperação de senha.' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const userDoc = await db.collection('users').doc(tokenData.userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Verificar se o usuário está ativo
    if (!userData?.isActive) {
      return NextResponse.json(
        { error: 'Conta desativada. Entre em contato com o administrador.' },
        { status: 403 }
      );
    }

    // Hash da nova senha
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar senha do usuário
    const updateData: any = {
      passwordHash: newPasswordHash,
      updatedAt: new Date().toISOString()
    };

    // Se for primeiro login, marcar como não sendo mais
    if (userData.isFirstLogin) {
      updateData.isFirstLogin = false;
    }

    await userDoc.ref.update(updateData);

    // Marcar token como usado
    await tokenDoc.ref.update({ 
      used: true,
      usedAt: new Date().toISOString()
    });

    // Invalidar todos os outros tokens do usuário por segurança
    const userTokensQuery = await db.collection('password_reset_tokens')
      .where('userId', '==', tokenData.userId)
      .where('used', '==', false)
      .get();

    const batch = db.batch();
    userTokensQuery.docs.forEach(doc => {
      if (doc.id !== tokenDoc.id) {
        batch.update(doc.ref, { used: true });
      }
    });
    await batch.commit();

    return NextResponse.json(
      { message: 'Senha redefinida com sucesso. Você pode fazer login com sua nova senha.' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Erro ao redefinir senha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}

// Endpoint para validar token (opcional, para verificar se token é válido antes do reset)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token é obrigatório.' },
        { status: 400 }
      );
    }

    // Hash do token para busca
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar token no Firestore
    const tokenQuery = await db.collection('password_reset_tokens')
      .where('token', '==', tokenHash)
      .where('used', '==', false)
      .limit(1)
      .get();

    if (tokenQuery.empty) {
      return NextResponse.json(
        { valid: false, error: 'Token inválido ou já utilizado.' },
        { status: 400 }
      );
    }

    const tokenData = tokenQuery.docs[0].data();

    // Verificar se o token não expirou
    const now = new Date();
    const expiresAt = new Date(tokenData.expiresAt);

    if (now > expiresAt) {
      return NextResponse.json(
        { valid: false, error: 'Token expirado.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { valid: true },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Erro ao validar token:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}