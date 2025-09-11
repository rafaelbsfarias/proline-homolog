import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { AddressItem } from '@/modules/client/types';

interface UseAddressesResult {
  addresses: AddressItem[];
  collectPoints: AddressItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useAddresses = (): UseAddressesResult => {
  const { get } = useAuthenticatedFetch();
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggerRefetch, setTriggerRefetch] = useState(0);

  const refetch = useCallback(() => {
    setTriggerRefetch(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchAddresses = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await get<{ success: boolean; addresses: AddressItem[]; error?: string }>(
          '/api/client/addresses'
        );
        if (response.ok && response.data?.success) {
          setAddresses(response.data.addresses || []);
        } else {
          setError(response.data?.error || response.error || 'Erro ao buscar endereços.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro de rede ou desconhecido ao buscar endereços.');
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [get, triggerRefetch]);

  const collectPoints = addresses.filter(a => a.is_collect_point);

  return { addresses, collectPoints, loading, error, refetch };
};