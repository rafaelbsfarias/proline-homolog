import { ValidationError } from '@/modules/common/errors';

interface PartnerInputData {
  name?: string;
  email?: string;
  cnpj?: string;
  companyName?: string;
  phone?: string;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class PartnerDataValidator {
  static validate(data: PartnerInputData): ValidationResult {
    if (!data.name?.trim()) return { isValid: false, error: 'Nome do representante é obrigatório' };
    if (!data.email?.trim()) return { isValid: false, error: 'E-mail é obrigatório' };
    if (!data.cnpj?.trim()) return { isValid: false, error: 'CNPJ é obrigatório' };
    if (!data.companyName?.trim())
      return { isValid: false, error: 'Nome da empresa é obrigatório' };

    // Basic email regex validation (can be enhanced later)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      return { isValid: false, error: 'E-mail inválido.' };
    }

    // Basic CNPJ validation (can be enhanced later with a proper validator)
    const cnpjDigits = data.cnpj.replace(/\D/g, '');
    if (cnpjDigits.length !== 14) {
      return { isValid: false, error: 'CNPJ inválido. Deve conter 14 dígitos.' };
    }

    return { isValid: true };
  }

  static sanitize(data: PartnerInputData) {
    const sanitized = {
      name: data.name?.trim() || '',
      email: data.email?.trim().toLowerCase() || '',
      cnpj: data.cnpj?.replace(/\D/g, '') || '',
      companyName: data.companyName?.trim() || '',
      phone: data.phone?.replace(/\D/g, '') || null,
    };
    return sanitized;
  }
}
