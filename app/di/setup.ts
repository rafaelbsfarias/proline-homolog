/**
 * Configuração do Container de Injeção de Dependência
 * Implementa o padrão Service Locator
 * Centraliza o registro de todas as dependências da aplicação
 */

import { DIContainer } from './DIContainer';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { AuthService } from '@/modules/common/services/AuthService';
import { ValidationService } from '@/modules/common/services/ValidationService';
import { ErrorHandlerService } from '@/modules/common/services/ErrorHandlerService';

/**
 * Chaves para identificação dos serviços
 */
export const SERVICE_KEYS = {
  SUPABASE_SERVICE: 'SupabaseService',
  AUTH_SERVICE: 'AuthService',
  VALIDATION_SERVICE: 'ValidationService',
  ERROR_HANDLER_SERVICE: 'ErrorHandlerService',
} as const;

/**
 * Configura todas as dependências da aplicação
 */
export function setupDIContainer(): DIContainer {
  const container = DIContainer.getInstance();

  // Registra SupabaseService como singleton
  container.registerSingleton(SERVICE_KEYS.SUPABASE_SERVICE, () => SupabaseService.getInstance());

  // Registra AuthService como singleton
  container.registerSingleton(SERVICE_KEYS.AUTH_SERVICE, () => new AuthService());

  // Registra ValidationService como singleton (classe estática)
  container.registerInstance(SERVICE_KEYS.VALIDATION_SERVICE, ValidationService);

  // Registra ErrorHandlerService como singleton
  container.registerSingleton(SERVICE_KEYS.ERROR_HANDLER_SERVICE, () =>
    ErrorHandlerService.getInstance()
  );

  return container;
}

/**
 * Hook para resolver dependências
 */
export function useDependency<T>(key: string): T {
  const container = DIContainer.getInstance();
  return container.resolve<T>(key);
}

/**
 * Função utilitária para resolver dependências fora de componentes React
 */
export function resolveDependency<T>(key: string): T {
  const container = DIContainer.getInstance();
  return container.resolve<T>(key);
}
