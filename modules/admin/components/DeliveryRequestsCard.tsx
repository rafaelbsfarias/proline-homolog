'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

type DeliveryItem = {
  id: string;
  status: string;
  desired_date: string | null;
  created_at: string;
  fee_amount?: number | null;
  client?: { profile_id: string; profiles?: { full_name?: string | null } | null } | null;
  vehicle?: { id: string; plate?: string | null } | null;
  address?: {
    id: string;
    street?: string | null;
    number?: string | null;
    city?: string | null;
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

// (Apenas listagem: sem necessidade de converter janelas)

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

type TypeFilter = 'all' | 'pickup' | 'delivery';

export default function DeliveryRequestsCard({ clientId }: DeliveryRequestsCardProps) {
  const { get } = useAuthenticatedFetch();
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filtros
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [plateSearch, setPlateSearch] = useState<string>('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('clientId', clientId);
      if (statusFilter) params.set('status', statusFilter);
      if (dateStart) params.set('dateStart', dateStart);
      if (dateEnd) params.set('dateEnd', dateEnd);
      const url = `/api/admin/deliveries?${params.toString()}`;
      const resp = await get<{ success?: boolean; items?: DeliveryItem[]; error?: string }>(url);
      if (!resp.ok) throw new Error(resp.error || resp.data?.error || 'Erro ao carregar entregas');
      setItems(resp.data?.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar entregas');
    } finally {
      setLoading(false);
    }
  }, [clientId, get, statusFilter, dateStart, dateEnd]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Funções utilitárias de filtro
  const isPickup = (it: DeliveryItem) => !it.address?.id;
  const isDelivery = (it: DeliveryItem) => !!it.address?.id;

  const filtered = useMemo(() => {
    let out = items;
    if (typeFilter === 'pickup') out = out.filter(isPickup);
    else if (typeFilter === 'delivery') out = out.filter(isDelivery);
    if (plateSearch.trim()) {
      const q = plateSearch.trim().toUpperCase();
      out = out.filter(it => (it.vehicle?.plate || '')?.toUpperCase().includes(q));
    }
    return out;
  }, [items, typeFilter, plateSearch]);

  // Agrupar por data desejada (YYYY-MM-DD)
  const groups = useMemo(() => {
    const map = new Map<string, DeliveryItem[]>();
    for (const it of filtered) {
      const key = (it.desired_date || '').slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, rows]) => ({ date, rows }));
  }, [filtered]);

  const hasAny = useMemo(() => filtered.length > 0, [filtered]);

  // Card de listagem apenas — sem ações.

  if (!hasAny && !loading && !error) return null;

  const typeLabel = (it: DeliveryItem) => (isPickup(it) ? 'Retirada' : 'Entrega');
  const addressLabel = (it: DeliveryItem) =>
    isPickup(it)
      ? 'Pátio'
      : `${it.address?.street || ''}${it.address?.number ? ', ' + it.address.number : ''} - ${it.address?.city || ''}`.trim();

  return (
    <section style={cardStyle} aria-live="polite">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Solicitações de Retirada e Entrega</h3>
        <button
          onClick={() => setIsCollapsed(s => !s)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16 }}
          title={isCollapsed ? 'Expandir' : 'Colapsar'}
          aria-label={isCollapsed ? 'Expandir painel' : 'Colapsar painel'}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: isCollapsed ? 'none' : 'block', marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as TypeFilter)}
            aria-label="Filtrar por tipo"
            style={{ padding: '6px 8px' }}
          >
            <option value="all">Todos os tipos</option>
            <option value="pickup">Retiradas</option>
            <option value="delivery">Entregas</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            aria-label="Filtrar por status"
            style={{ padding: '6px 8px' }}
          >
            <option value="">Todos os status</option>
            <option value="requested">Solicitado</option>
            <option value="approved">Aprovado</option>
            <option value="scheduled">Agendado</option>
            <option value="in_transit">Em trânsito</option>
            <option value="delivered">Entregue</option>
            <option value="rejected">Rejeitado</option>
            <option value="canceled">Cancelado</option>
            <option value="failed">Falhou</option>
          </select>
          <input
            type="date"
            value={dateStart}
            onChange={e => setDateStart(e.target.value)}
            aria-label="Início"
            style={{ padding: '6px 8px' }}
          />
          <input
            type="date"
            value={dateEnd}
            onChange={e => setDateEnd(e.target.value)}
            aria-label="Fim"
            style={{ padding: '6px 8px' }}
          />
          <input
            type="text"
            placeholder="Buscar placa"
            value={plateSearch}
            onChange={e => setPlateSearch(e.target.value)}
            style={{ padding: '6px 8px' }}
            aria-label="Buscar por placa"
          />
          <button onClick={fetchItems} style={{ padding: '6px 10px' }} title="Aplicar filtros">
            Filtrar
          </button>
        </div>

        {error && (
          <div style={{ color: '#b00020', marginBottom: 8 }} role="alert">
            {error}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 12 }}>Carregando...</div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thtd}>Tipo</th>
                  <th style={thtd}>Data solicitada</th>
                  <th style={thtd}>Placa</th>
                  <th style={thtd}>Destino</th>
                  <th style={thtd}>Valor</th>
                  <th style={thtd}>Status</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(g =>
                  g.rows.map(row => (
                    <tr key={`${g.date}-${row.id}`}>
                      <td style={thtd}>{typeLabel(row)}</td>
                      <td style={thtd}>{formatDateBR(row.desired_date || g.date)}</td>
                      <td style={thtd}>{row.vehicle?.plate || '—'}</td>
                      <td style={thtd}>{addressLabel(row)}</td>
                      <td style={thtd}>
                        {typeof row.fee_amount === 'number'
                          ? row.fee_amount.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })
                          : '—'}
                      </td>
                      <td style={thtd}>{row.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
