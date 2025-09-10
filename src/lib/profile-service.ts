
'use server';

import { getAuth, updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from './firebase-config';
import { auth as adminAuth } from './firebase-admin-config';

// Inicialização segura do Firebase no lado do cliente
const getClientAuth = () => {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
};

// ATUALIZAR PERFIL DO USUÁRIO
export async function updateUserProfile(displayName: string, phoneNumber?: string | null): Promise<void> {
  const auth = getClientAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Usuário não autenticado.');
  }

  try {
    // Atualizar no Firebase Authentication (cliente)
    await updateProfile(user, { displayName });

    // Atualizar no Firebase Authentication (servidor via Admin SDK)
    await adminAuth.updateUser(user.uid, { displayName, phoneNumber });
    
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);
    throw new Error('Não foi possível atualizar o perfil. Tente novamente mais tarde.');
  }
}

// ALTERAR SENHA DO USUÁRIO
export async function changeUserPassword(currentPassword: string, newPassword: string): Promise<void> {
  const auth = getClientAuth();
  const user = auth.currentUser;

  if (!user || !user.email) {
    throw new Error('Usuário não autenticado ou sem e-mail associado.');
  }

  try {
    // Reautenticar o usuário com a senha atual para confirmar a identidade
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Se a reautenticação for bem-sucedida, atualizar a senha
    await updatePassword(user, newPassword);

    // CRÍTICO: Atualiza a custom claim para remover o status de "primeiro login"
    // Mantém as outras claims que o usuário possa ter.
    const currentClaims = (await adminAuth.getUser(user.uid)).customClaims;
    await adminAuth.setCustomUserClaims(user.uid, { ...currentClaims, isFirstLogin: false });


  } catch (error: any) {
    console.error('Erro ao alterar senha:', error);
    if (error.code === 'auth/wrong-password') {
      throw new Error('A senha atual está incorreta.');
    }
    if (error.code === 'auth/weak-password') {
      throw new Error('A nova senha é muito fraca. Tente uma mais forte.');
    }
    throw new Error('Não foi possível alterar a senha. Tente novamente mais tarde.');
  }
}
