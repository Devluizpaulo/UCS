
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { auth } from './firebase-admin-config';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface JWTPayload {
  uid: string;
  email: string;
  role: string;
  isFirstLogin?: boolean;
  iat: number;
  exp: number;
}

/**
 * Verifica se o usuário está autenticado através do JWT token.
 * Esta função agora também valida o token com o Firebase Admin SDK para maior segurança.
 */
export async function verifyAuth(request: NextRequest): Promise<JWTPayload | null> {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    // 1. Verificar a assinatura JWT localmente
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // 2. Verificar o token com o Firebase Admin para garantir que a sessão não foi revogada
    // Isso previne que tokens JWT válidos, mas de sessões expiradas no Firebase, sejam aceitos.
    const decodedFirebaseToken = await auth.verifyIdToken(token, true);

    // 3. Garantir que o UID do token JWT corresponda ao do token Firebase
    if (decoded.uid !== decodedFirebaseToken.uid) {
        console.warn('Inconsistência de UID entre JWT e Firebase Token.');
        return null;
    }

    return decoded;
  } catch (error: any) {
    // Log do erro para depuração no servidor
    if (error.name === 'TokenExpiredError') {
      console.log('Token JWT expirado.');
    } else if (error.code === 'auth/id-token-revoked' || error.code === 'auth/id-token-expired') {
      console.log('Token do Firebase expirado ou revogado.');
    } else {
      console.error('Erro na verificação do token:', error.name, error.message);
    }
    return null;
  }
}

/**
 * Verifica se o usuário tem permissão de administrador
 */
export async function verifyAdminAuth(request: NextRequest): Promise<JWTPayload | null> {
  const user = await verifyAuth(request);
  
  if (!user || user.role !== 'admin') {
    return null;
  }
  
  return user;
}

/**
 * Extrai informações do usuário do token JWT
 */
export async function getCurrentUser(request: NextRequest): Promise<{
  uid: string;
  email: string;
  role: string;
  isFirstLogin?: boolean;
} | null> {
  const user = await verifyAuth(request);
  
  if (!user) {
    return null;
  }
  
  return {
    uid: user.uid,
    email: user.email,
    role: user.role,
    isFirstLogin: user.isFirstLogin
  };
}
