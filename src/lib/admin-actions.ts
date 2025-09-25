
'use server';

import { auth } from '@/lib/firebase-admin-config';
import type { UserRecord } from 'firebase-admin/auth';
import { revalidatePath } from 'next/cache';

// --- AÇÕES DE USUÁRIO ---

/**
 * Busca todos os usuários do Firebase Authentication.
 * @returns Uma lista de registros de usuário.
 */
export async function getUsers(): Promise<UserRecord[]> {
  try {
    const userRecords = await auth.listUsers();
    // Mapeia para um objeto simples para evitar problemas de serialização com o cliente
    return userRecords.users.map(user => user.toJSON() as UserRecord);
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Cria um novo usuário no Firebase Authentication.
 * @param userData - Dados do usuário (email, senha, etc.).
 */
export async function createUser(userData: { email: string; disabled?: boolean }): Promise<UserRecord> {
  try {
    // Gera uma senha aleatória e segura, pois o campo é obrigatório.
    // Esta senha não será usada pelo usuário final.
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';

    const userRecord = await auth.createUser({
      email: userData.email,
      password: tempPassword,
      disabled: userData.disabled || false,
      emailVerified: false, // Opcional: força o usuário a verificar o e-mail.
    });

    // Gera o link para o usuário definir a própria senha.
    // O Firebase enviará um e-mail automaticamente se o template estiver ativo no console.
    await auth.generatePasswordResetLink(userRecord.email as string);

    revalidatePath('/admin/users'); // Invalida o cache da página de usuários
    return userRecord.toJSON() as UserRecord;
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === 'auth/email-already-exists') {
        throw new Error('Este e-mail já está em uso por outro usuário.');
    }
    throw new Error('Falha ao criar o usuário.');
  }
}

/**
 * Atualiza um usuário existente no Firebase Authentication.
 * @param uid - O UID do usuário a ser atualizado.
 * @param userData - Os dados a serem atualizados.
 */
export async function updateUser(uid: string, userData: { email?: string; password?: string; disabled?: boolean }): Promise<UserRecord> {
  try {
    const dataToUpdate: any = {
        disabled: userData.disabled,
    };
    if (userData.email) dataToUpdate.email = userData.email;
    if (userData.password) dataToUpdate.password = userData.password;
    
    const userRecord = await auth.updateUser(uid, dataToUpdate);
    revalidatePath('/admin/users');
    return userRecord.toJSON() as UserRecord;
  } catch (error) {
    console.error(`Error updating user ${uid}:`, error);
    throw new Error('Falha ao atualizar o usuário.');
  }
}

/**
 * Exclui um usuário do Firebase Authentication.
 * @param uid - O UID do usuário a ser excluído.
 */
export async function deleteUser(uid: string): Promise<void> {
  try {
    await auth.deleteUser(uid);
    revalidatePath('/admin/users');
  } catch (error) {
    console.error(`Error deleting user ${uid}:`, error);
    throw new Error('Falha ao excluir o usuário.');
  }
}
