// modules/common/constants/messages.ts

// ==================== AUTENTICAÇÃO ====================
export const AUTH_MESSAGES = {
  // Login
  FILL_ALL_FIELDS: 'Por favor, preencha todos os campos.',
  INVALID_EMAIL: 'Email inválido.',
  LOGIN_ERROR: 'Email ou senha incorretos. Tente novamente.',
  LOGIN_SUCCESS: 'Login realizado com sucesso!',

  // Logout
  LOGOUT_SUCCESS: 'Logout realizado com sucesso!',
  LOGOUT_ERROR: 'Erro ao fazer logout. Tente novamente.',

  // Registro
  SIGNUP_SUCCESS: 'Cadastro realizado com sucesso!',
  SIGNUP_ERROR: 'Erro ao criar conta. Tente novamente.',
  USER_ALREADY_EXISTS: 'Este email já está cadastrado.',
  WEAK_PASSWORD: 'A senha deve ter pelo menos 6 caracteres.',
  PASSWORDS_DONT_MATCH: 'As senhas não coincidem.',

  // Reset de senha
  RESET_PASSWORD_SUCCESS: 'Link de recuperação enviado! Verifique seu email.',
  RESET_PASSWORD_ERROR: 'Erro ao enviar email de recuperação.',
  PASSWORD_UPDATED: 'Senha atualizada com sucesso!',
  PASSWORD_UPDATE_ERROR: 'Erro ao atualizar senha.',

  // Validação
  EMAIL_REQUIRED: 'Email é obrigatório.',
  PASSWORD_REQUIRED: 'Senha é obrigatória.',
  CONFIRM_PASSWORD_REQUIRED: 'Confirmação de senha é obrigatória.',
  NAME_REQUIRED: 'Nome é obrigatório.',

  // Sessão
  SESSION_EXPIRED: 'Sua sessão expirou. Faça login novamente.',
  UNAUTHORIZED: 'Acesso não autorizado.',

  // Extras comuns de Auth (para mapear erros por código)
  EMAIL_NOT_CONFIRMED: 'Email não confirmado. Verifique sua caixa de entrada.',
  USER_NOT_FOUND: 'Usuário não encontrado.',
  EMAIL_RATE_LIMIT: 'Muitas tentativas. Tente novamente em alguns minutos.',
} as const;

// ==================== VALIDAÇÃO ====================
export const VALIDATION_MESSAGES = {
  EMAIL_INVALID: 'Formato de email inválido.',
  EMAIL_TOO_LONG: 'Email não pode ter mais de 254 caracteres.',

  PASSWORD_TOO_SHORT: 'Senha deve ter pelo menos 6 caracteres.',
  PASSWORD_TOO_LONG: 'Senha não pode ter mais de 128 caracteres.',
  PASSWORD_WEAK: 'Senha deve conter pelo menos uma letra e um número.',

  NAME_TOO_SHORT: 'Nome deve ter pelo menos 2 caracteres.',
  NAME_TOO_LONG: 'Nome não pode ter mais de 100 caracteres.',
  NAME_INVALID_CHARS: 'Nome contém caracteres inválidos.',

  PHONE_INVALID: 'Formato de telefone inválido.',
  PHONE_REQUIRED: 'Telefone é obrigatório.',

  CNPJ_INVALID: 'CNPJ inválido.',
  CPF_INVALID: 'CPF inválido.',
  DOCUMENT_REQUIRED: 'Documento é obrigatório.',

  FIELD_REQUIRED: 'Este campo é obrigatório.',
  FIELD_TOO_LONG: 'Campo excede o limite de caracteres.',
  FIELD_TOO_SHORT: 'Campo muito curto.',
} as const;

// ==================== SISTEMA ====================
export const SYSTEM_MESSAGES = {
  OPERATION_SUCCESS: 'Operação realizada com sucesso!',
  SAVE_SUCCESS: 'Dados salvos com sucesso!',
  UPDATE_SUCCESS: 'Atualização realizada com sucesso!',
  DELETE_SUCCESS: 'Item removido com sucesso!',

  INTERNAL_ERROR: 'Erro interno do sistema. Tente novamente.',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  OPERATION_FAILED: 'Operação falhou. Tente novamente.',

  LOADING: 'Carregando...',
  PROCESSING: 'Processando...',
  SAVING: 'Salvando...',

  CONFIRM_DELETE: 'Tem certeza que deseja remover este item?',
  CONFIRM_ACTION: 'Confirmar esta ação?',
  UNSAVED_CHANGES: 'Há alterações não salvas. Deseja continuar?',
} as const;

// ==================== ADMIN ====================
export const ADMIN_MESSAGES = {
  USER_CREATED: 'Usuário criado com sucesso!',
  USER_UPDATED: 'Usuário atualizado com sucesso!',
  USER_DELETED: 'Usuário removido com sucesso!',
  USER_APPROVED: 'Usuário aprovado com sucesso!',
  USER_REJECTED: 'Usuário rejeitado.',
  USER_SUSPENDED: 'Usuário suspenso.',

  INSUFFICIENT_PERMISSIONS: 'Permissões insuficientes para esta ação.',
  ADMIN_REQUIRED: 'Acesso restrito a administradores.',

  BULK_ACTION_SUCCESS: 'Ação em lote executada com sucesso!',
  EXPORT_SUCCESS: 'Dados exportados com sucesso!',
  IMPORT_SUCCESS: 'Dados importados com sucesso!',
} as const;

// ==================== DASHBOARD ====================
export const DASHBOARD_MESSAGES = {
  WELCOME: 'Bem-vindo ao ProLine Auto!',
  NO_DATA: 'Nenhum dado disponível.',
  REFRESH_DATA: 'Atualizando dados...',
  FILTER_APPLIED: 'Filtro aplicado.',
  FILTER_CLEARED: 'Filtros limpos.',
} as const;

// ==================== FORMULÁRIO ====================
export const FORM_MESSAGES = {
  REQUIRED_FIELDS: 'Campos marcados com * são obrigatórios.',
  FORM_INVALID: 'Corrija os erros antes de continuar.',
  CHANGES_SAVED: 'Alterações salvas automaticamente.',
  DRAFT_SAVED: 'Rascunho salvo.',
} as const;

// ==================== NEGÓCIO ====================
export const BUSINESS_MESSAGES = {
  DOCUMENT_ALREADY_EXISTS: 'CPF ou CNPJ já cadastrado.',
} as const;

// ==================== HELPERS ====================
export const formatMessage = (template: string, params: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (_m, key) => params[key]?.toString() ?? _m);

// ==================== MAPA DE ERROS POR CÓDIGO (preferido) ====================
export type AppErrorCode =
  | 'user_already_registered'
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_not_found'
  | 'weak_password'
  | 'email_rate_limit_exceeded'
  | 'network_error'
  | 'document_already_exists'
  | 'missing_fields'
  | 'validation_error'
  | 'user_creation_failed'
  | 'profile_creation_failed'
  | 'client_creation_failed'
  | 'internal_error';

const ERROR_MAP: Record<AppErrorCode, string> = {
  user_already_registered: AUTH_MESSAGES.USER_ALREADY_EXISTS,
  invalid_credentials: AUTH_MESSAGES.LOGIN_ERROR,
  email_not_confirmed: AUTH_MESSAGES.EMAIL_NOT_CONFIRMED,
  user_not_found: AUTH_MESSAGES.USER_NOT_FOUND,
  weak_password: AUTH_MESSAGES.WEAK_PASSWORD,
  email_rate_limit_exceeded: AUTH_MESSAGES.EMAIL_RATE_LIMIT,
  network_error: SYSTEM_MESSAGES.NETWORK_ERROR,
  document_already_exists: BUSINESS_MESSAGES.DOCUMENT_ALREADY_EXISTS,
  missing_fields: 'Preencha todos os campos obrigatórios.',
  validation_error: 'Dados inválidos.',
  user_creation_failed: 'Erro ao criar usuário.',
  profile_creation_failed: 'Erro ao criar perfil.',
  client_creation_failed: 'Erro ao criar cliente.',
  internal_error: SYSTEM_MESSAGES.INTERNAL_ERROR,
};

export const getErrorMessage = (
  code?: AppErrorCode,
  fallback = SYSTEM_MESSAGES.INTERNAL_ERROR
): string => {
  if (!code) return fallback;
  return ERROR_MAP[code] ?? fallback;
};

// ==================== FALLBACK POR TEXTO BRUTO (legado) ====================
export const getErrorMessageFromRaw = (raw: unknown): string => {
  const message = String(raw ?? '');

  // Postgres UNIQUE
  if (
    /\bduplicate key value\b/i.test(message) ||
    /\b23505\b/.test(message) ||
    /clients_document_number_key/i.test(message)
  ) {
    return BUSINESS_MESSAGES.DOCUMENT_ALREADY_EXISTS;
  }

  // Supabase Auth
  if (/AuthApiError:\s*E-mail já registrado/i.test(message))
    return AUTH_MESSAGES.USER_ALREADY_EXISTS;
  if (/AuthApiError:\s*Credenciais inválidass/i.test(message)) return AUTH_MESSAGES.LOGIN_ERROR;
  if (/AuthApiError:\s*E-mail não confirmado/i.test(message))
    return AUTH_MESSAGES.EMAIL_NOT_CONFIRMED;
  if (/AuthApiError:\s*User not found/i.test(message)) return AUTH_MESSAGES.USER_NOT_FOUND;
  if (/AuthApiError:\s*A senha deve ter pelo menos 6 caracteres/i.test(message))
    return AUTH_MESSAGES.WEAK_PASSWORD;
  if (/AuthApiError:\s*Taxa limite de e-mail excedida/i.test(message))
    return AUTH_MESSAGES.EMAIL_RATE_LIMIT;

  if (/Network Error/i.test(message)) return SYSTEM_MESSAGES.NETWORK_ERROR;
  return SYSTEM_MESSAGES.INTERNAL_ERROR;
};

// (Opcional) manter o hook utilitário se você o usa em componentes
export const useMessages = () => ({
  auth: AUTH_MESSAGES,
  validation: VALIDATION_MESSAGES,
  system: SYSTEM_MESSAGES,
  admin: ADMIN_MESSAGES,
  dashboard: DASHBOARD_MESSAGES,
  form: FORM_MESSAGES,
  formatMessage,
  getErrorMessage,
});
