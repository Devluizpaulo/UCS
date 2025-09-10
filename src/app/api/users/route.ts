
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth } from '@/lib/firebase-admin-config';

/**
 * POST /api/users - Create the first admin user or a new user.
 * If no users exist, it creates the first user and assigns them 'admin' role.
 * If users exist, it creates a new user with the specified role.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName, phoneNumber, role } = await request.json();

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Nome, e-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }
     if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres.' },
        { status: 400 }
      );
    }

    const userList = await adminAuth.listUsers(1);
    const isFirstUser = userList.users.length === 0;

    // Se for o primeiro usuário, ele DEVE ser admin.
    // Se não for o primeiro, a role do request é usada.
    const userRole = isFirstUser ? 'admin' : (role || 'user');

    // Se não for o primeiro usuário e tentar criar um admin, verificar permissão (não implementado ainda, mas é o local)

    // 3. Create the user in Firebase Auth.
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      phoneNumber,
    });

    // 4. Set custom claim to make this user an admin and require password change.
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: userRole, isFirstLogin: true });

    return NextResponse.json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
    }, { status: 201 }); // 201 Created

  } catch (error: any) {
    console.error('[API Users] Erro ao criar usuário:', error);
    
    // Tratar erros específicos do Firebase
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'Este e-mail já está em uso.' }, { status: 409 });
    }
    if (error.code === 'auth/invalid-password') {
      return NextResponse.json({ error: 'A senha é inválida. Deve ter no mínimo 8 caracteres.' }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Ocorreu um erro no servidor ao criar o usuário.' },
      { status: 500 }
    );
  }
}
