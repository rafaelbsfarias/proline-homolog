import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export interface BaseEntity {
  id: string;
  created_at?: string;
}

export interface CrudResult<T extends BaseEntity> {
  items: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  create: (data: Omit<T, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  update: (id: string, data: Partial<T>) => Promise<{ success: boolean; error?: string }>;
  delete: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
  items?: T[];
  vehicles?: T[];
}

export interface CrudOptions<T extends BaseEntity> {
  baseUrl: string;
  onRefresh?: () => void;
  transformResponse?: (data: ApiResponse) => T[];
  getCountFromResponse?: (data: ApiResponse) => number;
}

export function useCrud<T extends BaseEntity>(options: CrudOptions<T>): CrudResult<T> {
  const { get, post, put, delete: del } = useAuthenticatedFetch();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggerRefetch, setTriggerRefetch] = useState(0);

  const refetch = useCallback(() => {
    setTriggerRefetch(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await get<ApiResponse>(options.baseUrl);

        if (response.ok && response.data?.success) {
          const transformedItems = options.transformResponse
            ? options.transformResponse(response.data)
            : ((response.data.items || response.data.vehicles || []) as T[]);
          setItems(transformedItems);
          options.onRefresh?.();
        } else {
          setError(response.data?.error || response.error || `Erro ao buscar ${options.baseUrl}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : `Erro de rede ao buscar ${options.baseUrl}`);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [get, triggerRefetch, options.baseUrl, options.onRefresh, options.transformResponse]);

  const create = async (data: Omit<T, 'id' | 'created_at'>) => {
    try {
      const response = await post<ApiResponse>(`${options.baseUrl}/create`, data);

      if (response.ok && response.data?.success) {
        refetch();
        return { success: true };
      } else {
        return {
          success: false,
          error: response.data?.error || response.error || 'Erro ao criar item',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro de rede ao criar item',
      };
    }
  };

  const update = async (id: string, data: Partial<T>) => {
    try {
      const response = await put<ApiResponse>(`${options.baseUrl}/update/${id}`, data);

      if (response.ok && response.data?.success) {
        refetch();
        return { success: true };
      } else {
        return {
          success: false,
          error: response.data?.error || response.error || 'Erro ao atualizar item',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro de rede ao atualizar item',
      };
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const response = await del<ApiResponse>(`${options.baseUrl}/delete/${id}`);

      if (response.ok && response.data?.success) {
        refetch();
        return { success: true };
      } else {
        return {
          success: false,
          error: response.data?.error || response.error || 'Erro ao deletar item',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro de rede ao deletar item',
      };
    }
  };

  return {
    items,
    loading,
    error,
    refetch,
    create,
    update,
    delete: deleteItem,
  };
}
