import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/profile-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar se os campos obrigatórios estão presentes
    const { displayName, email, password, phoneNumber } = body;
    
    if (!displayName || !email || !password || !phoneNumber) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validar tamanho da senha
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Validar telefone
    if (phoneNumber.length < 10) {
      return NextResponse.json(
        { error: 'O telefone deve ter pelo menos 10 dígitos' },
        { status: 400 }
      );
    }

    // Criar o usuário
    const result = await createUser({
      displayName,
      email,
      password,
      phoneNumber,
      role: 'admin' // Primeiro usuário é sempre admin
    });

    return NextResponse.json(
      { 
        message: 'Usuário criado com sucesso',
        uid: result.uid
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    
    // Tratar erros específicos do Firebase
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 409 }
      );
    }
    
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }
    
    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Senha muito fraca' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}