import crypto from 'crypto';
import { Buffer } from 'buffer';

/**
 * Utilitários para geração e validação de tokens de confirmação de email
 */

/**
 * Gera um token de confirmação de email seguro
 * @param userId - ID do usuário
 * @returns Token no formato userId:timestamp:hash
 */
export function generateEmailConfirmationToken(userId: string): string {
  const timestamp = Date.now().toString();
  const secret = process.env.EMAIL_TOKEN_SECRET;
  if (!secret) throw new Error('Missing EMAIL_TOKEN_SECRET environment variable.');

  const hash = crypto
    .createHmac('sha256', secret)
    .update(`${userId}:${timestamp}`)
    .digest('hex')
    .substring(0, 16); // Primeiros 16 caracteres

  return `${userId}:${timestamp}:${hash}`;
}

/**
 * Valida um token de confirmação de email
 * @param token - Token a ser validado
 * @returns { valid: boolean, userId?: string, expired?: boolean, error?: string }
 */
export function validateEmailConfirmationToken(token: string): {
  valid: boolean;
  userId?: string;
  expired?: boolean;
  error?: string;
} {
  try {
    const tokenParts = token.split(':');
    if (tokenParts.length !== 3) {
      return { valid: false, error: 'Formato de token inválido' };
    }

    const [userId, timestamp, hash] = tokenParts;

    // Verificar se o token não expirou (24 horas)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    const expirationTime = 24 * 60 * 60 * 1000; // 24 horas

    if (now - tokenTime > expirationTime) {
      return { valid: false, userId, expired: true, error: 'Token expirado' };
    }

    // Verificar hash do token
    const secret = process.env.EMAIL_TOKEN_SECRET;
    if (!secret) throw new Error('Missing EMAIL_TOKEN_SECRET environment variable.');
    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(`${userId}:${timestamp}`)
      .digest('hex')
      .substring(0, 16);

    if (hash !== expectedHash) {
      return { valid: false, userId, error: 'Hash do token inválido' };
    }

    return { valid: true, userId };
  } catch (error) {
    return {
      valid: false,
      error: `Erro ao validar token: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Gera URL de confirmação de email
 * @param userId - ID do usuário
 * @param baseUrl - URL base da aplicação
 * @returns URL completa para confirmação
 */
export function generateEmailConfirmationUrl(userId: string, baseUrl?: string): string {
  const token = generateEmailConfirmationToken(userId);
  const siteUrl =
    baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.prolineauto.com.br';

  return `${siteUrl}/api/confirm-email?token=${encodeURIComponent(token)}`;
}

/**
 * Extrai informações do token sem validar a assinatura
 * @param token - Token a ser analisado
 * @returns { userId?: string, timestamp?: number, hash?: string }
 */
export function parseEmailConfirmationToken(token: string): {
  userId?: string;
  timestamp?: number;
  hash?: string;
} {
  try {
    const [userId, timestampStr, hash] = token.split(':');
    const timestamp = parseInt(timestampStr);

    return { userId, timestamp, hash };
  } catch {
    return {};
  }
}
