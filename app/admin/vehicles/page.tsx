'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Header from '@/modules/admin/components/Header';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<VehicleRow[]>([]);
  const { get } = useAuthenticatedFetch();

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    return p.toString();
  }, [q]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/admin/vehicles${query ? `?${query}` : ''}`;
        const resp = await get<{ success: boolean; vehicles: VehicleRow[] }>(url);
        if (!resp.ok || !resp.data?.success) {
          throw new Error(resp.error || 'Erro ao listar veículos');
        }
        if (!active) return;
        setRows(resp.data.vehicles || []);
      } catch (e: any) {
        if (active) setError(e?.message || 'Erro ao listar veículos');
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
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: '24px auto', padding: '0 16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#072e4c', margin: 0 }}>
            Veículos
          </h1>
          <div style={{ display: 'flex', gap: 8, minWidth: 300 }}>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Filtrar por placa, cliente ou status"
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                width: '100%',
              }}
            />
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb' }}>
            {loading ? (
              <span style={{ color: '#666' }}>Carregando...</span>
            ) : error ? (
              <span style={{ color: '#b91c1c' }}>{error}</span>
            ) : (
              <span style={{ color: '#374151' }}>Total: {rows.length}</span>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', color: '#374151' }}>
                  <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                    Placa
                  </th>
                  <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                    Cliente
                  </th>
                  <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                    Marca/Modelo
                  </th>
                  <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                    Status
                  </th>
                  <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                    Criado em
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(v => (
                  <tr key={v.id}>
                    <td style={{ padding: 12, borderBottom: '1px solid #f3f4f6', fontWeight: 600 }}>
                      <a href={`/dashboard/vehicle/${v.id}`} style={{ color: '#0f62fe' }}>
                        {v.plate}
                      </a>
                    </td>
                    <td style={{ padding: 12, borderBottom: '1px solid #f3f4f6' }}>
                      {v.client_company || '-'}
                    </td>
                    <td style={{ padding: 12, borderBottom: '1px solid #f3f4f6' }}>
                      {(v.brand || '-') + ' ' + (v.model || '')}
                    </td>
                    <td style={{ padding: 12, borderBottom: '1px solid #f3f4f6' }}>
                      {v.status || '-'}
                    </td>
                    <td style={{ padding: 12, borderBottom: '1px solid #f3f4f6' }}>
                      {new Date(v.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, color: '#6b7280' }}>
                      Nenhum veículo encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
