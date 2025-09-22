import { useCallback, useEffect, useState, useMemo } from 'react';
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

const PAGE_SIZE = 10;

interface UseClientVehiclesResult {
  vehicles: VehicleData[];
  loading: boolean;
  error: string | null;
  isSubmitting: Record<string, boolean>;
  refetch: () => void;
  confirmVehicleArrival: (vehicleId: string) => Promise<void>;
  startVehicleAnalysis: (vehicleId: string) => Promise<void>;
  // Pagination state and handlers
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  totalCount: number;
  /* statusCounts: Record<string, number>; */
}

export const useClientVehicles = (
  clientId?: string,
  filters?: { plate?: string; status?: string }
): UseClientVehiclesResult => {
  const { get, post } = useAuthenticatedFetch();
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  /* const [statusCounts, setStatusCounts] = useState<Record<string, number>>({}); */
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

  const totalPages = useMemo(() => Math.ceil(totalCount / PAGE_SIZE), [totalCount]);

  const refetch = useCallback(() => {
    setCurrentPage(1); // Always refetch from page 1
  }, []);

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
        throw new Error(response.data?.error || 'Falha ao confirmar chegada');
      }
    } finally {
      setIsSubmitting(prev => ({ ...prev, [vehicleId]: false }));
    }
  };

  const startVehicleAnalysis = async (vehicleId: string) => {
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
      console.error(e);
      throw e;
    }
  };

  useEffect(() => {
    // Reset page to 1 when client or filters change
    setCurrentPage(1);
  }, [clientId, filters]);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!clientId) {
        setVehicles([]);
        setTotalCount(0);
        /* setStatusCounts({}); */
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('clientId', clientId);

        const response = await get<{
          success: boolean;
          vehicles: VehicleData[];
          totalCount: number;
          /*  statusCounts: Record<string, number>; */
          error?: string;
        }>(`/api/specialist/client-vehicles?${queryParams.toString()}`);

        if (response.ok && response.data?.success) {
          let allVehicles = response.data.vehicles || [];

          const plateFilter = filters?.plate?.toLowerCase() ?? '';

          if (plateFilter) {
            allVehicles = allVehicles.filter(v => v.plate.toLowerCase().includes(plateFilter));
          }

          if (filters?.status) {
            allVehicles = allVehicles.filter(v => v.status === filters.status);
          }

          setTotalCount(allVehicles.length);

          const paginatedVehicles = allVehicles.slice(
            (currentPage - 1) * PAGE_SIZE,
            currentPage * PAGE_SIZE
          );
          setVehicles(paginatedVehicles);
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
  }, [clientId, currentPage, get, filters]);

  return {
    vehicles,
    loading,
    error,
    refetch,
    isSubmitting,
    confirmVehicleArrival,
    startVehicleAnalysis,
    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,
    totalCount,
    /*  statusCounts, */
  };
};
