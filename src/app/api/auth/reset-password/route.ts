
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin-config';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token e nova senha são obrigatórios.' }, { status: 400 });
    }

    if (newPassword.length < 6 || newPassword.length > 8) {
      return NextResponse.json({ error: 'A nova senha deve ter entre 6 e 8 caracteres.' }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9]+$/.test(newPassword)) {
        return NextResponse.json({ error: 'A senha deve conter apenas letras e números.' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenQuery = await db.collection('password_reset_tokens').where('token', '==', tokenHash).where('used', '==', false).limit(1).get();
    if (tokenQuery.empty) {
      return NextResponse.json({ error: 'Token inválido ou já utilizado.' }, { status: 400 });
    }

    const tokenDoc = tokenQuery.docs[0];
    const tokenData = tokenDoc.data();

    const expiresAt = new Date(tokenData.expiresAt);
    if (new Date() > expiresAt) {
      await tokenDoc.ref.update({ used: true });
      return NextResponse.json({ error: 'Token expirado. Solicite uma nova recuperação de senha.' }, { status: 400 });
    }

    const userDoc = await db.collection('users').doc(tokenData.userId).get();
    if (!userDoc.exists || !userDoc.data()?.isActive) {
      return NextResponse.json({ error: 'Usuário não encontrado ou desativado.' }, { status: 404 });
    }
    const userData = userDoc.data();


    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    const updateData: any = {
      passwordHash: newPasswordHash,
      updatedAt: new Date().toISOString(),
      isFirstLogin: false // Reset first login flag on password reset
    };

    await userDoc.ref.update(updateData);
    await tokenDoc.ref.update({ used: true, usedAt: new Date().toISOString() });

    // Invalidate all other tokens for this user
    const otherTokensQuery = await db.collection('password_reset_tokens').where('userId', '==', tokenData.userId).where('used', '==', false).get();
    const batch = db.batch();
    otherTokensQuery.docs.forEach(doc => batch.update(doc.ref, { used: true }));
    await batch.commit();

    return NextResponse.json({ message: 'Senha redefinida com sucesso. Você pode fazer login com sua nova senha.' });

  } catch (error: any) {
    console.error('Erro ao redefinir senha:', error);
    return NextResponse.json({ error: 'Erro interno do servidor. Tente novamente mais tarde.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Token é obrigatório.' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenQuery = await db.collection('password_reset_tokens').where('token', '==', tokenHash).where('used', '==', false).limit(1).get();
    if (tokenQuery.empty) {
      return NextResponse.json({ valid: false, error: 'Token inválido ou já utilizado.' }, { status: 400 });
    }

    const tokenData = tokenQuery.docs[0].data();
    if (new Date() > new Date(tokenData.expiresAt)) {
      return NextResponse.json({ valid: false, error: 'Token expirado.' }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch (error: any) {
    console.error('Erro ao validar token:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
