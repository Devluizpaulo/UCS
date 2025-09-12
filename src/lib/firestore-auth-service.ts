
'use server';

import { db, auth as adminAuth } from './firebase-admin-config';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

interface FirestoreUser {
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string | null;
  passwordHash: string;
  role: 'admin' | 'user';
  isFirstLogin: boolean;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cria um usuário no Firestore como alternativa ao Firebase Auth
 */
export async function createFirestoreUser(data: {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string | null;
  role: 'admin' | 'user';
}): Promise<{ uid: string; email: string; displayName: string }> {
  const { email, password, displayName, phoneNumber, role } = data;

  if (!email || !password || !displayName) {
    throw new Error('Email, senha e nome são obrigatórios.');
  }

  const existingUserQuery = await db.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
  if (!existingUserQuery.empty) {
    throw new Error('Este email já está em uso.');
  }

  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const userId = uuidv4();
  const now = new Date().toISOString();

  const userData: FirestoreUser = {
    id: userId,
    email: email.toLowerCase().trim(),
    displayName: displayName.trim(),
    phoneNumber: phoneNumber?.trim() || null,
    passwordHash,
    role,
    isFirstLogin: true,
    isActive: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection('users').doc(userId).set(userData);

  try {
      await adminAuth.setCustomUserClaims(userId, { role, isFirstLogin: true });
  } catch (e) {
      // Ignore if user does not exist in Firebase Auth yet, claims will be set on first real login.
  }

  return { uid: userId, email: userData.email, displayName: userData.displayName };
}


/**
 * Autentica um usuário usando email e senha
 */
export async function authenticateFirestoreUser(email: string, password: string): Promise<{
  uid: string;
  email: string;
  displayName: string;
  role: string;
  isFirstLogin: boolean;
} | null> {
  try {
    if (!email || !password) return null;

    const userQuery = await db.collection('users').where('email', '==', email.toLowerCase().trim()).limit(1).get();
    if (userQuery.empty) return null;

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data() as FirestoreUser;

    if (!userData.isActive) {
      throw new Error('Conta desativada. Entre em contato com o administrador.');
    }

    const isPasswordValid = await bcrypt.compare(password, userData.passwordHash);
    if (!isPasswordValid) return null;

    const now = new Date().toISOString();
    await userDoc.ref.update({ lastLoginAt: now, updatedAt: now });

    return {
      uid: userData.id,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      isFirstLogin: userData.isFirstLogin,
    };
  } catch (error: any) {
    if (error.message?.includes('desativada')) throw error;
    return null;
  }
}

/**
 * Lista todos os usuários do Firestore
 */
export async function getFirestoreUsers(): Promise<Array<any>> {
  const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
  return usersSnapshot.docs.map(doc => {
    const { passwordHash, ...userData } = doc.data(); // Exclude password hash
    return { id: doc.id, ...userData };
  });
}

/**
 * Atualiza a senha do usuário com verificação da senha atual
 */
export async function updateUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const userDocRef = db.collection('users').doc(userId);
  const userDoc = await userDocRef.get();
  if (!userDoc.exists) throw new Error('Usuário não encontrado.');

  const userData = userDoc.data() as FirestoreUser;
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.passwordHash);
  if (!isCurrentPasswordValid) throw new Error('A senha atual está incorreta.');

  if (!newPassword || newPassword.length < 6) throw new Error('A nova senha deve ter no mínimo 6 caracteres.');

  const newPasswordHash = await bcrypt.hash(newPassword, 12);
  const now = new Date().toISOString();

  await userDocRef.update({
    passwordHash: newPasswordHash,
    isFirstLogin: false,
    updatedAt: now,
  });

  // Also update claims in Firebase Auth if user exists there
  try {
      const user = await adminAuth.getUser(userId);
      await adminAuth.setCustomUserClaims(userId, { ...user.customClaims, isFirstLogin: false });
  } catch(e) {
      // User might not exist in Auth if created only in Firestore, which is fine.
  }
}

/**
 * Ativa ou desativa um usuário
 */
export async function toggleFirestoreUserStatus(userId: string, isActive: boolean): Promise<void> {
  const userDocRef = db.collection('users').doc(userId);
  if (!(await userDocRef.get()).exists) throw new Error('Usuário não encontrado.');
  await userDocRef.update({ isActive, updatedAt: new Date().toISOString() });
}

/**
 * Busca um usuário por ID
 */
export async function getFirestoreUserById(userId: string): Promise<any | null> {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) return null;
  const { passwordHash, ...userData } = userDoc.data() as FirestoreUser;
  return { id: userDoc.id, ...userData };
}

/**
* Marca o primeiro login como concluído no Firestore.
*/
export async function completeFirstLoginInFirestore(uid: string): Promise<void> {
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.update({ isFirstLogin: false });
}
