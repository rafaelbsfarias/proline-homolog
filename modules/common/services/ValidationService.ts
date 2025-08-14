/**
 * Service layer para validações
 * Implementa o padrão Single Responsibility Principle
 * Centraliza todas as validações da aplicação
 *
 * Integrado com:
 * - Sistema de mensagens centralizadas
 * - Utilitários de formatação
 * - Tratamento de erros padronizado
 */

import { VALIDATION_MESSAGES, AUTH_MESSAGES } from '../constants/messages';
import { isValidCPF, isValidCNPJ, isValidPhone, isValidCEP } from '../utils/formatters';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Service para validações de entrada
 */
export class ValidationService {
  /**
   * Valida formato de email
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];

    if (!email || email.trim() === '') {
      errors.push(AUTH_MESSAGES.EMAIL_REQUIRED);
    } else {
      const sanitizedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(sanitizedEmail)) {
        errors.push(VALIDATION_MESSAGES.EMAIL_INVALID);
      }

      if (sanitizedEmail.length > 254) {
        errors.push(VALIDATION_MESSAGES.EMAIL_TOO_LONG);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida senha
   */
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (!password || password.trim() === '') {
      errors.push(AUTH_MESSAGES.PASSWORD_REQUIRED);
    } else {
      if (password.length < 6) {
        errors.push(VALIDATION_MESSAGES.PASSWORD_TOO_SHORT);
      }
      if (password.length > 128) {
        errors.push(VALIDATION_MESSAGES.PASSWORD_TOO_LONG);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida confirmação de senha
   */
  static validatePasswordConfirmation(password: string, confirmPassword: string): ValidationResult {
    const errors: string[] = [];

    if (!confirmPassword || confirmPassword.trim() === '') {
      errors.push(AUTH_MESSAGES.CONFIRM_PASSWORD_REQUIRED);
    } else if (password !== confirmPassword) {
      errors.push(AUTH_MESSAGES.PASSWORDS_DONT_MATCH);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida nome completo
   */
  static validateFullName(fullName: string): ValidationResult {
    const errors: string[] = [];

    if (!fullName || fullName.trim() === '') {
      errors.push(AUTH_MESSAGES.NAME_REQUIRED);
    } else {
      const sanitizedName = fullName.trim();
      if (sanitizedName.length < 2) {
        errors.push(VALIDATION_MESSAGES.NAME_TOO_SHORT);
      }
      if (sanitizedName.length > 100) {
        errors.push(VALIDATION_MESSAGES.NAME_TOO_LONG);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida telefone
   */
  static validatePhone(phone: string): ValidationResult {
    const errors: string[] = [];

    if (!phone || phone.trim() === '') {
      errors.push(VALIDATION_MESSAGES.PHONE_REQUIRED);
    } else if (!isValidPhone(phone)) {
      errors.push(VALIDATION_MESSAGES.PHONE_INVALID);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida CPF
   */
  static validateCPF(cpf: string): ValidationResult {
    const errors: string[] = [];

    if (!cpf || cpf.trim() === '') {
      errors.push(VALIDATION_MESSAGES.DOCUMENT_REQUIRED);
    } else if (!isValidCPF(cpf)) {
      errors.push(VALIDATION_MESSAGES.CPF_INVALID);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida CNPJ
   */
  static validateCNPJ(cnpj: string): ValidationResult {
    const errors: string[] = [];

    if (!cnpj || cnpj.trim() === '') {
      errors.push(VALIDATION_MESSAGES.DOCUMENT_REQUIRED);
    } else if (!isValidCNPJ(cnpj)) {
      errors.push(VALIDATION_MESSAGES.CNPJ_INVALID);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida CEP
   */
  static validateCEP(cep: string): ValidationResult {
    const errors: string[] = [];

    if (!cep || cep.trim() === '') {
      errors.push(VALIDATION_MESSAGES.FIELD_REQUIRED);
    } else if (!isValidCEP(cep)) {
      errors.push('CEP inválido');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida formulário de login
   */
  static validateLoginForm(email: string, password: string): ValidationResult {
    const emailValidation = this.validateEmail(email);
    const passwordValidation = this.validatePassword(password);

    const allErrors = [...emailValidation.errors, ...passwordValidation.errors];

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  /**
   * Valida formulário de registro
   */
  static validateSignupForm(
    email: string,
    password: string,
    confirmPassword: string,
    fullName?: string
  ): ValidationResult {
    const emailValidation = this.validateEmail(email);
    const passwordValidation = this.validatePassword(password);
    const passwordConfirmValidation = this.validatePasswordConfirmation(password, confirmPassword);

    const allErrors = [
      ...emailValidation.errors,
      ...passwordValidation.errors,
      ...passwordConfirmValidation.errors,
    ];

    if (fullName !== undefined) {
      const nameValidation = this.validateFullName(fullName);
      allErrors.push(...nameValidation.errors);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  /**
   * Sanitiza entrada de texto
   */
  static sanitizeText(text: string): string {
    if (!text) return '';

    return text
      .trim()
      .replace(/[<>]/g, '') // Remove caracteres perigosos
      .substring(0, 1000); // Limita tamanho
  }

  /**
   * Sanitiza email
   */
  static sanitizeEmail(email: string): string {
    if (!email) return '';

    return email.trim().toLowerCase().replace(/[<>]/g, '').substring(0, 254); // Limite padrão de email
  }
}

/**
 * Hook para usar validações em componentes React
 */
export const useValidation = () => ValidationService;
