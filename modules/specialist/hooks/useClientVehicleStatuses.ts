import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

interface UseClientVehicleStatusesResult {
  statuses: string[];
  loading: boolean;
  error: string | null;
}

export const useClientVehicleStatuses = (clientId?: string): UseClientVehicleStatusesResult => {
  const { get } = useAuthenticatedFetch();
  const [statuses, setStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatuses = async () => {
      if (!clientId) {
        setStatuses([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await get<{ success: boolean; statuses: string[]; error?: string }>(
          `/api/specialist/client-vehicle-statuses?clientId=${clientId}`
        );

        if (response.ok && response.data?.success) {
          setStatuses(response.data.statuses || []);
        } else {
          setError(response.data?.error || response.error || 'Erro ao buscar status de veículos.');
        }
      } catch (e) {
        setError('Erro de rede ou desconhecido ao buscar status de veículos.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatuses();
  }, [clientId, get]);

  return { statuses, loading, error };
};
