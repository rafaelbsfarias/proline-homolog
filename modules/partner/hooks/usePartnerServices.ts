import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

// --- Tipos de Dados ---
export interface PartnerService {
  id: string;
  name: string;
  description: string;
  price: number;
  category?: string | null; // Categoria é opcional e pode ser nula
  isActive?: boolean; // Mudado de is_active para isActive (camelCase)
  reviewStatus?: 'approved' | 'pending_review' | 'in_revision'; // Mudado de review_status
  reviewFeedback?: string | null; // Mudado de review_feedback
  reviewRequestedAt?: string | null; // Mudado de review_requested_at
  partnerId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface UpdateServiceData {
  name: string;
  description: string;
  price: number;
  category: string;
}

// --- Hook ---
export function usePartnerServices() {
  const [services, setServices] = useState<PartnerService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { authenticatedFetch } = useAuthenticatedFetch();

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch('/api/partner/services/v2');

      if (response.ok && response.data) {
        // authenticatedFetch retorna: { data: <json completo da API>, ok, status }
        // API V2 retorna: { success: true, data: { items: [], pagination: {} } }
        const apiResponse = response.data as {
          success: boolean;
          data: {
            items: PartnerService[];
            pagination: {
              page: number;
              limit: number;
              total: number;
              totalPages: number;
            };
          };
        };

        // Acessar items dentro de data.data
        if (apiResponse.success && apiResponse.data?.items) {
          const items = apiResponse.data.items;
          setServices(Array.isArray(items) ? items : []);
        } else {
          setServices([]);
        }
      } else {
        setError(response.error || 'Erro ao buscar serviços');
        setServices([]);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido';
      setError(errorMessage);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  const updateService = useCallback(
    async (serviceId: string, data: UpdateServiceData) => {
      try {
        const response = await authenticatedFetch(`/api/partner/services/v2/${serviceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.ok && response.data) {
          // Atualizar o serviço na lista local
          setServices(prevServices =>
            prevServices.map(service =>
              service.id === serviceId ? { ...service, ...data } : service
            )
          );
          return { success: true, message: 'Serviço atualizado com sucesso' };
        } else {
          throw new Error(response.error || 'Erro ao atualizar serviço');
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Erro ao atualizar serviço';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [authenticatedFetch]
  );

  const deleteService = useCallback(
    async (serviceId: string) => {
      try {
        const response = await authenticatedFetch(`/api/partner/services/v2/${serviceId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Remover o serviço da lista local
          setServices(prevServices => prevServices.filter(service => service.id !== serviceId));
          return { success: true, message: 'Serviço excluído com sucesso' };
        } else {
          throw new Error(response.error || 'Erro ao excluir serviço');
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Erro ao excluir serviço';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [authenticatedFetch]
  );

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return {
    services,
    loading,
    error,
    reloadServices: fetchServices,
    updateService,
    deleteService,
  };
}
