import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

// --- Tipos de Dados ---
export interface PartnerService {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string | null; // Categoria é opcional e pode ser nula
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
      const response = await authenticatedFetch('/api/partner/list-services');
      if (response.data) {
        setServices(response.data as PartnerService[]);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido';
      setError(errorMessage);
      console.error('Falha ao buscar serviços:', e);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return { services, loading, error, reloadServices: fetchServices };
}
