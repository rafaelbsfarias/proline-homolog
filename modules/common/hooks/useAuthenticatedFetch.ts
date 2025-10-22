import { useCallback } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import { ErrorHandlerService, ErrorType } from '@/modules/common/services/ErrorHandlerService';

/**
 * Hook personalizado para fazer requisições autenticadas
 *
 * Responsabilidades:
 * - Obter token de sessão do Supabase automaticamente
 * - Incluir token de autorização nas requisições
 * - Tratar erros de autenticação de forma consistente
 * - Fornecer interface simples para componentes
 */
export interface AuthenticatedFetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export interface AuthenticatedFetchResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
  ok: boolean;
}

export const useAuthenticatedFetch = () => {
  const errorHandler = ErrorHandlerService.getInstance();

  /**
   * Faz requisição autenticada incluindo Bearer token
   */
  const authenticatedFetch = useCallback(
    async <T = unknown>(
      url: string,
      options: AuthenticatedFetchOptions = {}
    ): Promise<AuthenticatedFetchResponse<T>> => {
      try {
        const { requireAuth = true, headers = {}, ...restOptions } = options;

        // Preparar headers base
        const requestHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(headers as Record<string, string>),
        };

        // Se requer autenticação, obter e incluir token
        if (requireAuth) {
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            errorHandler.handleError(sessionError, ErrorType.AUTHENTICATION, {
              showToUser: false,
              context: { action: 'getSession', url },
            });

            return {
              error: 'Erro ao obter sessão de autenticação',
              status: 401,
              ok: false,
            };
          }

          if (!session?.access_token) {
            return {
              error: 'Usuário não autenticado',
              status: 401,
              ok: false,
            };
          }

          // Incluir token Bearer no header de autorização
          requestHeaders['Authorization'] = `Bearer ${session.access_token}`;
        }

        // Fazer requisição
        const response = await fetch(url, {
          ...restOptions,
          headers: requestHeaders,
        });

        // Verificar status da resposta
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;

          try {
            const errorData = await response.json();
            // Handle structured error responses from API
            if (errorData && typeof errorData === 'object' && errorData.error) {
              if (typeof errorData.error === 'string') {
                errorMessage = errorData.error;
              } else if (
                errorData.error &&
                typeof errorData.error === 'object' &&
                errorData.error.message
              ) {
                errorMessage = errorData.error.message;
              } else {
                errorMessage = errorData.message || errorMessage;
              }
            } else {
              errorMessage = errorData.message || errorData.error || errorMessage;
            }
          } catch {
            // Se não conseguir parsear JSON, usar mensagem de status
            errorMessage = response.statusText || errorMessage;
          }

          errorHandler.handleError(new Error(errorMessage), ErrorType.SERVER, {
            showToUser: false,
            context: {
              url,
              status: response.status,
              method: restOptions.method || 'GET',
            },
          });

          return {
            error: errorMessage,
            status: response.status,
            ok: false,
          };
        }

        // Parse da resposta JSON
        let data: T;
        try {
          data = await response.json();
        } catch (parseError) {
          // Se a resposta não for JSON válido
          errorHandler.handleError(parseError as Error, ErrorType.SERVER, {
            showToUser: false,
            context: { url, action: 'parseResponse' },
          });

          return {
            error: 'Erro ao processar resposta do servidor',
            status: response.status,
            ok: false,
          };
        }

        return {
          data,
          status: response.status,
          ok: true,
        };
      } catch (error) {
        errorHandler.handleError(error as Error, ErrorType.NETWORK, {
          showToUser: false,
          context: { url, action: 'fetch' },
        });

        return {
          error: 'Erro de rede ou conexão',
          status: 0,
          ok: false,
        };
      }
    },
    [errorHandler]
  );

  /**
   * GET com autenticação
   */
  const get = useCallback(
    <T = unknown>(url: string, options?: AuthenticatedFetchOptions) => {
      return authenticatedFetch<T>(url, { ...options, method: 'GET' });
    },
    [authenticatedFetch]
  );

  /**
   * POST com autenticação
   */
  const post = useCallback(
    <T = unknown>(url: string, body?: unknown, options?: AuthenticatedFetchOptions) => {
      return authenticatedFetch<T>(url, {
        ...options,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
    },
    [authenticatedFetch]
  );

  /**
   * PUT com autenticação
   */
  const put = useCallback(
    <T = unknown>(url: string, body?: unknown, options?: AuthenticatedFetchOptions) => {
      return authenticatedFetch<T>(url, {
        ...options,
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      });
    },
    [authenticatedFetch]
  );

  /**
   * DELETE com autenticação
   */
  const del = useCallback(
    <T = unknown>(url: string, options?: AuthenticatedFetchOptions) => {
      return authenticatedFetch<T>(url, { ...options, method: 'DELETE' });
    },
    [authenticatedFetch]
  );

  return {
    authenticatedFetch,
    get,
    post,
    put,
    delete: del,
  };
};
