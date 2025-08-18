/**
 * Utilitários para sanitização e validação de entrada
 * Previne ataques XSS e injections
 */

/**
 * Remove caracteres perigosos para XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers (onclick=, onload=, etc)
    .replace(/&lt;script|&lt;\/script/gi, '') // Remove tags script codificadas
    .trim();
}

/**
 * Sanitiza um objeto removendo campos perigosos e sanitizando strings
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = value.map(item =>
        typeof item === 'string' ? sanitizeString(item) : item
      );
    }
  }

  return sanitized;
}

/**
 * Valida email de forma mais rigorosa
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321 limit
}

/**
 * Valida telefone (formato brasileiro)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\(\d{2}\)\s\d{1}\s?\d{4}-\d{4}$/;
  return phoneRegex.test(phone);
}

/**
 * Valida CEP (formato brasileiro)
 */
export function validateCEP(cep: string): boolean {
  const cepRegex = /^\d{5}-?\d{3}$/;
  return cepRegex.test(cep);
}

/**
 * Valida CPF
 */
export function validateCPF(cpf: string): boolean {
  // Aceita com ou sem máscara: mantém apenas dígitos
  const cleanCPF = (cpf || '').replace(/\D/g, '');
  // Deve ter 11 dígitos
  if (cleanCPF.length !== 11) return false;

  // Verifica se não são todos números iguais
  if (/^(\d)\1+$/.test(cleanCPF)) return false;

  // Validação do dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit === 10 || digit === 11) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit === 10 || digit === 11) digit = 0;

  return digit === parseInt(cleanCPF.charAt(10));
}

/**
 * Valida CNPJ
 */
export function validateCNPJ(cnpjDigits: string): boolean {
  // Remove pontos, traços e barra (garante que só tem dígitos)
  const cleanCNPJ = cnpjDigits.replace(/[./-]/g, '');

  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false;

  // Verifica se não são todos números iguais
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  let digit1 = sum % 11;
  digit1 = digit1 < 2 ? 0 : 11 - digit1;
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  let digit2 = sum % 11;
  digit2 = digit2 < 2 ? 0 : 11 - digit2;

  return digit2 === parseInt(cleanCNPJ.charAt(13));
}

/**
 * Valida se uma string contém apenas caracteres seguros para nomes
 */
export function validateName(name: string): boolean {
  // Permite letras, espaços, acentos e alguns caracteres especiais comuns em nomes
  const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'.-]+$/;
  return nameRegex.test(name) && name.length >= 2 && name.length <= 100;
}

/**
 * Valida comprimento de string com limites razoáveis
 */
export function validateStringLength(
  str: string,
  minLength: number = 1,
  maxLength: number = 1000
): boolean {
  return str.length >= minLength && str.length <= maxLength;
}

/**
 * Remove caracteres que podem ser usados em SQL injection
 * (Supabase ORM já protege, mas é uma camada extra)
 */
export function sanitizeForDatabase(input: string): string {
  return input
    .replace(/'/g, "''") // Escape single quotes for SQL
    .replace(/\\/g, '\\\\') // Escape backslashes
    .trim();
}

// Validação de UUID
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Sanitização específica para email
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Sanitização de números
export function sanitizeNumber(value: string | number): number {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(numValue) ? 0 : numValue;
}
