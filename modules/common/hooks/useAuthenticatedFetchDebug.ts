import { useCallback } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import { ErrorHandlerService, ErrorType } from '@/modules/common/services/ErrorHandlerService';

/**
 * Hook personalizado para fazer requisições autenticadas com debug
 */
export interface AuthenticatedFetchOptions extends RequestInit {
  requireAuth?: boolean;
  debug?: boolean;
}

export interface AuthenticatedFetchResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
  ok: boolean;
}

export const useAuthenticatedFetch = () => {
  const errorHandler = ErrorHandlerService.getInstance();

  const authenticatedFetch = useCallback(
    async <T = unknown>(
      url: string,
      options: AuthenticatedFetchOptions = {}
    ): Promise<AuthenticatedFetchResponse<T>> => {
      try {
        const { requireAuth = true, debug = false, headers = {}, ...restOptions } = options;

        if (debug) {
          // eslint-disable-next-line no-console
          console.log('🔍 DEBUG: Iniciando requisição autenticada para:', url);
        }

        // Preparar headers base
        const requestHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(headers as Record<string, string>),
        };

        // Se requer autenticação, obter e incluir token
        if (requireAuth) {
          if (debug) {
            // eslint-disable-next-line no-console
            console.log('🔍 DEBUG: Obtendo sessão do Supabase...');
          }

          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            if (debug) {
              // eslint-disable-next-line no-console
              console.error('🔍 DEBUG: Erro ao obter sessão:', sessionError);
            }

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

          if (debug) {
            // eslint-disable-next-line no-console
            console.log('🔍 DEBUG: Sessão obtida:', {
              hasSession: !!session,
              hasToken: !!session?.access_token,
              tokenStart: session?.access_token?.substring(0, 20) + '...',
              user: session?.user?.email,
            });
          }

          if (!session?.access_token) {
            if (debug) {
              // eslint-disable-next-line no-console
              console.warn('🔍 DEBUG: Nenhum token de acesso encontrado na sessão');
            }

            return {
              error: 'Usuário não autenticado',
              status: 401,
              ok: false,
            };
          }

          // Incluir token Bearer no header de autorização
          requestHeaders['Authorization'] = `Bearer ${session.access_token}`;

          if (debug) {
            // eslint-disable-next-line no-console
            console.log('🔍 DEBUG: Headers da requisição:', {
              ...requestHeaders,
              Authorization: 'Bearer ' + session.access_token.substring(0, 20) + '...',
            });
          }
        }

        if (debug) {
          // eslint-disable-next-line no-console
          console.log('🔍 DEBUG: Fazendo requisição:', {
            url,
            method: restOptions.method || 'GET',
          });
        }

        // Fazer requisição
        const response = await fetch(url, {
          ...restOptions,
          headers: requestHeaders,
        });

        if (debug) {
          // eslint-disable-next-line no-console
          console.log('🔍 DEBUG: Resposta recebida:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
          });
        }

        // Verificar status da resposta
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;

          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // Se não conseguir parsear JSON, usar mensagem de status
            errorMessage = response.statusText || errorMessage;
          }

          if (debug) {
            // eslint-disable-next-line no-console
            console.error('🔍 DEBUG: Erro na resposta:', errorMessage);
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

          if (debug) {
            // eslint-disable-next-line no-console
            console.log('🔍 DEBUG: Dados parseados com sucesso:', data);
          }
        } catch (parseError) {
          if (debug) {
            // eslint-disable-next-line no-console
            console.error('🔍 DEBUG: Erro ao parsear JSON:', parseError);
          }

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
   * GET com autenticação e debug opcional
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
