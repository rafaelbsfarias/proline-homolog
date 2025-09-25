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

const PAGE_SIZE = 10;

export const useAdminClientVehicles = (
  clientId?: string,
  filters?: { plate: string; status: string }
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
        const response = await get<{
          success: boolean;
          vehicles: AdminVehicleData[];
          totalCount: number;
          error?: string;
        }>(`/api/admin/client-vehicles?${queryParams.toString()}`);
        if (response.ok && response.data?.success) {
          let allVehicles = response.data.vehicles || [];

          if (filters?.plate) {
            allVehicles = allVehicles.filter(v =>
              v.plate.toLowerCase().includes(filters.plate.toLowerCase())
            );
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

  const refetch = useCallback(() => setCurrentPage(1), []);

  return { vehicles, loading, error, refetch, currentPage, setCurrentPage, totalPages, totalCount };
};
