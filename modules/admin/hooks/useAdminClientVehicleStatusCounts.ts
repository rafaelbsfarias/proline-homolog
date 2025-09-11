import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export const useAdminClientVehicleStatusCounts = (clientId?: string) => {
  const { get } = useAuthenticatedFetch();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!clientId) {
        setCounts({});
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const resp = await get<{
          success: boolean;
          counts: Record<string, number>;
          error?: string;
        }>(`/api/admin/client-vehicle-status-counts?clientId=${clientId}`);
        if (resp.ok && resp.data?.success) {
          setCounts(resp.data.counts || {});
        } else {
          setError(resp.data?.error || resp.error || 'Erro ao carregar contagens');
        }
      } catch (e) {
        setError('Erro ao carregar contagens');
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, [clientId, get]);

  return { counts, loading, error };
};
