/**
 * Utilitários para validação e formatação de placas brasileiras
 * Suporta formatos antigo (ABC1234) e Mercosul (ABC1D23)
 */

// Regex unificado para placas brasileiras (antigo e Mercosul)
const PLATE_REGEX = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$|^[A-Z]{3}[0-9]{4}$/;

/**
 * Remove caracteres não alfanuméricos e converte para maiúsculo
 */
export const sanitizePlate = (plate: string): string => {
  return plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
};

/**
 * Valida se a placa está no formato brasileiro correto
 * @param plate - Placa a ser validada (pode conter hífen)
 * @returns true se válida, false caso contrário
 */
export const validatePlate = (plate: string): boolean => {
  const cleanPlate = sanitizePlate(plate);
  return PLATE_REGEX.test(cleanPlate);
};

/**
 * Formata a placa para exibição com hífen
 * @param plate - Placa sem formatação
 * @returns Placa formatada (ABC-1234 ou ABC-1D23)
 */
export const formatPlateForDisplay = (plate: string): string => {
  const clean = sanitizePlate(plate);

  if (clean.length <= 3) {
    return clean;
  } else if (clean.length <= 7) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  } else {
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`;
  }
};

/**
 * Formata a placa em tempo real durante a digitação
 * @param value - Valor atual do input
 * @returns Valor formatado para o input
 */
export const formatPlateInput = (value: string): string => {
  const clean = sanitizePlate(value);

  if (clean.length <= 3) {
    return clean;
  } else if (clean.length <= 4) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  } else {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
};

/**
 * Prepara a placa para armazenamento no banco (sem hífen)
 * @param plate - Placa com ou sem formatação
 * @returns Placa sanitizada para o banco
 */
export const preparePlateForStorage = (plate: string): string => {
  return sanitizePlate(plate);
};

/**
 * Mensagens de erro padronizadas
 */
export const PLATE_ERROR_MESSAGES = {
  INVALID_FORMAT: 'Formato de placa inválido. Use formato brasileiro (ABC1234 ou ABC1D23)',
  DUPLICATE: 'Já existe um veículo cadastrado com esta placa',
  REQUIRED: 'Placa é obrigatória',
} as const;
