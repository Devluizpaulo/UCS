
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth } from '@/lib/firebase-admin-config';

/**
 * POST /api/users - Create the first admin user ONLY.
 * If no users exist, it creates the first user and assigns them the 'admin' role.
 * If users already exist, it blocks the request to prevent creating multiple admins from the login screen.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName, phoneNumber, role } = await request.json();

    // 1. Validate inputs
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

    // 2. Check if any users already exist in Firebase Authentication.
    const userList = await adminAuth.listUsers(1);
    const isFirstUser = userList.users.length === 0;

    // 3. If it's NOT the first user, block the request.
    // This endpoint is ONLY for creating the very first administrator.
    // Subsequent users must be created from the admin panel.
    if (!isFirstUser) {
        return NextResponse.json(
            { error: 'Um administrador já existe. Novos usuários devem ser criados no painel de configurações.' },
            { status: 403 } // 403 Forbidden
        );
    }

    // 4. If it is the first user, create them as an admin.
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      phoneNumber,
    });

    // 5. Set custom claims to make this user an admin and require password change on first login.
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'admin', isFirstLogin: true });

    return NextResponse.json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
    }, { status: 201 }); // 201 Created

  } catch (error: any) {
    console.error('[API Users] Erro ao criar usuário:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'Este e-mail já está em uso.' }, { status: 409 });
    }
    if (error.code === 'auth/invalid-password') {
      return NextResponse.json({ error: 'A senha é inválida. Deve ter no mínimo 8 caracteres.' }, { status: 400 });
    }
    
    // General server error
    return NextResponse.json(
      { error: 'Ocorreu um erro no servidor ao criar o usuário.' },
      { status: 500 }
    );
  }
}
