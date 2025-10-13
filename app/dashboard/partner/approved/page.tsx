'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Header from '@/modules/admin/components/Header';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { getLogger } from '@/modules/logger';
import { Loading } from '@/modules/common/components/Loading/Loading';

type ApprovedItem = {
  quote_id: string;
  approved_at: string | null;
  total_value: number | null;
  vehicle_id: string | null;
  vehicle: { plate: string; brand: string; model: string; year: number | null };
};

type ChecklistMechanics = {
  type: 'mechanics';
  itemsByCategory: Record<
    string,
    Array<{
      id: string;
      item_key: string;
      item_status: string;
      item_notes: string | null;
      evidences: Array<{ id: string; media_url: string; description: string }>;
    }>
  >;
};

type ChecklistAnomalies = {
  type: 'anomalies';
  anomalies: Array<{ id: string; description: string; photos: string[] }>;
};

const logger = getLogger('partner:approved-overview');

export default function ApprovedOverviewPage() {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ApprovedItem[]>([]);
  const [query, setQuery] = useState('');
  const [details, setDetails] = useState<
    Record<string, ChecklistMechanics | ChecklistAnomalies | null>
  >({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await authenticatedFetch('/api/partner/approved');
        if (mounted && resp.ok && resp.data) {
          const data = resp.data as { items?: ApprovedItem[] };
          setItems(data.items || []);
        }
      } catch (e) {
        logger.error('load_approved_failed', { e });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [authenticatedFetch]);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return items;
    return items.filter(i => (i.vehicle?.plate || '').toUpperCase().includes(q));
  }, [items, query]);

  const loadDetails = async (vehicleId: string | null) => {
    if (!vehicleId) return;
    if (loadingDetails[vehicleId] || details[vehicleId]) return;
    setLoadingDetails(prev => ({ ...prev, [vehicleId]: true }));
    try {
      const res = await fetch(`/api/partner-checklist?vehicleId=${vehicleId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        if (data.type === 'mechanics') {
          setDetails(prev => ({
            ...prev,
            [vehicleId]: { type: 'mechanics', itemsByCategory: data.itemsByCategory },
          }));
        } else {
          setDetails(prev => ({
            ...prev,
            [vehicleId]: { type: 'anomalies', anomalies: data.anomalies || [] },
          }));
        }
      } else {
        logger.warn('checklist_fetch_error', {
          vehicleId: vehicleId.slice(0, 8),
          error: data?.error,
        });
        setDetails(prev => ({ ...prev, [vehicleId]: null }));
      }
    } catch (e) {
      logger.error('checklist_fetch_exception', { vehicleId: vehicleId.slice(0, 8), e });
      setDetails(prev => ({ ...prev, [vehicleId]: null }));
    } finally {
      setLoadingDetails(prev => ({ ...prev, [vehicleId]: false }));
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 0 0 0' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 8, color: '#333' }}>
          Orçamentos Aprovados
        </h1>
        <p style={{ color: '#666', marginBottom: 16 }}>
          Visualização somente leitura de checklists, evidências e orçamentos aprovados.
        </p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por placa (ex: ABC1D23)"
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #ddd',
              outline: 'none',
              fontSize: 14,
              background: '#fff',
            }}
          />
        </div>

        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', padding: 16, borderRadius: 8, color: '#555' }}>
            Nenhum orçamento aprovado encontrado.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {filtered.map(item => {
              const v = item.vehicle || { plate: '', brand: '', model: '', year: null };
              const key = `${item.quote_id}`;
              const vehicleId = item.vehicle_id;
              const det = vehicleId ? details[vehicleId] : undefined;
              const isLoading = vehicleId ? !!loadingDetails[vehicleId] : false;
              return (
                <div
                  key={key}
                  style={{
                    background: '#fff',
                    borderRadius: 8,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                  }}
                >
                  <div
                    style={{
                      padding: 16,
                      borderBottom: '1px solid #eee',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#333' }}>
                        {v.plate} • {v.brand} {v.model}
                        {v.year ? ` • ${v.year}` : ''}
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        Orçamento #{item.quote_id.slice(0, 8)} • Aprovado em{' '}
                        {item.approved_at ? new Date(item.approved_at).toLocaleDateString() : '—'} •
                        Valor{' '}
                        {item.total_value != null
                          ? `R$ ${Number(item.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </div>
                    </div>
                    <button
                      disabled={!vehicleId || isLoading}
                      onClick={() => loadDetails(vehicleId)}
                      style={{
                        background: '#3498db',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '8px 12px',
                        cursor: !vehicleId || isLoading ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                      }}
                    >
                      {isLoading ? 'Carregando…' : det ? 'Recarregar' : 'Carregar detalhes'}
                    </button>
                  </div>
                  {vehicleId && det && (
                    <div style={{ padding: 16 }}>
                      {det.type === 'mechanics' ? (
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>
                            Checklist de Mecânica
                          </div>
                          {Object.keys(det.itemsByCategory).map(cat => (
                            <div key={cat} style={{ marginBottom: 12 }}>
                              <div style={{ fontWeight: 600, color: '#555', marginBottom: 6 }}>
                                {cat}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                                {det.itemsByCategory[cat].map(it => (
                                  <div
                                    key={it.id}
                                    style={{
                                      border: '1px solid #eee',
                                      borderRadius: 6,
                                      padding: 8,
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                      }}
                                    >
                                      <div style={{ color: '#333', fontSize: 13 }}>
                                        {it.item_key}
                                      </div>
                                      <span
                                        style={{
                                          fontSize: 12,
                                          color: it.item_status === 'ok' ? '#27ae60' : '#e67e22',
                                        }}
                                      >
                                        {it.item_status}
                                      </span>
                                    </div>
                                    {it.item_notes && (
                                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                        {it.item_notes}
                                      </div>
                                    )}
                                    {it.evidences && it.evidences.length > 0 && (
                                      <div
                                        style={{
                                          display: 'flex',
                                          flexWrap: 'wrap',
                                          gap: 8,
                                          marginTop: 8,
                                        }}
                                      >
                                        {it.evidences.map(ev => (
                                          <img
                                            key={ev.id}
                                            src={ev.media_url}
                                            alt={ev.description || 'Evidência'}
                                            style={{
                                              width: 96,
                                              height: 96,
                                              objectFit: 'cover',
                                              borderRadius: 4,
                                              border: '1px solid #eee',
                                            }}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>Anomalias</div>
                          {det.anomalies.length === 0 ? (
                            <div style={{ color: '#666' }}>
                              Sem anomalias registradas para exibir.
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                              {det.anomalies.map(an => (
                                <div
                                  key={an.id}
                                  style={{ border: '1px solid #eee', borderRadius: 6, padding: 8 }}
                                >
                                  <div style={{ fontSize: 13, color: '#333', marginBottom: 6 }}>
                                    {an.description}
                                  </div>
                                  {an.photos && an.photos.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                      {an.photos.map((url, idx) => (
                                        <img
                                          key={idx}
                                          src={url}
                                          alt={an.description}
                                          style={{
                                            width: 96,
                                            height: 96,
                                            objectFit: 'cover',
                                            borderRadius: 4,
                                            border: '1px solid #eee',
                                          }}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
