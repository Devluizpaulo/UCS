import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/profile-service';
import { 
  createFirestoreUser, 
  getFirestoreUsers, 
  getFirestoreUserById,
  toggleFirestoreUserStatus,
  updateFirestoreUserPassword 
} from '@/lib/firestore-auth-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      displayName, 
      phoneNumber, 
      role = 'admin',
      useFirestore = true,
      action // Para diferentes ações: 'create', 'toggle-status', 'update-password'
    } = body;

    // Ação para alternar status do usuário
    if (action === 'toggle-status') {
      const { userId, isActive } = body;
      
      if (!userId || typeof isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'ID do usuário e status são obrigatórios.' },
          { status: 400 }
        );
      }

      await toggleFirestoreUserStatus(userId, isActive);
      
      return NextResponse.json({
        message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso!`,
        userId,
        isActive
      });
    }

    // Ação para atualizar senha
    if (action === 'update-password') {
      const { userId, newPassword } = body;
      
      if (!userId || !newPassword) {
        return NextResponse.json(
          { error: 'ID do usuário e nova senha são obrigatórios.' },
          { status: 400 }
        );
      }

      await updateFirestoreUserPassword(userId, newPassword);
      
      return NextResponse.json({
        message: 'Senha atualizada com sucesso!',
        userId
      });
    }

    // Ação padrão: criar usuário
    // Validações básicas
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios.' },
        { status: 400 }
      );
    }

    // Validar role
    if (role && !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Role deve ser "admin" ou "user".' },
        { status: 400 }
      );
    }

    let userRecord;
    
    if (useFirestore) {
      // Usar Firestore como alternativa ao Firebase Auth
      console.log('[API] Criando usuário via Firestore Auth...');
      userRecord = await createFirestoreUser({
        email,
        password,
        displayName,
        phoneNumber: phoneNumber || null,
        role: role as 'admin' | 'user'
      });
    } else {
      // Tentar Firebase Auth (pode falhar se Identity Toolkit não estiver habilitado)
      console.log('[API] Tentando criar usuário via Firebase Auth...');
      userRecord = await createUser({
        email,
        password,
        displayName,
        phoneNumber: phoneNumber || null,
        role: role as 'admin' | 'user'
      });
    }

    return NextResponse.json({
      message: 'Usuário criado com sucesso!',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      },
      method: useFirestore ? 'firestore' : 'firebase-auth'
    });

  } catch (error: any) {
    console.error('Erro na API de usuários:', error);
    
    // Retornar erro específico para validações
    const status = error.message?.includes('obrigatório') || 
                   error.message?.includes('inválido') || 
                   error.message?.includes('caracteres') ||
                   error.message?.includes('encontrado') ? 400 : 500;
    
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor.' },
      { status }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    // Se foi fornecido um ID, buscar usuário específico
    if (userId) {
      const user = await getFirestoreUserById(userId);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Usuário não encontrado.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Usuário encontrado com sucesso!',
        user
      });
    }

    // Listar todos os usuários do Firestore
    const users = await getFirestoreUsers();
    
    return NextResponse.json({
      message: 'Lista de usuários carregada com sucesso!',
      users,
      total: users.length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length
    });
  } catch (error: any) {
    console.error('Erro ao buscar usuários:', error);
    
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar usuários.' },
      { status: 500 }
    );
  }
}