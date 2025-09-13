
'use server';

import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production');

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
 * Esta função é otimizada para o Edge Runtime e não usa o Firebase Admin SDK.
 */
export async function verifyAuth(request: NextRequest): Promise<JWTPayload | null> {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    // Verifica a assinatura JWT localmente com 'jose'
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });
    
    return payload as JWTPayload;

  } catch (error: any) {
    // Log do erro para depuração no servidor
    if (error.code === 'ERR_JWT_EXPIRED') {
      console.log('Middleware: Token JWT expirado.');
    } else {
      console.error('Middleware: Erro na verificação do token:', error.code, error.message);
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
