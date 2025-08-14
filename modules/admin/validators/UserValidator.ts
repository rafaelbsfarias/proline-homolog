import { ValidationError } from '@/modules/common/errors';
import { sanitizeString } from '@/modules/common/utils/inputSanitization';

interface CreateUserEmailInput {
  email?: string;
  fullName?: string;
  name?: string; // Allow name as an alternative for fullName
  role?: string;
}

export class UserValidator {
  static validateCreateUserEmailInput(input: CreateUserEmailInput): {
    email: string;
    fullName: string;
    englishRole: 'admin' | 'specialist';
  } {
    const email = sanitizeString(String(input?.email || '')).toLowerCase();
    const fullName = sanitizeString(String(input?.fullName ?? (input?.name || '')));
    const rawRole = sanitizeString(String(input?.role || '')).toLowerCase();

    // Map role to English enum
    let englishRole: 'admin' | 'specialist' | null = null;
    if (rawRole === 'administrador' || rawRole === 'admin') englishRole = 'admin';
    if (rawRole === 'especialista' || rawRole === 'specialist') englishRole = 'specialist';

    // Input validation
    if (!email) throw new ValidationError('Email é obrigatório.');
    if (!fullName) throw new ValidationError('Nome é obrigatório.');
    if (!englishRole)
      throw new ValidationError('Perfil inválido. Use "administrador" ou "especialista".');

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) throw new ValidationError('Email inválido.');

    return { email, fullName, englishRole };
  }
}
