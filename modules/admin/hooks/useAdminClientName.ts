import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export const useAdminClientName = (clientId?: string) => {
  const { get } = useAuthenticatedFetch();
  const [name, setName] = useState<string>('Cliente');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchName = async () => {
      if (!clientId) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await get<{ success: boolean; company_name: string | null; error?: string }>(
          `/api/admin/client-profile?clientId=${clientId}`
        );
        if (resp.ok && resp.data?.success) {
          setName(resp.data.company_name || 'Cliente');
        } else {
          setError(resp.data?.error || resp.error || 'Erro ao carregar nome do cliente');
        }
      } catch (e) {
        setError('Erro ao carregar nome do cliente');
      } finally {
        setLoading(false);
      }
    };
    fetchName();
  }, [clientId, get]);

  return { name, loading, error };
};
