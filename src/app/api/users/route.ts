
import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUsers, getUserById, updateUser, deleteUser } from '@/lib/profile-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      displayName, 
      phoneNumber, 
      role = 'user',
    } = body;

    const userRecord = await createUser({
      email,
      password,
      displayName,
      phoneNumber,
      role
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
    console.error('[API /users POST] Error:', error);
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
      const user = await getUserById(userId);
      if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Usuário encontrado com sucesso!', user });
    }

    const users = await getUsers();
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
    const { id, displayName, phoneNumber, role, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    const updatedUser = await updateUser(id, { displayName, phoneNumber, role, isActive });

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

    await deleteUser(userId);

    return NextResponse.json({
      message: 'Usuário excluído com sucesso',
      userId
    });
  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
