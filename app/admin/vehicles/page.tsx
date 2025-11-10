'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Header from '@/modules/admin/components/Header';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import styles from './page.module.css';

type VehicleRow = {
  id: string;
  plate: string;
  brand: string | null;
  model: string | null;
  status: string | null;
  created_at: string;
  client_company: string | null;
};

export default function AdminVehiclesListPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<VehicleRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const { get } = useAuthenticatedFetch();

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    p.set('page', String(page));
    p.set('limit', String(pageSize));
    return p.toString();
  }, [q, page]);

  // Resetar página quando o filtro muda
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/admin/vehicles${query ? `?${query}` : ''}`;
        const resp = await get<{
          success: boolean;
          vehicles: VehicleRow[];
          total?: number;
          page?: number;
          pageSize?: number;
        }>(url);
        if (!resp.ok || !resp.data?.success) {
          throw new Error(resp.error || 'Erro ao listar veículos');
        }
        if (!active) return;
        setRows(resp.data.vehicles || []);
        setTotal(resp.data.total ?? (resp.data.vehicles?.length || 0));
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Erro ao listar veículos');
      } finally {
        if (active) setLoading(false);
      }
    };
    // debounce simples
    const t = setTimeout(fetchData, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query, get]);

  return (
    <div className={styles.pageContainer}>
      <Header />
      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Veículos</h1>
          <div className={styles.searchContainer}>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Filtrar por placa, cliente ou status"
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            {loading ? (
              <span className={styles.loadingMessage}>Carregando...</span>
            ) : error ? (
              <span className={styles.errorMessage}>{error}</span>
            ) : (
              <>
                <span className={styles.totalInfo}>Total: {total}</span>
                <div className={styles.paginationButtons}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className={styles.paginationButton}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={loading || page * pageSize >= total}
                    className={styles.paginationButton}
                  >
                    Próxima
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Desktop: Tabela */}
          <div className={styles.tableWrapper}>
            <table className={styles.vehiclesTable}>
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Cliente</th>
                  <th>Marca/Modelo</th>
                  <th>Status</th>
                  <th>Criado em</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(v => (
                  <tr key={v.id}>
                    <td>
                      <a href={`/dashboard/vehicle/${v.id}`} className={styles.plateLink}>
                        {v.plate}
                      </a>
                    </td>
                    <td>{v.client_company || '-'}</td>
                    <td>{(v.brand || '-') + ' ' + (v.model || '')}</td>
                    <td>{v.status || '-'}</td>
                    <td>{new Date(v.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.emptyMessage}>
                      Nenhum veículo encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile: Cards */}
          <div className={styles.vehicleCardsContainer}>
            {rows.map(v => (
              <div key={v.id} className={styles.vehicleCard}>
                <div className={`${styles.cardField} ${styles.cardFieldPlate}`}>
                  <strong>Placa:</strong>
                  <a href={`/dashboard/vehicle/${v.id}`} className={styles.plateLink}>
                    {v.plate}
                  </a>
                </div>
                <div className={styles.cardField}>
                  <strong>Cliente:</strong>
                  <span>{v.client_company || '-'}</span>
                </div>
                <div className={styles.cardField}>
                  <strong>Marca/Modelo:</strong>
                  <span>{(v.brand || '-') + ' ' + (v.model || '')}</span>
                </div>
                <div className={styles.cardField}>
                  <strong>Status:</strong>
                  <span>{v.status || '-'}</span>
                </div>
                <div className={styles.cardField}>
                  <strong>Criado em:</strong>
                  <span>{new Date(v.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))}
            {!loading && rows.length === 0 && (
              <div className={styles.emptyMessage}>Nenhum veículo encontrado.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
