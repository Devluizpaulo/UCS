import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin-config';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

interface ResetToken {
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  used: boolean;
}

// Configuração do transporter de email
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email é obrigatório.' },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const userQuery = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (userQuery.empty) {
      // Por segurança, não revelamos se o email existe ou não
      return NextResponse.json(
        { message: 'Se o email estiver cadastrado, você receberá as instruções de recuperação.' },
        { status: 200 }
      );
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Verificar se o usuário está ativo
    if (!userData.isActive) {
      return NextResponse.json(
        { error: 'Conta desativada. Entre em contato com o administrador.' },
        { status: 403 }
      );
    }

    // Gerar token seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    // Salvar token no Firestore
    const tokenData: ResetToken = {
      userId,
      token: tokenHash,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      used: false
    };

    await db.collection('password_reset_tokens').add(tokenData);

    // Preparar email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">🔐 Recuperação de Senha</h1>
          <p style="color: #6b7280; margin: 5px 0;">Sistema Índice UCS</p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #1f2937; margin-top: 0;">Olá, ${userData.displayName}!</h2>
          <p style="color: #4b5563; line-height: 1.6;">Recebemos uma solicitação para redefinir a senha da sua conta no Sistema Índice UCS.</p>
          <p style="color: #4b5563; line-height: 1.6;">Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha:</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Redefinir Senha</a>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 25px 0;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">⚠️ <strong>Importante:</strong> Este link expira em 30 minutos por segurança.</p>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Se você não solicitou esta recuperação, ignore este email. Sua senha permanecerá inalterada.</p>
          <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">Caso o botão não funcione, copie e cole este link no seu navegador:</p>
          <p style="color: #2563eb; font-size: 12px; word-break: break-all; margin: 5px 0 0 0;">${resetUrl}</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">© Sistema Índice UCS</p>
          <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">Suporte: luizpaulo.jesus@bmv.global</p>
        </div>
      </div>
    `;

    // Enviar email
    const transporter = createEmailTransporter();
    await transporter.sendMail({
      from: `"Sistema Índice UCS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Recuperação de Senha - Sistema Índice UCS',
      html: emailHtml,
    });

    return NextResponse.json(
      { message: 'Se o email estiver cadastrado, você receberá as instruções de recuperação.' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Erro ao processar solicitação de reset:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}