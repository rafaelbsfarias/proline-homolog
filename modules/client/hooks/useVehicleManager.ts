import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { VehicleData } from '@/modules/client/types/index';

const ITEMS_PER_PAGE = 10;

interface UseVehicleManagerResult {
  vehicles: VehicleData[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => void;
  createVehicle: (
    vehicleData: Omit<VehicleData, 'id' | 'created_at'>
  ) => Promise<{ success: boolean; error?: string }>;
  updateVehicle: (
    vehicleId: string,
    vehicleData: Partial<VehicleData>
  ) => Promise<{ success: boolean; error?: string }>;
  deleteVehicle: (vehicleId: string) => Promise<{ success: boolean; error?: string }>;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface HookOptions {
  paginated?: boolean;
  filterPlate?: string;
  filterStatus?: string;
}

export const useVehicleManager = (options?: HookOptions): UseVehicleManagerResult => {
  const { get, post, put, delete: del } = useAuthenticatedFetch();
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggerRefetch, setTriggerRefetch] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const refetch = useCallback(() => {
    setTriggerRefetch(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (options?.paginated) {
          params.append('page', currentPage.toString());
          params.append('limit', ITEMS_PER_PAGE.toString());
        }
        if (options?.filterPlate) {
          params.append('plate', options.filterPlate);
        }
        if (options?.filterStatus) {
          params.append('status', options.filterStatus);
        }

        const url = `/api/client/vehicles-count?${params.toString()}`;

        const response = await get<{
          success: boolean;
          vehicles: VehicleData[];
          totalCount?: number;
          error?: string;
        }>(url);

        if (response.ok && response.data?.success) {
          setVehicles(response.data.vehicles || []);
          if (options?.paginated && typeof response.data.totalCount === 'number') {
            setTotalCount(response.data.totalCount);
          } else {
            setTotalCount(response.data.vehicles?.length || 0);
          }
        } else {
          setError(response.data?.error || response.error || 'Erro ao buscar veículos');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro de rede ao buscar veículos');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [
    get,
    triggerRefetch,
    currentPage,
    options?.paginated,
    options?.filterPlate,
    options?.filterStatus,
  ]);

  const createVehicle = async (vehicleData: Omit<VehicleData, 'id' | 'created_at'>) => {
    try {
      const response = await post<{ success: boolean; vehicle?: VehicleData; error?: string }>(
        '/api/client/create-vehicle',
        vehicleData
      );

      if (response.ok && response.data?.success) {
        refetch();
        return { success: true };
      } else {
        return {
          success: false,
          error: response.data?.error || response.error || 'Erro ao criar veículo',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro de rede ao criar veículo',
      };
    }
  };

  const updateVehicle = async (vehicleId: string, vehicleData: Partial<VehicleData>) => {
    try {
      const response = await put<{ success: boolean; vehicle?: VehicleData; error?: string }>(
        `/api/client/update-vehicle/${vehicleId}`,
        vehicleData
      );

      if (response.ok && response.data?.success) {
        refetch();
        return { success: true };
      } else {
        return {
          success: false,
          error: response.data?.error || response.error || 'Erro ao atualizar veículo',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro de rede ao atualizar veículo',
      };
    }
  };

  const deleteVehicle = async (vehicleId: string) => {
    try {
      const response = await del<{ success: boolean; error?: string }>(
        `/api/client/delete-vehicle/${vehicleId}`
      );

      if (response.ok && response.data?.success) {
        refetch();
        return { success: true };
      } else {
        return {
          success: false,
          error: response.data?.error || response.error || 'Erro ao deletar veículo',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro de rede ao deletar veículo',
      };
    }
  };

  return {
    vehicles,
    loading,
    error,
    totalCount,
    refetch,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    currentPage,
    totalPages,
    onPageChange: setCurrentPage,
  };
};
