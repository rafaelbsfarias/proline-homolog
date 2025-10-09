/**
 * useChecklistCache Hook
 *
 * Hook otimizado para cache de status de checklist com:
 * - Cache em memória com TTL configurável
 * - Debounce de requisições simultâneas
 * - Invalidação automática
 * - Batching de verificações
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

interface CacheEntry {
  hasChecklist: boolean;
  timestamp: number;
}

interface UseChecklistCacheOptions {
  cacheTTL?: number; // Tempo de vida do cache em ms (padrão: 30 segundos)
  debounceMs?: number; // Debounce para múltiplas chamadas (padrão: 300ms)
  maxConcurrent?: number; // Máximo de requisições simultâneas (padrão: 3)
}

export function useChecklistCache(options: UseChecklistCacheOptions = {}) {
  const {
    cacheTTL = 30000, // 30 segundos
    debounceMs = 300,
    maxConcurrent = 3,
  } = options;

  const { post } = useAuthenticatedFetch();

  // Cache em memória: Map<quoteId, CacheEntry>
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  // Fila de requisições pendentes: Map<quoteId, Promise>
  const pendingRequestsRef = useRef<Map<string, Promise<boolean>>>(new Map());

  // Debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Contador de requisições simultâneas
  const activeRequestsRef = useRef<number>(0);

  // Estado para forçar re-render quando necessário
  const [cacheVersion, setCacheVersion] = useState(0);

  /**
   * Verifica se uma entrada do cache ainda é válida
   */
  const isCacheValid = useCallback(
    (entry: CacheEntry): boolean => {
      return Date.now() - entry.timestamp < cacheTTL;
    },
    [cacheTTL]
  );

  /**
   * Busca do cache (se válido)
   */
  const getFromCache = useCallback(
    (quoteId: string): boolean | null => {
      const entry = cacheRef.current.get(quoteId);
      if (!entry) return null;

      if (!isCacheValid(entry)) {
        cacheRef.current.delete(quoteId);
        return null;
      }

      return entry.hasChecklist;
    },
    [isCacheValid]
  );

  /**
   * Salva no cache
   */
  const saveToCache = useCallback((quoteId: string, hasChecklist: boolean) => {
    cacheRef.current.set(quoteId, {
      hasChecklist,
      timestamp: Date.now(),
    });
    setCacheVersion(v => v + 1);
  }, []);

  /**
   * Verifica checklist de um único quote (com cache)
   */
  const checkSingleQuote = useCallback(
    async (quoteId: string): Promise<boolean> => {
      // 1. Tentar cache primeiro
      const cached = getFromCache(quoteId);
      if (cached !== null) {
        return cached;
      }

      // 2. Se já tem requisição pendente, reusar
      const pending = pendingRequestsRef.current.get(quoteId);
      if (pending) {
        return pending;
      }

      // 3. Limitar requisições simultâneas
      if (activeRequestsRef.current >= maxConcurrent) {
        // Aguardar um pouco antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 100));
        return checkSingleQuote(quoteId);
      }

      // 4. Fazer nova requisição
      const promise = (async () => {
        activeRequestsRef.current++;

        try {
          let attempts = 0;
          const maxAttempts = 2;

          while (attempts < maxAttempts) {
            try {
              const response = await post<{ hasChecklist: boolean }>(
                '/api/partner/checklist/exists',
                { quoteId },
                { requireAuth: true }
              );

              const result = response.data?.hasChecklist ?? false;
              saveToCache(quoteId, result);
              return result;
            } catch (err) {
              attempts++;
              if (attempts >= maxAttempts) {
                // Em caso de erro, assumir que não tem checklist
                saveToCache(quoteId, false);
                return false;
              }
              // Aguardar antes de tentar novamente
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          return false;
        } finally {
          activeRequestsRef.current--;
          pendingRequestsRef.current.delete(quoteId);
        }
      })();

      pendingRequestsRef.current.set(quoteId, promise);
      return promise;
    },
    [getFromCache, saveToCache, post, maxConcurrent]
  );

  /**
   * Verifica múltiplos quotes em lote (com batching inteligente)
   */
  const checkMultipleQuotes = useCallback(
    async (quoteIds: string[]): Promise<Map<string, boolean>> => {
      const results = new Map<string, boolean>();
      const toCheck: string[] = [];

      // Separar: cache hits vs cache misses
      for (const quoteId of quoteIds) {
        const cached = getFromCache(quoteId);
        if (cached !== null) {
          results.set(quoteId, cached);
        } else {
          toCheck.push(quoteId);
        }
      }

      // Se não há nada para verificar, retornar
      if (toCheck.length === 0) {
        return results;
      }

      // Verificar em lotes de acordo com maxConcurrent
      const batches: string[][] = [];
      for (let i = 0; i < toCheck.length; i += maxConcurrent) {
        batches.push(toCheck.slice(i, i + maxConcurrent));
      }

      for (const batch of batches) {
        const batchResults = await Promise.all(batch.map(quoteId => checkSingleQuote(quoteId)));

        batch.forEach((quoteId, index) => {
          results.set(quoteId, batchResults[index]);
        });
      }

      return results;
    },
    [getFromCache, checkSingleQuote, maxConcurrent]
  );

  /**
   * Verifica múltiplos quotes com debounce
   */
  const checkMultipleQuotesDebounced = useCallback(
    (quoteIds: string[], callback: (results: Map<string, boolean>) => void) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        const results = await checkMultipleQuotes(quoteIds);
        callback(results);
      }, debounceMs);
    },
    [checkMultipleQuotes, debounceMs]
  );

  /**
   * Invalida cache de um ou todos quotes
   */
  const invalidateCache = useCallback((quoteId?: string) => {
    if (quoteId) {
      cacheRef.current.delete(quoteId);
    } else {
      cacheRef.current.clear();
    }
    setCacheVersion(v => v + 1);
  }, []);

  /**
   * Força atualização de um quote (bypass cache)
   */
  const refreshQuote = useCallback(
    async (quoteId: string): Promise<boolean> => {
      invalidateCache(quoteId);
      return checkSingleQuote(quoteId);
    },
    [invalidateCache, checkSingleQuote]
  );

  /**
   * Cleanup ao desmontar
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    // Métodos principais
    checkSingleQuote,
    checkMultipleQuotes,
    checkMultipleQuotesDebounced,

    // Controle de cache
    invalidateCache,
    refreshQuote,
    getFromCache,

    // Estado
    cacheSize: cacheRef.current.size,
    activeRequests: activeRequestsRef.current,
    cacheVersion, // Força re-render quando cache muda
  };
}
