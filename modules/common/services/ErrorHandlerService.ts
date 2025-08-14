/**
 * Sistema centralizado de tratamento de erros
 * Implementa o padrão Error Handling Strategy
 * Padroniza como erros são capturados, logados e exibidos
 */

import { AUTH_MESSAGES, SYSTEM_MESSAGES, getErrorMessage } from '../constants/messages';

// ==================== TIPOS DE ERRO ====================

export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error | any;
  context?: Record<string, any>;
  timestamp: Date;
  userAgent?: string;
  url?: string;
  userId?: string;
}

export interface ErrorHandlerOptions {
  showToUser?: boolean;
  logToConsole?: boolean;
  logToServer?: boolean;
  context?: Record<string, any>;
}

// ==================== CLASSE PRINCIPAL ====================

/**
 * Service para tratamento centralizado de erros
 */
export class ErrorHandlerService {
  private static instance: ErrorHandlerService;
  private errorLog: AppError[] = [];
  private onErrorCallback?: (error: AppError) => void;

  private constructor() {}

  public static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }

  /**
   * Define callback para tratamento de erros (ex: mostrar toast)
   */
  public setErrorCallback(callback: (error: AppError) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Manipula erro principal
   */
  public handleError(
    error: Error | any,
    type: ErrorType = ErrorType.UNKNOWN,
    options: ErrorHandlerOptions = {}
  ): AppError {
    const appError = this.createAppError(error, type, options.context);

    // Log no console (desenvolvimento)
    if (options.logToConsole !== false && process.env.NODE_ENV === 'development') {
      this.logToConsole(appError);
    }

    // Log no servidor (produção)
    if (options.logToServer && process.env.NODE_ENV === 'production') {
      this.logToServer(appError);
    }

    // Mostrar para o usuário
    if (options.showToUser !== false && this.onErrorCallback) {
      this.onErrorCallback(appError);
    }

    // Armazenar localmente
    this.addToErrorLog(appError);

    return appError;
  }

  /**
   * Cria objeto AppError padronizado
   */
  private createAppError(
    originalError: Error | any,
    type: ErrorType,
    context?: Record<string, any>
  ): AppError {
    const id = this.generateErrorId();
    const message = this.extractErrorMessage(originalError, type);
    const severity = this.determineSeverity(type, originalError);

    return {
      id,
      type,
      severity,
      message,
      originalError,
      context,
      timestamp: new Date(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
  }

  /**
   * Extrai mensagem de erro amigável
   */
  private extractErrorMessage(error: any, type: ErrorType): string {
    // Se é um erro conhecido do Supabase/Auth
    if (error?.message) {
      const knownMessage = getErrorMessage(error.message);
      if (knownMessage !== SYSTEM_MESSAGES.INTERNAL_ERROR) {
        return knownMessage;
      }
    }

    // Mensagens por tipo
    switch (type) {
      case ErrorType.VALIDATION:
        return 'Dados inválidos. Verifique os campos e tente novamente.';
      case ErrorType.AUTHENTICATION:
        return AUTH_MESSAGES.LOGIN_ERROR;
      case ErrorType.AUTHORIZATION:
        return 'Você não tem permissão para esta ação.';
      case ErrorType.NETWORK:
        return SYSTEM_MESSAGES.NETWORK_ERROR;
      case ErrorType.SERVER:
        return 'Erro no servidor. Tente novamente em alguns instantes.';
      case ErrorType.CLIENT:
        return 'Erro no aplicativo. Tente recarregar a página.';
      default:
        return SYSTEM_MESSAGES.INTERNAL_ERROR;
    }
  }

  /**
   * Determina severidade do erro
   */
  private determineSeverity(type: ErrorType, error: any): ErrorSeverity {
    switch (type) {
      case ErrorType.VALIDATION:
        return ErrorSeverity.LOW;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return ErrorSeverity.MEDIUM;
      case ErrorType.NETWORK:
        return ErrorSeverity.MEDIUM;
      case ErrorType.SERVER:
        return ErrorSeverity.HIGH;
      case ErrorType.CLIENT:
        return ErrorSeverity.HIGH;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Gera ID único para o erro
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log detalhado no console (desenvolvimento)
   */
  private logToConsole(error: AppError): void {
    if (process.env.NODE_ENV !== 'development') return;

    const style = this.getConsoleStyle(error.severity);

    // eslint-disable-next-line no-console
    console.group(`🚨 ${error.type.toUpperCase()} Error [${error.severity}]`);
    // eslint-disable-next-line no-console
    console.log(`%c${error.message}`, style);
    // eslint-disable-next-line no-console
    console.log('Error ID:', error.id);
    // eslint-disable-next-line no-console
    console.log('Timestamp:', error.timestamp.toISOString());

    if (error.context) {
      // eslint-disable-next-line no-console
      console.log('Context:', error.context);
    }

    if (error.originalError) {
      // eslint-disable-next-line no-console
      console.log('Original Error:', error.originalError);
    }

    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  /**
   * Estilos para console baseados na severidade
   */
  private getConsoleStyle(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'color: #f59e0b; font-weight: bold;';
      case ErrorSeverity.MEDIUM:
        return 'color: #ef4444; font-weight: bold;';
      case ErrorSeverity.HIGH:
        return 'color: #dc2626; font-weight: bold; background: #fee2e2;';
      case ErrorSeverity.CRITICAL:
        return 'color: #991b1b; font-weight: bold; background: #fecaca;';
      default:
        return 'color: #6b7280; font-weight: bold;';
    }
  }

  /**
   * Envia erro para servidor (implementação futura)
   */
  private async logToServer(error: AppError): Promise<void> {
    try {
      // TODO: Implementar envio para serviço de log (ex: Sentry)
      const payload = {
        ...error,
        originalError: error.originalError?.message || error.originalError,
      };

      // Placeholder para envio real
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Log enviado para servidor:', payload);
      }
    } catch (logError) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Erro ao enviar log para servidor:', logError);
      }
    }
  }

  /**
   * Adiciona erro ao log local
   */
  private addToErrorLog(error: AppError): void {
    this.errorLog.push(error);

    // Limita o tamanho do log (últimos 100 erros)
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
  }

  /**
   * Obtém log de erros
   */
  public getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  /**
   * Limpa log de erros
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }
}

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Função helper para tratamento rápido de erros
 */
export const handleError = (
  error: Error | any,
  type: ErrorType = ErrorType.UNKNOWN,
  options: ErrorHandlerOptions = {}
): AppError => {
  return ErrorHandlerService.getInstance().handleError(error, type, options);
};

/**
 * Função específica para erros de validação
 */
export const handleValidationError = (
  error: Error | any,
  context?: Record<string, any>
): AppError => {
  return handleError(error, ErrorType.VALIDATION, {
    context,
    showToUser: true,
    logToConsole: true,
  });
};

/**
 * Função específica para erros de autenticação
 */
export const handleAuthError = (error: Error | any, context?: Record<string, any>): AppError => {
  return handleError(error, ErrorType.AUTHENTICATION, {
    context,
    showToUser: true,
    logToConsole: true,
    logToServer: true,
  });
};

/**
 * Função específica para erros de rede
 */
export const handleNetworkError = (error: Error | any, context?: Record<string, any>): AppError => {
  return handleError(error, ErrorType.NETWORK, {
    context,
    showToUser: true,
    logToConsole: true,
  });
};

/**
 * Função específica para erros de servidor
 */
export const handleServerError = (error: Error | any, context?: Record<string, any>): AppError => {
  return handleError(error, ErrorType.SERVER, {
    context,
    showToUser: true,
    logToConsole: true,
    logToServer: true,
  });
};

/**
 * Wrapper para funções assíncronas com tratamento de erro
 */
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorType: ErrorType = ErrorType.UNKNOWN,
  context?: Record<string, any>
): T => {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, errorType, { context, showToUser: true });
      throw error; // Re-throw para que o código chamador possa decidir como proceder
    }
  }) as T;
};

// ==================== HOOK PARA REACT ====================

/**
 * Hook para usar o sistema de erros em componentes React
 */
export const useErrorHandler = () => {
  const errorService = ErrorHandlerService.getInstance();

  return {
    handleError: (error: Error | any, type?: ErrorType, options?: ErrorHandlerOptions) =>
      errorService.handleError(error, type, options),
    handleValidationError: (error: Error | any, context?: Record<string, any>) =>
      handleValidationError(error, context),
    handleAuthError: (error: Error | any, context?: Record<string, any>) =>
      handleAuthError(error, context),
    handleNetworkError: (error: Error | any, context?: Record<string, any>) =>
      handleNetworkError(error, context),
    handleServerError: (error: Error | any, context?: Record<string, any>) =>
      handleServerError(error, context),
    getErrorLog: () => errorService.getErrorLog(),
    clearErrorLog: () => errorService.clearErrorLog(),
  };
};
