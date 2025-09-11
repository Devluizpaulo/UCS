import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

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
 * Verifica se o usuário está autenticado através do JWT token
 */
export function verifyAuth(request: NextRequest): JWTPayload | null {
  try {
    // Obter token do cookie
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    return decoded;
  } catch (error: any) {
    console.error('Erro na verificação do token:', error);
    return null;
  }
}

/**
 * Verifica se o usuário tem permissão de administrador
 */
export function verifyAdminAuth(request: NextRequest): JWTPayload | null {
  const user = verifyAuth(request);
  
  if (!user || user.role !== 'admin') {
    return null;
  }
  
  return user;
}

/**
 * Extrai informações do usuário do token JWT
 */
export function getCurrentUser(request: NextRequest): {
  uid: string;
  email: string;
  role: string;
  isFirstLogin?: boolean;
} | null {
  const user = verifyAuth(request);
  
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