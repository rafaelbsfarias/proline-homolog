import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export interface AdminVehicleData {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  status?: string;
}

const PAGE_SIZE = 12; // Consistent with specialist dashboard

export const useAdminClientVehicles = (
  clientId?: string,
  filters?: { plate?: string; status?: string[]; dateFilter?: string[] }
) => {
  const { get } = useAuthenticatedFetch();
  const [vehicles, setVehicles] = useState<AdminVehicleData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.ceil(totalCount / PAGE_SIZE), [totalCount]);

  useEffect(() => {
    setCurrentPage(1);
  }, [clientId, filters]);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!clientId) {
        setVehicles([]);
        setTotalCount(0);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('clientId', clientId);
        queryParams.append('page', String(currentPage));
        queryParams.append('pageSize', String(PAGE_SIZE));

        if (filters?.plate) {
          queryParams.append('plate', filters.plate);
        }
        if (filters?.status && filters.status.length > 0) {
          filters.status.forEach(s => queryParams.append('status', s));
        }
        if (filters?.dateFilter && filters.dateFilter.length > 0) {
          filters.dateFilter.forEach(df => queryParams.append('dateFilter', df));
        }

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        queryParams.append('today', today);

        const response = await get<{
          success: boolean;
          vehicles: AdminVehicleData[];
          total_count: number;
          filtered_total_count: number;
          status_counts: Record<string, number>;
          error?: string;
        }>(`/api/admin/client-vehicles?${queryParams.toString()}`);

        if (response.ok && response.data?.success) {
          setVehicles(response.data.vehicles || []);
          setTotalCount(response.data.filtered_total_count || 0);
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

  const refetch = useCallback(() => setCurrentPage(1), []);

  return { vehicles, loading, error, refetch, currentPage, setCurrentPage, totalPages, totalCount };
};
