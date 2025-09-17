
'use server';

import { auth as adminAuth, db } from './firebase-admin-config';

interface User {
  id: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  createdAt: string;
  isActive: boolean;
  isFirstLogin: boolean;
  role: 'admin' | 'user';
}

/**
 * ATUALIZAR PERFIL DO USUÁRIO NO AUTH E NO FIRESTORE
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
    
    // Atualiza no Firebase Auth
    await adminAuth.updateUser(uid, updatePayload);
    
    // Atualiza no Firestore
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.update({ displayName, phoneNumber });
    
  } catch (error: any) {
    console.error('Erro ao atualizar perfil no servidor:', error);
    throw new Error('Não foi possível atualizar o perfil. Tente novamente mais tarde.');
  }
}

/**
 * ATUALIZA DADOS COMPLETOS DE UM USUÁRIO (ADMIN)
 */
export async function updateUser(uid: string, data: { displayName: string; phoneNumber?: string | null; role: 'admin' | 'user', isActive: boolean }): Promise<any> {
  if (!uid) {
    throw new Error('UID do usuário é obrigatório.');
  }

  try {
    const { displayName, phoneNumber, role, isActive } = data;
    const updatePayload: { displayName: string; phoneNumber?: string, disabled: boolean } = { 
        displayName,
        disabled: !isActive
    };
    if (phoneNumber) {
      updatePayload.phoneNumber = phoneNumber;
    }

    // 1. Atualiza dados no Firebase Auth
    await adminAuth.updateUser(uid, updatePayload);
    
    // 2. Atualiza a 'role' como uma custom claim no Firebase Auth
    const currentClaims = (await adminAuth.getUser(uid)).customClaims;
    await adminAuth.setCustomUserClaims(uid, { ...currentClaims, role });

    // 3. Atualiza dados no Firestore
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.update({ displayName, phoneNumber, role, isActive });
    
    const updatedUserDoc = await userDocRef.get();
    const userData = updatedUserDoc.data();
    return { id: updatedUserDoc.id, ...userData };

  } catch (error: any) {
    console.error('Erro ao atualizar usuário (admin):', error);
    throw new Error('Não foi possível atualizar os dados do usuário.');
  }
}


/**
 * DELETA UM USUÁRIO DO AUTH E DO FIRESTORE (ADMIN)
 */
export async function deleteUser(uid: string): Promise<void> {
    if (!uid) {
        throw new Error('UID do usuário é obrigatório.');
    }
    try {
        await adminAuth.deleteUser(uid);
        await db.collection('users').doc(uid).delete();
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
  if (!uid) throw new Error('UID do usuário é obrigatório.');

  try {
    // Atualiza a claim no Auth
    const { customClaims } = await adminAuth.getUser(uid);
    await adminAuth.setCustomUserClaims(uid, { ...customClaims, isFirstLogin: false });
    
    // Atualiza o campo no Firestore
    await db.collection('users').doc(uid).update({ isFirstLogin: false });

  } catch (error: any) {
    console.error('Erro ao finalizar primeiro login (claims):', error);
    throw new Error('Não foi possível atualizar o status do usuário.');
  }
}

/**
 * Atualiza apenas a senha no Firebase Auth
 */
export async function updateUserPasswordInAuth(uid: string, newPassword: string): Promise<void> {
    if (!uid) throw new Error('UID do usuário é obrigatório.');
    if (!newPassword) throw new Error('A nova senha é obrigatória.');
    
    try {
        await adminAuth.updateUser(uid, { password: newPassword });
    } catch (error: any) {
        console.error('Erro ao atualizar a senha no Firebase Auth:', error);
        throw new Error('Falha ao atualizar a senha.');
    }
}


/**
 * Server Action para buscar todos os usuários de forma segura.
 */
export async function getUsers(): Promise<User[]> {
    try {
        const usersSnapshot = await db.collection('users').orderBy('displayName').get();
        if (usersSnapshot.empty) return [];
        
        const users: User[] = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                email: data.email,
                displayName: data.displayName,
                phoneNumber: data.phoneNumber,
                createdAt: data.createdAt,
                isActive: data.isActive,
                isFirstLogin: data.isFirstLogin,
                role: data.role,
            };
        });
        return users;
    } catch (error: any) {
        console.error('Erro ao listar usuários (Server Action):', error);
        throw new Error('Falha ao buscar usuários no servidor.');
    }
}

export async function getUserById(uid: string): Promise<User | null> {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) return null;
        
        const data = userDoc.data()!;
        return {
            id: userDoc.id,
            email: data.email,
            displayName: data.displayName,
            phoneNumber: data.phoneNumber,
            createdAt: data.createdAt,
            isActive: data.isActive,
            isFirstLogin: data.isFirstLogin,
            role: data.role,
        };
    } catch (error: any) {
        console.error('Erro ao buscar usuário por ID:', error);
        throw new Error('Falha ao buscar usuário.');
    }
}


/**
 * Cria um novo usuário no Firebase Authentication e um perfil correspondente no Firestore.
 */
export async function createUser(data: {
  email: string;
  password?: string;
  displayName: string;
  phoneNumber?: string | null;
  role: 'admin' | 'user';
}): Promise<any> {
  const { email, password, displayName, phoneNumber, role } = data;

  if (!email || !displayName) throw new Error('Nome e e-mail são obrigatórios.');
  if (!password) throw new Error('A senha é obrigatória para criar um novo usuário.');
  if (password.length < 6) throw new Error('A senha deve ter no mínimo 6 caracteres.');
  
  try {
    // 1. Criar usuário no Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      phoneNumber: phoneNumber || undefined,
      disabled: false,
    });

    // 2. Definir claims customizadas (role, isFirstLogin)
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: role,
      isFirstLogin: true,
    });
    
    // 3. Criar perfil de usuário no Firestore
    const now = new Date().toISOString();
    const userProfile = {
      email: userRecord.email,
      displayName: userRecord.displayName,
      phoneNumber: userRecord.phoneNumber || null,
      role: role,
      isFirstLogin: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null
    };
    
    await db.collection('users').doc(userRecord.uid).set(userProfile);
    
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
    };

  } catch (error: any) {
    console.error('[Profile Service] Erro detalhado ao criar usuário:', error);
    
    if (error.code === 'auth/email-already-exists') {
      throw new Error('Este email já está em uso.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Email inválido.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('A senha é inválida. Deve ter no mínimo 6 caracteres.');
    }
    
    throw new Error(`Erro no servidor: ${error.message || 'Erro desconhecido ao criar usuário'}`);
  }
}
