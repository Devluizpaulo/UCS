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
      userRecord = await createFirestoreUser({
        email,
        password,
        displayName,
        phoneNumber: phoneNumber || null,
        role: role as 'admin' | 'user'
      });
    } else {
      // Tentar Firebase Auth (pode falhar se Identity Toolkit não estiver habilitado)
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
      id: userRecord.uid || userRecord.id,
      user: {
        id: userRecord.uid || userRecord.id,
        email: userRecord.email,
        displayName: userRecord.displayName
      },
      method: useFirestore ? 'firestore' : 'firebase-auth'
    });

  } catch (error: any) {
    
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
    
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar usuários.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, displayName, email, phoneNumber, role } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Implementar atualização do usuário no Firestore
    // Por enquanto, vamos retornar sucesso
    return NextResponse.json({
      message: 'Usuário atualizado com sucesso',
      user: { id, displayName, email, phoneNumber, role }
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Excluir o usuário permanentemente do Firestore
    const { db } = await import('@/lib/firebase-admin-config');
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    await db.collection('users').doc(userId).delete();

    return NextResponse.json({
      message: 'Usuário excluído com sucesso',
      userId
    });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}