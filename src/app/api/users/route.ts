
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin-config';

// POST /api/users - Create the first admin user
export async function POST(request: NextRequest) {
  try {
    // 1. Check if any users already exist.
    const userList = await auth.listUsers(1);
    if (userList.users.length > 0) {
      return NextResponse.json(
        { error: 'Um usuário administrador já existe. Não é possível criar outro.' },
        { status: 409 } // 409 Conflict
      );
    }

    // 2. If no users exist, proceed to create the first admin.
    const { email, password, displayName, phoneNumber } = await request.json();

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

    // 3. Create the user in Firebase Auth.
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      phoneNumber,
    });

    // 4. Set custom claim to make this user an admin and require password change.
    await auth.setCustomUserClaims(userRecord.uid, { role: 'admin', isFirstLogin: true });

    return NextResponse.json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
    }, { status: 201 }); // 201 Created

  } catch (error: any) {
    console.error('[API Users] Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: error.message || 'Ocorreu um erro no servidor.' },
      { status: 500 }
    );
  }
}
