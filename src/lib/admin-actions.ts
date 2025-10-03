
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin-config';
import type { UserRecord } from 'firebase-admin/auth';
import type { AppUserRecord } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase-admin/firestore';
import { headers } from 'next/headers';

// --- AÇÕES DE USUÁRIO ---

/**
 * Helper para obter a URL base da requisição atual.
 * @returns A URL base (ex: https://seu-dominio.com)
 */
function getBaseUrl() {
  const host = headers().get('host');
  const protocol = headers().get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}

/**
 * Busca todos os usuários do Firebase Authentication e verifica se são admins.
 * @returns Uma lista de registros de usuário com a propriedade `isAdmin`.
 */
export async function getUsers(): Promise<AppUserRecord[]> {
  const { auth, db } = await getFirebaseAdmin();
  try {
    const userRecords = await auth.listUsers();
    
    // Busca todos os documentos de admin de uma vez para otimização
    const adminDocs = await db.collection('roles_admin').get();
    const adminUids = new Set(adminDocs.docs.map(doc => doc.id));
    
    // Mapeia para um objeto simples para evitar problemas de serialização com o cliente
    const users = userRecords.users.map(user => {
        const userJson = user.toJSON() as UserRecord;
        return {
            ...userJson,
            isAdmin: adminUids.has(user.uid),
        };
    });

    return users as AppUserRecord[];

  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Cria um novo usuário no Firebase Authentication.
 * @param userData - Dados do usuário (email, nome, etc.).
 */
export async function createUser(userData: {
  email: string;
  displayName: string;
  phoneNumber?: string;
  disabled?: boolean;
}): Promise<{ user: UserRecord, link: string }> {
  const { auth } = await getFirebaseAdmin();
  try {
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';

    const userPayload: any = {
      email: userData.email,
      displayName: userData.displayName,
      password: tempPassword,
      disabled: userData.disabled || false,
      emailVerified: true,
    };

    if (userData.phoneNumber) {
      userPayload.phoneNumber = userData.phoneNumber;
    }

    const userRecord = await auth.createUser(userPayload);
    
    // Constrói a URL de ação dinamicamente
    const actionCodeSettings = {
        url: `${getBaseUrl()}/login`, // URL para onde o usuário volta após redefinir
        handleCodeInApp: true,
    };

    const link = await auth.generatePasswordResetLink(userRecord.email as string, actionCodeSettings);

    revalidatePath('/admin/users');
    return { user: userRecord.toJSON() as UserRecord, link };
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === 'auth/email-already-exists') {
        throw new Error('Este e-mail já está em uso por outro usuário.');
    }
     if (error.code === 'auth/invalid-phone-number') {
      throw new Error('O número de telefone fornecido é inválido. Use o padrão internacional (ex: +5511999998888).');
    }
     if (error.code === 'auth/phone-number-already-exists') {
      throw new Error('Este número de telefone já está em uso por outro usuário.');
    }
    throw new Error('Falha ao criar o usuário: ' + (error.message || 'Erro desconhecido'));
  }
}

/**
 * Atualiza um usuário existente no Firebase Authentication.
 * @param uid - O UID do usuário a ser atualizado.
 * @param userData - Os dados a serem atualizados.
 */
export async function updateUser(uid: string, userData: {
  email?: string;
  password?: string;
  disabled?: boolean;
  displayName?: string;
  phoneNumber?: string;
}): Promise<UserRecord> {
  const { auth } = await getFirebaseAdmin();
  try {
    const dataToUpdate: any = {
        disabled: userData.disabled,
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber || undefined, // Envia undefined se for vazio para remover o número
    };
    if (userData.email) dataToUpdate.email = userData.email;
    if (userData.password) dataToUpdate.password = userData.password;
    
    const userRecord = await auth.updateUser(uid, dataToUpdate);
    revalidatePath('/admin/users');
    return userRecord.toJSON() as UserRecord;
  } catch (error: any)
  {
    console.error(`Error updating user ${uid}:`, error);
     if (error.code === 'auth/invalid-phone-number') {
      throw new Error('O número de telefone fornecido é inválido. Use o formato E.164 (ex: +5511999998888).');
    }
    throw new Error('Falha ao atualizar o usuário: ' + (error.message || 'Erro desconhecido'));
  }
}

/**
 * Exclui um usuário do Firebase Authentication.
 * @param uid - O UID do usuário a ser excluído.
 */
export async function deleteUser(uid: string): Promise<void> {
  const { auth } = await getFirebaseAdmin();
  try {
    await auth.deleteUser(uid);
    revalidatePath('/admin/users');
  } catch (error) {
    console.error(`Error deleting user ${uid}:`, error);
    throw new Error('Falha ao excluir o usuário.');
  }
}

/**
 * Gera um novo link de reset de senha para um usuário.
 * @param uid - O UID do usuário.
 */
export async function resetUserPassword(uid: string): Promise<{ link: string }> {
  const { auth } = await getFirebaseAdmin();
  try {
    const userRecord = await auth.getUser(uid);
    if (!userRecord.email) {
      throw new Error('O usuário não possui um e-mail cadastrado para redefinir a senha.');
    }
    
    // Constrói a URL de ação dinamicamente
    const actionCodeSettings = {
        url: `${getBaseUrl()}/login`, // URL para onde o usuário volta após redefinir
        handleCodeInApp: true,
    };
    const link = await auth.generatePasswordResetLink(userRecord.email, actionCodeSettings);

    return { link };
  } catch (error: any) {
    console.error(`Error generating password reset link for user ${uid}:`, error);
    throw new Error('Falha ao gerar o link de redefinição de senha.');
  }
}

/**
 * Concede permissões de administrador a um usuário.
 * @param uid - O UID do usuário a ser promovido.
 */
export async function setAdminRole(uid: string): Promise<void> {
  const { db } = await getFirebaseAdmin();
  try {
    // Cria um documento na coleção 'roles_admin' com o UID do usuário.
    // O documento pode ser vazio, sua existência é o que concede o acesso.
    await db.collection('roles_admin').doc(uid).set({ isAdmin: true });
    revalidatePath('/admin/users');
  } catch (error) {
    console.error(`Error setting admin role for user ${uid}:`, error);
    throw new Error('Falha ao conceder permissões de administrador.');
  }
}

/**
 * Remove as permissões de administrador de um usuário.
 * @param uid - O UID do usuário a ser rebaixado.
 */
export async function removeAdminRole(uid: string): Promise<void> {
  const { db } = await getFirebaseAdmin();
  try {
    await db.collection('roles_admin').doc(uid).delete();
    revalidatePath('/admin/users');
  } catch (error) {
    console.error(`Error removing admin role for user ${uid}:`, error);
    throw new Error('Falha ao remover permissões de administrador.');
  }
}

/**
 * Salva o consentimento LGPD para um usuário.
 * @param uid - O UID do usuário.
 */
export async function acceptLgpd(uid: string): Promise<void> {
  const { db } = await getFirebaseAdmin();
  try {
    const userRef = db.collection('users').doc(uid);
    await userRef.set({
        lgpdAccepted: true,
        lgpdAcceptedAt: Timestamp.now(),
    }, { merge: true });
    revalidatePath('/dashboard'); // Revalida o caminho para garantir que a UI reflita a mudança
  } catch (error: any) {
    console.error(`Error accepting LGPD for user ${uid}:`, error);
    throw new Error('Falha ao salvar o consentimento LGPD.');
  }
}
