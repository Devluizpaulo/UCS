
'use server';

import { auth as adminAuth } from './firebase-admin-config';

interface User {
  id: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  createdAt: string;
  isFirstLogin: boolean;
  role: 'admin' | 'user';
}

/**
 * ATUALIZAR PERFIL DO USUÁRIO
 * Esta função é executada exclusivamente no servidor usando o Firebase Admin SDK.
 * @param uid - O ID do usuário a ser atualizado.
 * @param displayName - O novo nome de exibição.
 * @param phoneNumber - O novo número de telefone.
 */
export async function updateUserProfile(uid: string, displayName: string, phoneNumber?: string | null): Promise<void> {
  if (!uid) {
    throw new Error('UID do usuário é obrigatório.');
  }

  try {
    const updatePayload: { displayName: string; phoneNumber?: string } = { displayName };
    if (phoneNumber) {
      updatePayload.phoneNumber = phoneNumber;
    }
    
    // Atualizar no Firebase Authentication (servidor via Admin SDK)
    await adminAuth.updateUser(uid, updatePayload);
    
  } catch (error: any) {
    console.error('Erro ao atualizar perfil no servidor:', error);
    throw new Error('Não foi possível atualizar o perfil. Tente novamente mais tarde.');
  }
}

/**
 * ATUALIZA NOME, TELEFONE E FUNÇÃO DE UM USUÁRIO (ADMIN)
 */
export async function updateUser(uid: string, data: { displayName: string; phoneNumber?: string | null; role: 'admin' | 'user' }): Promise<void> {
  if (!uid) {
    throw new Error('UID do usuário é obrigatório.');
  }

  try {
    const { displayName, phoneNumber, role } = data;
    const updatePayload: { displayName: string; phoneNumber?: string } = { displayName };
    if (phoneNumber) {
      updatePayload.phoneNumber = phoneNumber;
    }

    await adminAuth.updateUser(uid, updatePayload);
    
    const currentClaims = (await adminAuth.getUser(uid)).customClaims;
    await adminAuth.setCustomUserClaims(uid, { ...currentClaims, role });
    
  } catch (error: any) {
    console.error('Erro ao atualizar usuário (admin):', error);
    throw new Error('Não foi possível atualizar os dados do usuário.');
  }
}


/**
 * DELETA UM USUÁRIO (ADMIN)
 */
export async function deleteUser(uid: string): Promise<void> {
    if (!uid) {
        throw new Error('UID do usuário é obrigatório.');
    }
    try {
        await adminAuth.deleteUser(uid);
    } catch (error: any) {
        console.error('Erro ao deletar usuário (admin):', error);
        throw new Error('Não foi possível deletar o usuário.');
    }
}


/**
 * ATUALIZA A CLAIM de `isFirstLogin` PARA FALSE
 * @param uid - O ID do usuário.
 */
export async function completeFirstLogin(uid: string): Promise<void> {
  if (!uid) {
    throw new Error('UID do usuário é obrigatório.');
  }

  try {
    const currentClaims = (await adminAuth.getUser(uid)).customClaims;
    await adminAuth.setCustomUserClaims(uid, { ...currentClaims, isFirstLogin: false });
  } catch (error: any) {
    console.error('Erro ao finalizar primeiro login (claims):', error);
    throw new Error('Não foi possível atualizar o status do usuário.');
  }
}


/**
 * Server Action para buscar todos os usuários de forma segura.
 * @returns {Promise<User[]>} Uma lista de usuários.
 */
export async function getUsers(): Promise<User[]> {
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
        return users;
    } catch (error: any) {
        console.error('Erro ao listar usuários (Server Action):', error);
        throw new Error('Falha ao buscar usuários no servidor.');
    }
}


/**
 * Cria um novo usuário no Firebase Authentication.
 * Se for o primeiro usuário, ele se torna um admin.
 * Caso contrário, a criação de novos usuários só é permitida por um admin (validação a ser feita pelo chamador).
 */
export async function createUser(data: {
  email: string;
  password?: string;
  displayName: string;
  phoneNumber?: string | null;
  role: 'admin' | 'user';
}): Promise<any> {
  const { email, password, displayName, phoneNumber, role } = data;

  if (!email || !displayName) {
    throw new Error('Nome e e-mail são obrigatórios.');
  }
  if (!password) {
      throw new Error('A senha é obrigatória para criar um novo usuário.');
  }
  if (password.length < 8) {
      throw new Error('A senha deve ter pelo menos 8 caracteres.');
  }
  
  try {
    // Prepare user creation data
    const userData: any = {
      email,
      password,
      displayName,
    };

    // Only add phoneNumber if it's provided and not empty
    if (phoneNumber && phoneNumber.trim() !== '') {
      // Basic validation for E.164 format (starts with + and contains only digits)
      const cleanPhone = phoneNumber.trim();
      if (cleanPhone.startsWith('+') && /^\+[1-9]\d{1,14}$/.test(cleanPhone)) {
        userData.phoneNumber = cleanPhone;
      }
      // If phone number is provided but invalid, we'll skip it rather than error
    }

    const userRecord = await adminAuth.createUser(userData);

    // Define as permissões (claims) para o usuário
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: role,
      isFirstLogin: true, // Força a troca de senha no primeiro login
    });
    
    // Retorna um objeto simples e seguro para o cliente
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
    };

  } catch (error: any) {
    console.error('[Profile Service] Erro detalhado ao criar usuário:', {
      code: error.code,
      message: error.message,
      errorInfo: error.errorInfo,
      stack: error.stack
    });
    
    if (error.code === 'auth/email-already-exists') {
      throw new Error('Este email já está em uso.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Email inválido.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('A senha é inválida. Deve ter no mínimo 8 caracteres.');
    } else if (error.message && error.message.includes('Identity Toolkit API')) {
      throw new Error('Erro de configuração: A API Identity Toolkit não está habilitada no projeto Firebase. Entre em contato com o administrador do sistema.');
    } else if (error.message && error.message.includes('PERMISSION_DENIED')) {
      throw new Error('Erro de permissões: O service account não tem as permissões necessárias. Entre em contato com o administrador do sistema.');
    }
    
    // Log do erro completo para debug
    console.error('[Profile Service] Erro completo:', JSON.stringify(error, null, 2));
    throw new Error(`Erro no servidor: ${error.message || 'Erro desconhecido ao criar usuário'}`);
  }
}
