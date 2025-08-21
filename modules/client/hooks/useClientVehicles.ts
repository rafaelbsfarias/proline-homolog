import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { VehicleInfo } from '@/modules/client/types';

interface UseClientVehiclesResult {
  vehicles: VehicleInfo[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useClientVehicles = (): UseClientVehiclesResult => {
  const { get } = useAuthenticatedFetch();
  const [vehicles, setVehicles] = useState<VehicleInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggerRefetch, setTriggerRefetch] = useState(0);

  const refetch = useCallback(() => {
    setTriggerRefetch(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await get<{ success: boolean; vehicles: VehicleInfo[]; error?: string }>(
          '/api/client/vehicles-count'
        );
        if (response.ok && response.data?.success) {
          setVehicles(response.data.vehicles || []);
        } else {
          setError(response.data?.error || response.error || 'Erro ao buscar veículos.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro de rede ou desconhecido ao buscar veículos.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [get, triggerRefetch]);

  return { vehicles, loading, error, refetch };
};