import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { VehicleItem } from '@/modules/client/types';

interface UseVehiclesResult {
  count: number;
  vehicles: VehicleItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// DEPRECATED: Use useVehicleManager instead for full CRUD operations
// This hook is kept for backward compatibility but should be replaced
export const useVehicles = (onRefresh?: () => void): UseVehiclesResult => {
  const { get } = useAuthenticatedFetch();
  const [count, setCount] = useState(0);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loading, setLoading] = useState(true);
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
        const response = await get<{
          success: boolean;
          vehicles: VehicleItem[];
          count?: number;
          error?: string;
        }>('/api/client/vehicles-count');
        if (response.ok && response.data?.success) {
          const vehicleList = response.data.vehicles || [];
          const vehicleCount = response.data.count ?? vehicleList.length;
          setVehicles(vehicleList);
          setCount(vehicleCount);
          onRefresh?.();
        } else {
          setError(response.data?.error || response.error || 'Erro ao buscar veículos.');
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Erro de rede ou desconhecido ao buscar veículos.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [get, triggerRefetch, onRefresh]);

  return { count, vehicles, loading, error, refetch };
};
