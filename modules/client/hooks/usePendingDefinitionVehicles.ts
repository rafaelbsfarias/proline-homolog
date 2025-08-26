import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { VehicleItem } from '@/modules/client/types';

export interface PendingDefinitionVehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
}

export const usePendingDefinitionVehicles = () => {
  const { get, post } = useAuthenticatedFetch();
  const [vehicles, setVehicles] = useState<PendingDefinitionVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get<{ success: boolean; vehicles: VehicleItem[]; error?: string }>(
        '/api/client/vehicles-count'
      );
      if (response.ok && response.data?.success) {
        const all = response.data.vehicles || [];
        const pending = all
          .filter(
            v =>
              String(v.status || '')
                .toUpperCase()
                .trim() === 'AGUARDANDO DEFINIÇÃO DE COLETA'
          )
          .map(v => ({ id: v.id, plate: v.plate, model: v.model, brand: v.brand }));
        setVehicles(pending);
      } else {
        throw new Error(response.data?.error || response.error || 'Falha ao buscar veículos.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const setCollectionMethod = async (payload: {
    vehicleIds: string[];
    method: 'collect_point' | 'bring_to_yard';
    addressId?: string;
    estimated_arrival_date?: string;
  }) => {
    try {
      const response = await post('/api/client/set-vehicles-collection', payload);
      if (!response.ok) {
        throw new Error(response.error || 'Falha ao definir método de coleta.');
      }
      await fetchVehicles();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  return { vehicles, loading, error, fetchVehicles, setCollectionMethod };
};
