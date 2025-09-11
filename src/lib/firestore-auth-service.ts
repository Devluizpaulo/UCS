'use server';

import { db } from './firebase-admin-config';
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

  // Validações básicas aprimoradas
  if (!email || typeof email !== 'string') {
    throw new Error('Email é obrigatório.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    throw new Error('Formato de email inválido.');
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new Error('A senha deve ter pelo menos 8 caracteres.');
  }

  if (!displayName || typeof displayName !== 'string' || displayName.trim().length < 2) {
    throw new Error('Nome deve ter pelo menos 2 caracteres.');
  }

  if (phoneNumber && typeof phoneNumber === 'string' && phoneNumber.trim().length > 0 && phoneNumber.trim().length < 10) {
    throw new Error('Telefone deve ter pelo menos 10 dígitos.');
  }

  try {
    // Verificar se o email já existe
    const existingUserQuery = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (!existingUserQuery.empty) {
      throw new Error('Este email já está em uso.');
    }

    // Gerar hash da senha
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Criar ID único
    const userId = uuidv4();
    const now = new Date().toISOString();

    // Dados do usuário
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
      updatedAt: now
    };

    // Salvar no Firestore
    await db.collection('users').doc(userId).set(userData);

    // Retornar dados seguros
    return {
      uid: userId,
      email: userData.email,
      displayName: userData.displayName
    };

  } catch (error: any) {
    
    if (error.message.includes('já está em uso') || 
        error.message.includes('inválido') || 
        error.message.includes('obrigatório') ||
        error.message.includes('caracteres')) {
      throw error; // Re-throw validation errors
    }
    
    throw new Error('Erro interno do servidor ao criar usuário.');
  }
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
    // Validações básicas
    if (!email || typeof email !== 'string') {
      return null;
    }

    if (!password || typeof password !== 'string') {
      return null;
    }

    // Buscar usuário por email
    const userQuery = await db.collection('users')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (userQuery.empty) {
      return null; // Usuário não encontrado
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data() as FirestoreUser;

    // Verificar se o usuário está ativo
    if (!userData.isActive) {
      throw new Error('Conta desativada. Entre em contato com o administrador.');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, userData.passwordHash);
    
    if (!isPasswordValid) {
      return null; // Senha incorreta
    }

    // Atualizar último login
    const now = new Date().toISOString();
    await userDoc.ref.update({
      lastLoginAt: now,
      updatedAt: now
    });

    // Retornar dados do usuário autenticado
    return {
      uid: userData.id,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      isFirstLogin: userData.isFirstLogin
    };

  } catch (error: any) {
    
    // Re-propagar erros específicos (como conta desativada)
    if (error.message?.includes('desativada')) {
      throw error;
    }
    
    return null;
  }
}

/**
 * Lista todos os usuários do Firestore
 */
export async function getFirestoreUsers(): Promise<Array<{
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string | null;
  role: string;
  isFirstLogin: boolean;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}>> {
  try {
    const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
    
    return usersSnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreUser;
      return {
        id: data.id,
        email: data.email,
        displayName: data.displayName,
        phoneNumber: data.phoneNumber,
        role: data.role,
        isFirstLogin: data.isFirstLogin,
        isActive: data.isActive,
        lastLoginAt: data.lastLoginAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    });
  } catch (error: any) {
    throw new Error('Erro ao carregar lista de usuários.');
  }
}

/**
 * Atualiza a senha do usuário após primeiro login
 */
export async function updateFirestoreUserPassword(userId: string, newPassword: string): Promise<void> {
  try {
    // Validar nova senha
    if (!newPassword || typeof newPassword !== 'string') {
      throw new Error('A nova senha é obrigatória.');
    }
    if (newPassword.length < 6 || newPassword.length > 8) {
      throw new Error('A nova senha deve ter entre 6 e 8 caracteres.');
    }
    if (!/^[a-zA-Z]+$|^[0-9]+$|^[a-zA-Z0-9]+$/.test(newPassword)) {
      throw new Error('A senha deve conter apenas letras, apenas números, ou letras e números.');
    }

    // Verificar se o usuário existe
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Usuário não encontrado.');
    }

    // Hash da nova senha
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar no Firestore
    const now = new Date().toISOString();
    await db.collection('users').doc(userId).update({
      passwordHash: newPasswordHash,
      isFirstLogin: false, // Marcar como não sendo mais primeiro login
      updatedAt: now
    });


  } catch (error: any) {

    throw error;
  }
}

/**
 * Ativa ou desativa um usuário
 */
export async function toggleFirestoreUserStatus(userId: string, isActive: boolean): Promise<void> {
  try {
    // Verificar se o usuário existe
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Usuário não encontrado.');
    }

    // Atualizar status
    const now = new Date().toISOString();
    await db.collection('users').doc(userId).update({
      isActive,
      updatedAt: now
    });


  } catch (error: any) {

    throw error;
  }
}

/**
 * Busca um usuário por ID
 */
export async function getFirestoreUserById(userId: string): Promise<{
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string | null;
  role: string;
  isFirstLogin: boolean;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
} | null> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return null;
    }

    const data = userDoc.data() as FirestoreUser;
    return {
      id: data.id,
      email: data.email,
      displayName: data.displayName,
      phoneNumber: data.phoneNumber,
      role: data.role,
      isFirstLogin: data.isFirstLogin,
      isActive: data.isActive,
      lastLoginAt: data.lastLoginAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  } catch (error: any) {
    return null;
  }
}