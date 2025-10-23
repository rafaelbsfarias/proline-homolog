'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

type DeliveryItem = {
  id: string;
  status: string;
  desired_date: string | null;
  created_at: string;
  client?: { profile_id: string; profiles?: { full_name?: string | null } | null } | null;
  vehicle?: { id: string; plate?: string | null } | null;
  address?: {
    id: string;
    street?: string | null;
    number?: string | null;
    city?: string | null;
    label?: string | null;
  } | null;
};

function formatDateBR(dateIso?: string | null) {
  if (!dateIso) return '-';
  const d = new Date(dateIso);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function toWindowIso(dateIso: string, startHour = 9, endHour = 18) {
  // dateIso expected as YYYY-MM-DD
  const [y, m, d] = dateIso.split('-').map(Number);
  const start = new Date(Date.UTC(y, (m - 1) as number, d as number, startHour, 0, 0));
  const end = new Date(Date.UTC(y, (m - 1) as number, d as number, endHour, 0, 0));
  return { windowStart: start.toISOString(), windowEnd: end.toISOString() };
}

interface DeliveryRequestsCardProps {
  clientId: string;
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 10,
  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  padding: 16,
  marginTop: 16,
};

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thtd: React.CSSProperties = {
  borderBottom: '1px solid #eee',
  padding: '8px 6px',
  textAlign: 'left',
};

export default function DeliveryRequestsCard({ clientId }: DeliveryRequestsCardProps) {
  const { get, authenticatedFetch } = useAuthenticatedFetch();
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await get<{ success?: boolean; items?: DeliveryItem[]; error?: string }>(
        `/api/admin/deliveries?clientId=${clientId}&status=requested`
      );
      if (!resp.ok) throw new Error(resp.error || resp.data?.error || 'Erro ao carregar entregas');
      setItems(resp.data?.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar entregas');
    } finally {
      setLoading(false);
    }
  }, [clientId, get]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filtrar somente retiradas (address_id null => address ausente)
  const pickupItems = useMemo(() => items.filter(it => !it.address?.id), [items]);

  // Agrupar por data desejada (YYYY-MM-DD)
  const groups = useMemo(() => {
    const map = new Map<string, DeliveryItem[]>();
    for (const it of pickupItems) {
      const key = (it.desired_date || '').slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, rows]) => ({ date, rows }));
  }, [pickupItems]);

  const hasPending = useMemo(() => groups.length > 0, [groups]);

  const confirmGroup = async (rows: DeliveryItem[]) => {
    if (!rows.length) return;
    const desiredDate = rows[0]?.desired_date || null;
    if (!desiredDate) return;
    const { windowStart, windowEnd } = toWindowIso(desiredDate);
    setLoading(true);
    setError(null);
    try {
      for (const it of rows) {
        const resp = await authenticatedFetch(`/api/admin/deliveries/${it.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ action: 'schedule', windowStart, windowEnd }),
        });
        if (!resp.ok) throw new Error(resp.error || 'Falha ao agendar');
      }
      await fetchItems();
    } catch (e: any) {
      setError(e?.message || 'Erro ao agendar');
    } finally {
      setLoading(false);
    }
  };

  const rejectGroup = async (rows: DeliveryItem[]) => {
    setLoading(true);
    setError(null);
    try {
      for (const it of rows) {
        const resp = await authenticatedFetch(`/api/admin/deliveries/${it.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ action: 'reject' }),
        });
        if (!resp.ok) throw new Error(resp.error || 'Falha ao rejeitar');
      }
      await fetchItems();
    } catch (e: any) {
      setError(e?.message || 'Erro ao rejeitar');
    } finally {
      setLoading(false);
    }
  };

  if (!hasPending) return null;

  return (
    <section style={cardStyle} aria-live="polite">
      <h3 style={{ marginTop: 0 }}>Solicitações de Retirada no Pátio (Pendentes)</h3>
      {error && (
        <div style={{ color: '#b00020', marginBottom: 8 }} role="alert">
          {error}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtd}>Data Solicitada</th>
              <th style={thtd}>Veículos</th>
              <th style={thtd}>Placas</th>
              <th style={thtd}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(g => {
              const plates = g.rows
                .map(r => r.vehicle?.plate || r.vehicle?.id || '—')
                .slice(0, 5)
                .join(', ');
              const more = Math.max(0, g.rows.length - 5);
              return (
                <tr key={g.date}>
                  <td style={thtd}>{formatDateBR(g.date)}</td>
                  <td style={thtd}>{g.rows.length}</td>
                  <td style={thtd}>
                    {plates}
                    {more ? ` +${more}` : ''}
                  </td>
                  <td style={thtd}>
                    <button
                      onClick={() => confirmGroup(g.rows)}
                      disabled={loading}
                      title="Agendar janela padrão (09:00–18:00) para todas"
                    >
                      Confirmar todas
                    </button>
                    <button
                      onClick={() => rejectGroup(g.rows)}
                      disabled={loading}
                      style={{ marginLeft: 8 }}
                    >
                      Rejeitar todas
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
