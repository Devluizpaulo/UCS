
import { NextRequest, NextResponse } from 'next/server';
import { 
  createFirestoreUser, 
  getFirestoreUsers, 
  getFirestoreUserById,
  toggleFirestoreUserStatus,
  updateFirestoreUser,
  deleteFirestoreUser,
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
    } = body;

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios.' },
        { status: 400 }
      );
    }
    if (role && !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Role deve ser "admin" ou "user".' },
        { status: 400 }
      );
    }

    const userRecord = await createFirestoreUser({
      email,
      password,
      displayName,
      phoneNumber: phoneNumber || null,
      role: role as 'admin' | 'user'
    });

    return NextResponse.json({
      message: 'Usuário criado com sucesso!',
      id: userRecord.uid,
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      },
    });

  } catch (error: any) {
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

    if (userId) {
      const user = await getFirestoreUserById(userId);
      if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Usuário encontrado com sucesso!', user });
    }

    const users = await getFirestoreUsers();
    return NextResponse.json({
      message: 'Lista de usuários carregada com sucesso!',
      users,
      total: users.length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar usuários.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, displayName, phoneNumber, role } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    const updatedUser = await updateFirestoreUser(id, { displayName, phoneNumber, role });

    return NextResponse.json({
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    await deleteFirestoreUser(userId);

    return NextResponse.json({
      message: 'Usuário excluído com sucesso',
      userId
    });
  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
