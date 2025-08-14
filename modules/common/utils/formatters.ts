/**
 * Utilitários para formatação e máscaras
 * Implementa o padrão Pure Functions - sem efeitos colaterais
 * Centraliza todas as funções de formatação da aplicação
 */

// ==================== FUNÇÕES BASE ====================

/**
 * Função base para limpeza e validação de entrada
 */
const cleanAndValidate = (value: string, maxLength?: number): string => {
  if (!value) return '';

  const cleaned = value.replace(/\D/g, '');
  return maxLength ? cleaned.slice(0, maxLength) : cleaned;
};

/**
 * Aplica padrão de substituição em string
 */
const applyPattern = (
  value: string,
  patterns: Array<{ regex: RegExp; replacement: string }>
): string => {
  return patterns.reduce((acc, { regex, replacement }) => acc.replace(regex, replacement), value);
};

// ==================== MÁSCARAS DE DOCUMENTO ====================

/**
 * Aplica máscara de CPF (000.000.000-00)
 */
export const maskCPF = (value: string): string => {
  const cleaned = cleanAndValidate(value, 11);

  return applyPattern(cleaned, [
    { regex: /(\d{3})(\d)/, replacement: '$1.$2' },
    { regex: /(\d{3})(\d)/, replacement: '$1.$2' },
    { regex: /(\d{3})(\d{1,2})$/, replacement: '$1-$2' },
  ]);
};

/**
 * Aplica máscara de CNPJ (00.000.000/0000-00)
 */
export const maskCNPJ = (value: string): string => {
  const cleaned = cleanAndValidate(value, 14);

  return applyPattern(cleaned, [
    { regex: /(\d{2})(\d)/, replacement: '$1.$2' },
    { regex: /(\d{3})(\d)/, replacement: '$1.$2' },
    { regex: /(\d{3})(\d)/, replacement: '$1/$2' },
    { regex: /(\d{4})(\d{1,2})$/, replacement: '$1-$2' },
  ]);
};

/**
 * Detecta e aplica máscara automaticamente (CPF ou CNPJ)
 */
export const maskDocument = (value: string): string => {
  const cleaned = cleanAndValidate(value);

  if (cleaned.length <= 11) {
    return maskCPF(value);
  } else {
    return maskCNPJ(value);
  }
};

// ==================== MÁSCARAS DE TELEFONE ====================

/**
 * Aplica máscara de telefone (00) 00000-0000 ou (00) 0000-0000
 */
export const maskPhone = (value: string): string => {
  const cleaned = cleanAndValidate(value, 11);

  if (cleaned.length <= 10) {
    // Telefone fixo: (00) 0000-0000
    return applyPattern(cleaned, [
      { regex: /(\d{2})(\d)/, replacement: '($1) $2' },
      { regex: /(\d{4})(\d{1,4})$/, replacement: '$1-$2' },
    ]);
  } else {
    // Celular: (00) 00000-0000
    return applyPattern(cleaned, [
      { regex: /(\d{2})(\d)/, replacement: '($1) $2' },
      { regex: /(\d{5})(\d{1,4})$/, replacement: '$1-$2' },
    ]);
  }
};

// ==================== MÁSCARAS DE CEP ====================

/**
 * Aplica máscara de CEP (00000-000)
 */
export const maskCEP = (value: string): string => {
  const cleaned = cleanAndValidate(value, 8);

  return applyPattern(cleaned, [{ regex: /(\d{5})(\d{1,3})$/, replacement: '$1-$2' }]);
};

// ==================== REMOÇÃO DE MÁSCARAS ====================

/**
 * Remove qualquer máscara numérica (função genérica)
 */
const unmaskNumeric = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Remove máscara de CPF/CNPJ
 */
export const unmaskDocument = (value: string): string => {
  return unmaskNumeric(value);
};

/**
 * Remove máscara de telefone
 */
export const unmaskPhone = (value: string): string => {
  return unmaskNumeric(value);
};

/**
 * Remove máscara de CEP
 */
export const unmaskCEP = (value: string): string => {
  return unmaskNumeric(value);
};

// ==================== FORMATAÇÃO DE MOEDA ====================

/**
 * Máscara para moeda brasileira
 */
export function maskCurrency(value: string | number): string {
  const numericValue =
    typeof value === 'string' ? parseFloat(value.replace(/\D/g, '')) / 100 : value;

  if (isNaN(numericValue)) return 'R$ 0,00';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
}

/**
 * Remove formatação de moeda e retorna número
 */
export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^\d,-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

// ==================== FORMATAÇÃO DE DATA ====================

/**
 * Formata data para formato brasileiro (DD/MM/AAAA)
 */
export const formatDate = (date: Date | string): string => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  return new Intl.DateTimeFormat('pt-BR').format(dateObj);
};

/**
 * Formata data e hora para formato brasileiro
 */
export const formatDateTime = (date: Date | string): string => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

/**
 * Aplica máscara de data (DD/MM/AAAA)
 */
export const maskDate = (value: string): string => {
  if (!value) return '';

  const cleaned = value.replace(/\D/g, '');
  const truncated = cleaned.slice(0, 8);

  return truncated.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d{1,4})$/, '$1/$2');
};

// ==================== FORMATAÇÃO DE TEXTO ====================

/**
 * Capitaliza primeira letra de cada palavra
 */
export const titleCase = (text: string): string => {
  if (!text) return '';

  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Trunca texto com reticências
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;

  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Remove acentos e caracteres especiais
 */
export const removeAccents = (text: string): string => {
  if (!text) return '';

  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// ==================== VALIDAÇÃO DE FORMATOS ====================

/**
 * Valida formato de CPF
 */
export const isValidCPF = (cpf: string): boolean => {
  const cleaned = unmaskDocument(cpf);

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false; // Todos iguais

  // Validação do dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10))) return false;

  return true;
};

/**
 * Valida formato de CNPJ
 */
export const isValidCNPJ = (cnpj: string): boolean => {
  const cleaned = unmaskDocument(cnpj);

  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false; // Todos iguais

  // Validação do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleaned.charAt(12))) return false;

  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleaned.charAt(13))) return false;

  return true;
};

/**
 * Valida formato de telefone brasileiro
 */
export const isValidPhone = (phone: string): boolean => {
  const cleaned = unmaskPhone(phone);
  return cleaned.length >= 10 && cleaned.length <= 11;
};

/**
 * Valida formato de CEP
 */
export const isValidCEP = (cep: string): boolean => {
  const cleaned = unmaskCEP(cep);
  return cleaned.length === 8 && /^\d{8}$/.test(cleaned);
};

// ==================== HOOKS E UTILITÁRIOS REACT ====================

/**
 * Hook personalizado para aplicar máscaras em inputs
 */
export const useMask = (type: 'cpf' | 'cnpj' | 'document' | 'phone' | 'cep' | 'date') => {
  const maskFunctions = {
    cpf: maskCPF,
    cnpj: maskCNPJ,
    document: maskDocument,
    phone: maskPhone,
    cep: maskCEP,
    date: maskDate,
  };

  return maskFunctions[type];
};

/**
 * Utilitário para criar handlers de input com máscara
 */
export const createMaskedInputHandler = (
  maskType: 'cpf' | 'cnpj' | 'document' | 'phone' | 'cep' | 'date',
  onChange: (value: string) => void
) => {
  const maskFunction = useMask(maskType);

  return (event: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = maskFunction(event.target.value);
    onChange(maskedValue);
  };
};
