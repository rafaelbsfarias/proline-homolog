/**
 * Erros específicos do domínio PartnerService
 * Seguindo Object Calisthenics - Tipos específicos para melhor semântica
 */

/**
 * Erro quando tenta criar serviço com nome duplicado para mesmo parceiro
 */
export class DuplicateServiceNameError extends Error {
  constructor(serviceName: string) {
    super(`Já existe um serviço com o nome "${serviceName}" para este parceiro`);
    this.name = 'DuplicateServiceNameError';
  }
}

/**
 * Erro quando serviço não é encontrado
 */
export class ServiceNotFoundError extends Error {
  constructor(serviceId: string) {
    super(`Serviço com ID "${serviceId}" não foi encontrado`);
    this.name = 'ServiceNotFoundError';
  }
}

/**
 * Erro quando tenta ativar serviço já ativo
 */
export class ServiceAlreadyActiveError extends Error {
  constructor(serviceId: string) {
    super(`Serviço com ID "${serviceId}" já está ativo`);
    this.name = 'ServiceAlreadyActiveError';
  }
}

/**
 * Erro quando tenta desativar serviço já inativo
 */
export class ServiceAlreadyInactiveError extends Error {
  constructor(serviceId: string) {
    super(`Serviço com ID "${serviceId}" já está desativado`);
    this.name = 'ServiceAlreadyInactiveError';
  }
}

/**
 * Erro quando operação requer serviço ativo mas está inativo
 */
export class InactiveServiceOperationError extends Error {
  constructor(serviceId: string, operation: string) {
    super(`Não é possível ${operation} em serviço inativo (ID: ${serviceId})`);
    this.name = 'InactiveServiceOperationError';
  }
}

/**
 * Erro genérico de persistência
 */
export class ServicePersistenceError extends Error {
  constructor(operation: string, originalError?: Error) {
    super(
      `Erro de persistência durante ${operation}: ${originalError?.message || 'Erro desconhecido'}`
    );
    this.name = 'ServicePersistenceError';
    this.cause = originalError;
  }
}

/**
 * Union type de todos os erros específicos do domínio
 */
export type PartnerServiceError =
  | DuplicateServiceNameError
  | ServiceNotFoundError
  | ServiceAlreadyActiveError
  | ServiceAlreadyInactiveError
  | InactiveServiceOperationError
  | ServicePersistenceError;
