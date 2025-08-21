import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { useCallback } from 'react';

export interface VehiclesApiResponse {
  success?: boolean;
  message?: string;
  count?: number;
  vehicle_count?: number;
  vehicles?: any[];
  data?: unknown;
}

export function useClientApi() {
  const { get, post } = useAuthenticatedFetch();

  const getVehiclesCount = useCallback(async () => {
    const response = await get<VehiclesApiResponse>('/api/client/vehicles-count');
    return response;
  }, [get]);

  const setVehiclesCollection = useCallback(async (payload: any) => {
    const response = await post('/api/client/set-vehicles-collection', payload);
    return response;
  }, [post]);

  return { getVehiclesCount, setVehiclesCollection };
}
