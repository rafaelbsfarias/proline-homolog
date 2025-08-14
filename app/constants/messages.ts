/**
 * Mensagens centralizadas da aplicação
 * Implementa o padrão Single Source of Truth para mensagens
 * Facilita tradução e manutenção
 */

// ==================== MENSAGENS DE AUTENTICAÇÃO ====================
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
} as const;

// ==================== MENSAGENS DE VALIDAÇÃO ====================
export const VALIDATION_MESSAGES = {
  // Email
  EMAIL_INVALID: 'Formato de email inválido.',
  EMAIL_TOO_LONG: 'Email não pode ter mais de 254 caracteres.',

  // Senha
  PASSWORD_TOO_SHORT: 'Senha deve ter pelo menos 6 caracteres.',
  PASSWORD_TOO_LONG: 'Senha não pode ter mais de 128 caracteres.',
  PASSWORD_WEAK: 'Senha deve conter pelo menos uma letra e um número.',

  // Nome
  NAME_TOO_SHORT: 'Nome deve ter pelo menos 2 caracteres.',
  NAME_TOO_LONG: 'Nome não pode ter mais de 100 caracteres.',
  NAME_INVALID_CHARS: 'Nome contém caracteres inválidos.',

  // Telefone
  PHONE_INVALID: 'Formato de telefone inválido.',
  PHONE_REQUIRED: 'Telefone é obrigatório.',

  // CNPJ/CPF
  CNPJ_INVALID: 'CNPJ inválido.',
  CPF_INVALID: 'CPF inválido.',
  DOCUMENT_REQUIRED: 'Documento é obrigatório.',

  // Campos obrigatórios
  FIELD_REQUIRED: 'Este campo é obrigatório.',
  FIELD_TOO_LONG: 'Campo excede o limite de caracteres.',
  FIELD_TOO_SHORT: 'Campo muito curto.',
} as const;

// ==================== MENSAGENS DO SISTEMA ====================
export const SYSTEM_MESSAGES = {
  // Sucesso
  OPERATION_SUCCESS: 'Operação realizada com sucesso!',
  SAVE_SUCCESS: 'Dados salvos com sucesso!',
  UPDATE_SUCCESS: 'Atualização realizada com sucesso!',
  DELETE_SUCCESS: 'Item removido com sucesso!',

  // Erro
  INTERNAL_ERROR: 'Erro interno do sistema. Tente novamente.',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  OPERATION_FAILED: 'Operação falhou. Tente novamente.',

  // Loading
  LOADING: 'Carregando...',
  PROCESSING: 'Processando...',
  SAVING: 'Salvando...',

  // Confirmação
  CONFIRM_DELETE: 'Tem certeza que deseja remover este item?',
  CONFIRM_ACTION: 'Confirmar esta ação?',
  UNSAVED_CHANGES: 'Há alterações não salvas. Deseja continuar?',
} as const;

// ==================== MENSAGENS DE ADMIN ====================
export const ADMIN_MESSAGES = {
  // Usuários
  USER_CREATED: 'Usuário criado com sucesso!',
  USER_UPDATED: 'Usuário atualizado com sucesso!',
  USER_DELETED: 'Usuário removido com sucesso!',
  USER_APPROVED: 'Usuário aprovado com sucesso!',
  USER_REJECTED: 'Usuário rejeitado.',
  USER_SUSPENDED: 'Usuário suspenso.',

  // Permissões
  INSUFFICIENT_PERMISSIONS: 'Permissões insuficientes para esta ação.',
  ADMIN_REQUIRED: 'Acesso restrito a administradores.',

  // Operações
  BULK_ACTION_SUCCESS: 'Ação em lote executada com sucesso!',
  EXPORT_SUCCESS: 'Dados exportados com sucesso!',
  IMPORT_SUCCESS: 'Dados importados com sucesso!',
} as const;

// ==================== MENSAGENS DE DASHBOARD ====================
export const DASHBOARD_MESSAGES = {
  WELCOME: 'Bem-vindo ao ProLine Auto!',
  NO_DATA: 'Nenhum dado disponível.',
  REFRESH_DATA: 'Atualizando dados...',
  FILTER_APPLIED: 'Filtro aplicado.',
  FILTER_CLEARED: 'Filtros limpos.',
} as const;

// ==================== MENSAGENS DE FORMULÁRIO ====================
export const FORM_MESSAGES = {
  REQUIRED_FIELDS: 'Campos marcados com * são obrigatórios.',
  FORM_INVALID: 'Corrija os erros antes de continuar.',
  CHANGES_SAVED: 'Alterações salvas automaticamente.',
  DRAFT_SAVED: 'Rascunho salvo.',
} as const;

// ==================== HELPER FUNCTIONS ====================

/**
 * Obtém mensagem formatada com parâmetros
 */
export const formatMessage = (
  template: string,
  params: Record<string, string | number>
): string => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
};

/**
 * Obtém mensagem de erro baseada no código
 */
export const getErrorMessage = (
  errorCode: string,
  fallback = SYSTEM_MESSAGES.INTERNAL_ERROR
): string => {
  const errorMap: Record<string, string> = {
    invalid_credentials: AUTH_MESSAGES.LOGIN_ERROR,
    user_not_found: AUTH_MESSAGES.LOGIN_ERROR,
    email_not_confirmed: 'Email não confirmado. Verifique sua caixa de entrada.',
    signup_disabled: 'Cadastro temporariamente desabilitado.',
    email_rate_limit_exceeded: 'Muitas tentativas. Tente novamente em alguns minutos.',
    invalid_email: VALIDATION_MESSAGES.EMAIL_INVALID,
    weak_password: AUTH_MESSAGES.WEAK_PASSWORD,
    user_already_registered: AUTH_MESSAGES.USER_ALREADY_EXISTS,
  };

  return errorMap[errorCode] || fallback;
};

/**
 * Obtém mensagem de sucesso baseada na ação
 */
export const getSuccessMessage = (action: string): string => {
  const successMap: Record<string, string> = {
    login: AUTH_MESSAGES.LOGIN_SUCCESS,
    logout: AUTH_MESSAGES.LOGOUT_SUCCESS,
    signup: AUTH_MESSAGES.SIGNUP_SUCCESS,
    password_reset: AUTH_MESSAGES.RESET_PASSWORD_SUCCESS,
    password_update: AUTH_MESSAGES.PASSWORD_UPDATED,
    user_created: ADMIN_MESSAGES.USER_CREATED,
    user_updated: ADMIN_MESSAGES.USER_UPDATED,
    user_deleted: ADMIN_MESSAGES.USER_DELETED,
    save: SYSTEM_MESSAGES.SAVE_SUCCESS,
    update: SYSTEM_MESSAGES.UPDATE_SUCCESS,
    delete: SYSTEM_MESSAGES.DELETE_SUCCESS,
  };

  return successMap[action] || SYSTEM_MESSAGES.OPERATION_SUCCESS;
};

/**
 * Hook para usar mensagens em componentes React
 */
export const useMessages = () => ({
  auth: AUTH_MESSAGES,
  validation: VALIDATION_MESSAGES,
  system: SYSTEM_MESSAGES,
  admin: ADMIN_MESSAGES,
  dashboard: DASHBOARD_MESSAGES,
  form: FORM_MESSAGES,
  formatMessage,
  getErrorMessage,
  getSuccessMessage,
});
