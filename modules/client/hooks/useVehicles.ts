import { useCallback, useEffect, useState } from 'react';
import { useClientApi, VehiclesApiResponse } from '@/modules/client/services/clientApi';
import type { Vehicle } from '@/modules/client/types';

function normalizeVehiclesPayload(payload: VehiclesApiResponse): { count: number; vehicles: Vehicle[] } {
  const listFromVehicles = Array.isArray(payload.vehicles) ? (payload.vehicles as Vehicle[]) : [];
  const listFromData =
    Array.isArray(payload.data) ? (payload.data as Vehicle[]) :
    (payload.data && typeof payload.data === 'object' && Array.isArray((payload.data as any).vehicles))
      ? ((payload.data as any).vehicles as Vehicle[])
      : [];

  const vehicles = listFromVehicles.length ? listFromVehicles : listFromData;

  const count =
    typeof payload.count === 'number' ? payload.count :
    typeof payload.vehicle_count === 'number' ? payload.vehicle_count :
    vehicles.length;

  return { count, vehicles };
}

export function useVehicles(onRefresh?: () => void) {
  const { getVehiclesCount } = useClientApi();
  const [count, setCount] = useState<number>(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getVehiclesCount();
      if (!response.ok) throw new Error(response.error || 'Erro ao buscar contagem de veículos');
      const payload = (response.data ?? {}) as VehiclesApiResponse;
      const { count: normalizedCount, vehicles: normalizedVehicles } = normalizeVehiclesPayload(payload);
      setCount(normalizedCount);
      setVehicles(normalizedVehicles);
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [getVehiclesCount, onRefresh]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  return { count, vehicles, loading, error, refetch: fetchVehicles };
}

