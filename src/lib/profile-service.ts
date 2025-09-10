
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
