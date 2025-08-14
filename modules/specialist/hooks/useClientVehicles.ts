import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export interface VehicleData {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  status?: string;
}

interface UseClientVehiclesResult {
  vehicles: VehicleData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useClientVehicles = (clientId?: string): UseClientVehiclesResult => {
  const { get } = useAuthenticatedFetch();
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggerRefetch, setTriggerRefetch] = useState(0);

  const refetch = () => setTriggerRefetch(v => v + 1);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!clientId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await get<{ success: boolean; vehicles: VehicleData[]; error?: string }>(
          `/api/specialist/client-vehicles?clientId=${clientId}`
        );
        if (response.ok && response.data?.success) {
          setVehicles(response.data.vehicles);
        } else {
          setError(response.data?.error || response.error || 'Erro ao buscar veículos.');
        }
      } catch (e) {
        setError('Erro de rede ou desconhecido ao buscar veículos.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [clientId, get, triggerRefetch]);

  return { vehicles, loading, error, refetch };
};
