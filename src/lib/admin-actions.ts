'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin-config';
import type { UserRecord } from 'firebase-admin/auth';
import type { AppUserRecord } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase-admin/firestore';

// --- AÇÕES DE USUÁRIO ---

/**
 * Helper para obter a URL base da requisição atual.
 * Prioriza o domínio de produção exposto pela Vercel (VERCEL_URL) se disponível.
 * @returns A URL base (ex: https://seu-projeto.vercel.app)
 */
function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:9002';
}

/**
 * Busca todos os usuários do Firebase Authentication e verifica se são admins.
 * Mapeia para um objeto estritamente serializável para evitar erros no Next.js 15.
 */
export async function getUsers(): Promise<AppUserRecord[]> {
  try {
    const { auth, db } = await getFirebaseAdmin();
    const userRecords = await auth.listUsers();
    
    // Busca todos os documentos de admin de uma vez para otimização
    const adminDocs = await db.collection('roles_admin').get();
    const adminUids = new Set(adminDocs.docs.map(doc => doc.id));
    
    // Mapeia para um objeto plano (POJO) removendo métodos e classes não serializáveis
    const users: AppUserRecord[] = userRecords.users.map(user => {
        return {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            phoneNumber: user.phoneNumber || '',
            photoURL: user.photoURL || undefined,
            disabled: user.disabled,
            metadata: {
                creationTime: user.metadata.creationTime,
                lastSignInTime: user.metadata.lastSignInTime || null,
            },
            isAdmin: adminUids.has(user.uid),
        };
    });

    return users;

  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Cria um novo usuário no Firebase Authentication.
 */
export async function createUser(userData: {
  email: string;
  displayName: string;
  phoneNumber?: string;
  disabled?: boolean;
}): Promise<{ user: any, link: string }> {
  try {
    const { auth, db } = await getFirebaseAdmin();
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

    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      displayName: userData.displayName,
      email: userData.email.toLowerCase().trim(),
      phoneNumber: userData.phoneNumber || '',
      role: 'seller',
      isActive: !(userData.disabled || false),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    const baseUrl = getBaseUrl();
    const actionCodeSettings = {
        url: `${baseUrl}/login`,
        handleCodeInApp: true,
    };

    const link = await auth.generatePasswordResetLink(userRecord.email as string, actionCodeSettings);

    revalidatePath('/admin/users');
    
    // Retorna apenas os campos necessários e serializáveis
    return { 
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }, 
      link 
    };
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === 'auth/email-already-exists') {
        throw new Error('Este e-mail já está em uso por outro usuário.');
    }
    throw new Error('Falha ao criar o usuário: ' + (error.message || 'Erro desconhecido'));
  }
}

/**
 * Atualiza um usuário existente.
 */
export async function updateUser(uid: string, userData: {
  email?: string;
  password?: string;
  disabled?: boolean;
  displayName?: string;
  phoneNumber?: string;
}): Promise<any> {
  try {
    const { auth, db } = await getFirebaseAdmin();
    const dataToUpdate: any = {
        disabled: userData.disabled,
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber || undefined,
    };
    if (userData.email) dataToUpdate.email = userData.email;
    if (userData.password) dataToUpdate.password = userData.password;
    
    const userRecord = await auth.updateUser(uid, dataToUpdate);

    const profilePatch: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (typeof userData.displayName !== 'undefined') profilePatch.displayName = userData.displayName;
    if (typeof userData.email !== 'undefined') profilePatch.email = userData.email.toLowerCase().trim();
    if (typeof userData.phoneNumber !== 'undefined') profilePatch.phoneNumber = userData.phoneNumber || '';
    if (typeof userData.disabled !== 'undefined') profilePatch.isActive = !userData.disabled;

    await db.collection('users').doc(uid).set(profilePatch, { merge: true });

    revalidatePath('/admin/users');
    return { uid: userRecord.uid, email: userRecord.email };
  } catch (error: any) {
    console.error(`Error updating user ${uid}:`, error);
    throw new Error('Falha ao atualizar o usuário: ' + (error.message || 'Erro desconhecido'));
  }
}

/**
 * Exclui um usuário do Firebase Authentication.
 */
export async function deleteUser(uid: string): Promise<void> {
  try {
    const { auth, db } = await getFirebaseAdmin();
    await auth.deleteUser(uid);
    await Promise.allSettled([
      db.collection('roles_admin').doc(uid).delete(),
      db.collection('users').doc(uid).delete(),
    ]);
    revalidatePath('/admin/users');
  } catch (error) {
    console.error(`Error deleting user ${uid}:`, error);
    throw new Error('Falha ao excluir o usuário.');
  }
}

/**
 * Gera um novo link de reset de senha para um usuário.
 */
export async function resetUserPassword(uid: string): Promise<{ link: string }> {
  try {
    const { auth } = await getFirebaseAdmin();
    const userRecord = await auth.getUser(uid);
    if (!userRecord.email) {
      throw new Error('O usuário não possui um e-mail cadastrado para redefinir a senha.');
    }
    
    const baseUrl = getBaseUrl();
    const actionCodeSettings = {
        url: `${baseUrl}/login`,
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
 */
export async function setAdminRole(uid: string): Promise<void> {
  try {
    const { db } = await getFirebaseAdmin();
    await db.collection('roles_admin').doc(uid).set({ isAdmin: true });
    await db.collection('users').doc(uid).set({
      id: uid,
      role: 'admin',
      isActive: true,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    revalidatePath('/admin/users');
  } catch (error) {
    console.error(`Error setting admin role for user ${uid}:`, error);
    throw new Error('Falha ao conceder permissões de administrador.');
  }
}

/**
 * Remove as permissões de administrador de um usuário.
 */
export async function removeAdminRole(uid: string): Promise<void> {
  try {
    const { db } = await getFirebaseAdmin();
    await db.collection('roles_admin').doc(uid).delete();
    await db.collection('users').doc(uid).set({
      id: uid,
      role: 'seller',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    revalidatePath('/admin/users');
  } catch (error) {
    console.error(`Error removing admin role for user ${uid}:`, error);
    throw new Error('Falha ao remover permissões de administrador.');
  }
}

/**
 * Salva o consentimento LGPD para um usuário.
 */
export async function acceptLgpd(uid: string): Promise<void> {
  try {
    const { db } = await getFirebaseAdmin();
    const userRef = db.collection('users').doc(uid);
    await userRef.set({
        lgpdAccepted: true,
        lgpdAcceptedAt: Timestamp.now(),
    }, { merge: true });
    revalidatePath('/dashboard');
  } catch (error: any) {
    console.error(`Error accepting LGPD for user ${uid}:`, error);
    throw new Error('Falha ao salvar o consentimento LGPD.');
  }
}
