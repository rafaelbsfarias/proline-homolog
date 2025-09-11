'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Header from '@/modules/admin/components/Header';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

type MetricsPayload = { success: boolean; metrics: Record<string, number> };

export default function AdminMetricsPage() {
  const { get } = useAuthenticatedFetch();
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await get<MetricsPayload>('/api/admin/metrics');
      if (!resp.ok || !resp.data?.success) {
        setError(resp.error || 'Falha ao carregar métricas');
        return;
      }
      setMetrics(resp.data.metrics || {});
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Header />
      <div style={{ maxWidth: 960, margin: '24px auto', padding: '0 16px' }}>
        <h1 style={{ marginBottom: 8 }}>Métricas de Coletas</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          Acompanhe contadores úteis em staging para observabilidade.
        </p>

        <div style={{ marginBottom: 16 }}>
          <button onClick={load} disabled={loading}>
            {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
        </div>

        {error && <div style={{ color: '#b00020', marginBottom: 12 }}>Erro: {error}</div>}

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ddd' }}>
                Métrica
              </th>
              <th
                style={{ textAlign: 'right', padding: '8px 4px', borderBottom: '1px solid #ddd' }}
              >
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(metrics).length === 0 && (
              <tr>
                <td colSpan={2} style={{ padding: 12, color: '#666' }}>
                  Sem métricas registradas ainda.
                </td>
              </tr>
            )}
            {Object.entries(metrics).map(([k, v]) => (
              <tr key={k}>
                <td style={{ padding: '8px 4px', borderBottom: '1px solid #f0f0f0' }}>{k}</td>
                <td
                  style={{
                    padding: '8px 4px',
                    textAlign: 'right',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  {v}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
