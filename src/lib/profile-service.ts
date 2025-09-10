
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
 * ALTERAR SENHA DO USUÁRIO (Lado do Servidor, se necessário - geralmente feito no cliente)
 * Esta função deve ser usada com cuidado, pois não reautentica o usuário.
 * É mais seguro fazer a alteração de senha no lado do cliente.
 * @param uid - O ID do usuário.
 * @param newPassword - A nova senha.
 */
export async function changeUserPasswordAdmin(uid: string, newPassword: string): Promise<void> {
   if (!uid) {
    throw new Error('UID do usuário é obrigatório.');
  }
   if (!newPassword || newPassword.length < 8) {
    throw new Error('A nova senha deve ter pelo menos 8 caracteres.');
  }

  try {
    await adminAuth.updateUser(uid, { password: newPassword });
  } catch (error: any) {
    console.error('Erro ao alterar senha (admin):', error);
    throw new Error('Não foi possível alterar a senha administrativamente.');
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

    