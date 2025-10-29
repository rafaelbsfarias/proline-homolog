import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export interface AdminVehicleRow {
  id: string;
  plate: string;
  brand: string | null;
  model: string | null;
  status: string | null;
  created_at: string;
  client_company: string | null;
}

interface Options {
  plate?: string;
  statuses?: string[];
  preparacao?: boolean;
  comercializacao?: boolean;
  pageSize?: number;
}

export const useAdminVehicles = (opts?: Options) => {
  const { get } = useAuthenticatedFetch();
  const [rows, setRows] = useState<AdminVehicleRow[]>([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const pageSize = opts?.pageSize ?? 10;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (opts?.plate && opts.plate.trim()) p.set('plate', opts.plate.trim());
    if (opts?.statuses && opts.statuses.length > 0) p.set('status', opts.statuses.join(','));
    if (opts?.preparacao) p.set('preparacao', 'true');
    if (opts?.comercializacao) p.set('comercializacao', 'true');
    p.set('page', String(page));
    p.set('limit', String(pageSize));
    return p.toString();
  }, [opts?.plate, opts?.statuses, opts?.preparacao, opts?.comercializacao, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [opts?.plate, opts?.statuses, opts?.preparacao, opts?.comercializacao, pageSize]);

  const refetch = useCallback(() => {
    setPage(1);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/admin/vehicles${query ? `?${query}` : ''}`;
        const resp = await get<{
          success: boolean;
          vehicles: AdminVehicleRow[];
          total?: number;
          page?: number;
          pageSize?: number;
          statusCounts?: Record<string, number>;
        }>(url);
        if (!resp.ok || !resp.data?.success) {
          throw new Error(resp.error || 'Erro ao listar veículos');
        }
        if (!active) return;
        setRows(resp.data.vehicles || []);
        setTotal(resp.data.total ?? (resp.data.vehicles?.length || 0));
        setStatusCounts(resp.data.statusCounts || {});
      } catch (e: any) {
        if (active) setError(e?.message || 'Erro ao listar veículos');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [query, get]);

  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);

  return { rows, total, statusCounts, page, setPage, totalPages, loading, error, refetch };
};
