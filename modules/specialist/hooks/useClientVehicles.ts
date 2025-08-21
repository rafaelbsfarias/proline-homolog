import { useCallback, useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';

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
  isSubmitting: Record<string, boolean>;
  refetch: () => void;
  confirmVehicleArrival: (vehicleId: string) => Promise<void>;
  startVehicleAnalysis: (vehicleId: string) => Promise<void>;
}

export const useClientVehicles = (clientId?: string): UseClientVehiclesResult => {
  const { get, post } = useAuthenticatedFetch();
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [triggerRefetch, setTriggerRefetch] = useState(0);

  const refetch = useCallback(() => setTriggerRefetch(v => v + 1), []);

  const updateVehicleStatus = (vehicleId: string, newStatus: string) => {
    setVehicles(prev => prev.map(v => (v.id === vehicleId ? { ...v, status: newStatus } : v)));
  };

  const confirmVehicleArrival = async (vehicleId: string) => {
    setIsSubmitting(prev => ({ ...prev, [vehicleId]: true }));
    try {
      const response = await post<{ success: boolean; error?: string }>(
        '/api/specialist/confirm-arrival',
        { vehicleId }
      );
      if (response.ok) {
        updateVehicleStatus(vehicleId, VehicleStatus.CHEGADA_CONFIRMADA);
      } else {
        // Optionally bubble up the error to the UI
        throw new Error(response.data?.error || 'Falha ao confirmar chegada');
      }
    } finally {
      setIsSubmitting(prev => ({ ...prev, [vehicleId]: false }));
    }
  };

  const startVehicleAnalysis = async (vehicleId: string) => {
    // No submitting state change needed if it just opens a modal
    try {
      const response = await post<{ success: boolean; error?: string }>(
        '/api/specialist/start-analysis',
        { vehicleId }
      );
      if (response.ok) {
        updateVehicleStatus(vehicleId, VehicleStatus.EM_ANALISE);
      } else {
        throw new Error(response.data?.error || 'Falha ao iniciar análise');
      }
    } catch (e) {
      // Handle or throw error
      console.error(e);
      throw e;
    }
  };

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!clientId) {
        setVehicles([]);
        return;
      }
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

  return {
    vehicles,
    loading,
    error,
    refetch,
    isSubmitting,
    confirmVehicleArrival,
    startVehicleAnalysis,
  };
};
