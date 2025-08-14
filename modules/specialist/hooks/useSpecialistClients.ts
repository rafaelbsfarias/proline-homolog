import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

interface ClientData {
  client_id: string;
  client_full_name: string;
  vehicle_count: number;
}

interface UseSpecialistClientsResult {
  clients: ClientData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useSpecialistClients = (): UseSpecialistClientsResult => {
  const { get } = useAuthenticatedFetch();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggerRefetch, setTriggerRefetch] = useState(0);

  const refetch = () => {
    setTriggerRefetch(prev => prev + 1);
  };

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await get<{ success: boolean; clients: ClientData[]; error?: string }>(
          '/api/specialist/my-clients'
        );
        if (response.ok && response.data?.success) {
          setClients(response.data.clients);
        } else {
          setError(response.data?.error || response.error || 'Erro ao buscar clientes.');
        }
      } catch (error) {
        setError('Erro de rede ou desconhecido ao buscar clientes.');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [get, triggerRefetch]);

  return { clients, loading, error, refetch };
};
