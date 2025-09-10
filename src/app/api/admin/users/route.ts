
import { NextResponse } from 'next/server';
import { auth as adminAuth } from '@/lib/firebase-admin-config';

// Define a interface para o objeto de usuário que será retornado
interface User {
  id: string;
  email: string | undefined;
  displayName: string | undefined;
  phoneNumber: string | undefined;
  createdAt: string;
  isFirstLogin: boolean;
  role: 'admin' | 'user';
}

/**
 * GET /api/admin/users
 * Lista todos os usuários do Firebase Authentication.
 * Esta rota deve ser protegida para ser acessada apenas por administradores.
 */
export async function GET() {
  try {
    const listUsersResult = await adminAuth.listUsers();
    
    const users: User[] = listUsersResult.users.map(userRecord => ({
      id: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      phoneNumber: userRecord.phoneNumber,
      createdAt: userRecord.metadata.creationTime,
      isFirstLogin: userRecord.customClaims?.isFirstLogin === true,
      role: userRecord.customClaims?.role === 'admin' ? 'admin' : 'user',
    }));

    return NextResponse.json(users);

  } catch (error: any) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar usuários', details: error.message },
      { status: 500 }
    );
  }
}
