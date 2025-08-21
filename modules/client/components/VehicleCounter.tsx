'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { supabase } from '@/modules/common/services/supabaseClient';
import VehicleDetailsModal from './VehicleDetailsModal';
import './VehicleCounter.css';
import RowCollectionModal from './RowCollectionModal';
import BulkCollectionModal from './BulkCollectionModal';

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  status: string;
  created_at: string;
  pickup_address_id?: string | null;
  estimated_arrival_date?: string | null;
}

interface VehiclesApiResponse {
  success?: boolean;
  message?: string;
  count?: number;
  vehicle_count?: number;
  vehicles?: Vehicle[];
  data?: unknown; // fallback para APIs que retornem { data: [...] }
}

interface VehicleCounterProps {
  onRefresh?: () => void;
}

function normalizeVehiclesPayload(payload: VehiclesApiResponse): { count: number; vehicles: Vehicle[] } {
  const listFromVehicles = Array.isArray(payload.vehicles) ? (payload.vehicles as Vehicle[]) : [];
  const listFromData =
    Array.isArray(payload.data) ? (payload.data as Vehicle[]) :
    (payload.data && typeof payload.data === 'object' && Array.isArray((payload.data as any).vehicles))
      ? ((payload.data as any).vehicles as Vehicle[])
      : [];

  const vehicles = listFromVehicles.length ? listFromVehicles : listFromData;

  const count =
    typeof payload.count === 'number' ? payload.count :
    typeof payload.vehicle_count === 'number' ? payload.vehicle_count :
    vehicles.length;

  return { count, vehicles };
}

function sanitizeStatus(status?: string): string {
  return (status ?? '').toString().trim().toLowerCase().replace(/\s+/g, '-');
}

function statusLabel(status?: string): string {
  if (!status) return '—';
  const raw = String(status).trim();
  const s = raw.toUpperCase();
  // Mapeia principais status do fluxo
  if (s === 'AGUARDANDO DEFINIÇÃO DE COLETA') return 'Aguardando definição de coleta';
  if (s === 'AGUARDANDO COLETA') return 'Aguardando coleta';
  if (s === 'AGUARDANDO CHEGADA DO CLIENTE') return 'Aguardando chegada do cliente';
  if (s === 'AGUARDANDO CHEGADA DO VEÍCULO') return 'Aguardando chegada do veículo';
  if (s === 'CHEGADA CONFIRMADA') return 'Chegada confirmada';
  if (s === 'EM ANÁLISE') return 'Em análise';
  if (s === 'ANÁLISE FINALIZADA' || s === 'ANALISE FINALIZADA') return 'Análise finalizada';
  return raw;
}

export default function VehicleCounter({ onRefresh }: VehicleCounterProps) {
  const [count, setCount] = useState<number>(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { get } = useAuthenticatedFetch();
  const [filterPlate, setFilterPlate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Collection controls state
  type Method = 'collect_point' | 'bring_to_yard';
  const [addresses, setAddresses] = useState<{ id: string; street: string | null; number: string | null; city: string | null; is_collect_point: boolean }[]>([]);
  const [bulkMethod, setBulkMethod] = useState<Method>('collect_point');
  const [bulkAddressId, setBulkAddressId] = useState('');
  // bulkEta (ISO YYYY-MM-DD) — não exigido na abertura do modal
  const [bulkEta, setBulkEta] = useState('');
  const [savingAll, setSavingAll] = useState(false);
  const [rowMethod, setRowMethod] = useState<Record<string, Method>>({});
  const [rowAddress, setRowAddress] = useState<Record<string, string>>({});
  const [rowEta, setRowEta] = useState<Record<string, string>>({});
  const [savingRow, setSavingRow] = useState<Record<string, boolean>>({});
  const { post } = useAuthenticatedFetch();
  const [bulkModalOpen, setBulkModalOpen] = useState<null | Method>(null);
  const [rowModalVehicle, setRowModalVehicle] = useState<Vehicle | null>(null);

  // Helper: data mínima local (YYYY-MM-DD) para o input nativo
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const makeLocalIsoDate = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const minDateIsoLocal = makeLocalIsoDate();


  const fetchVehiclesCount = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await get<VehiclesApiResponse>('/api/client/vehicles-count');
      if (!response.ok) {
        throw new Error(response.error || 'Erro ao buscar contagem de veículos');
      }

      const payload = (response.data ?? {}) as VehiclesApiResponse;
      const { count: normalizedCount, vehicles: normalizedVehicles } = normalizeVehiclesPayload(payload);

      setCount(normalizedCount);
      setVehicles(normalizedVehicles);

      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [get, onRefresh]);

  useEffect(() => {
    fetchVehiclesCount();
  }, [fetchVehiclesCount]);

  useEffect(() => {
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) return;
        const { data: addrs } = await supabase
          .from('addresses')
          .select('id, street, number, city, is_collect_point')
          .eq('profile_id', uid)
          .order('created_at', { ascending: false });
        setAddresses((addrs as any[])?.filter(a => a.is_collect_point) || []);
      } catch {}
    })();
  }, []);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
  };

  const statusOptions = Array.from(new Set((vehicles || []).map(v => (v.status || '').trim()).filter(Boolean)));
  const statusCounts = (vehicles || []).reduce<Record<string, number>>((acc, v) => {
    const key = (v.status || '').trim();
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Ordenação por fluxo de status
  const statusOrder = (statusRaw: string): number => {
    const s = String(statusRaw || '').toUpperCase().trim();
    if (s === 'AGUARDANDO DEFINIÇÃO DE COLETA') return 1;
    if (s === 'AGUARDANDO CHEGADA DO CLIENTE') return 2;
    if (s === 'AGUARDANDO CHEGADA DO VEÍCULO') return 2; // compat
    if (s === 'AGUARDANDO COLETA') return 2; // bifurcação
    if (s === 'CHEGADA CONFIRMADA') return 3;
    if (s === 'EM ANÁLISE') return 4;
    if (s === 'ANÁLISE FINALIZADA' || s === 'ANALISE FINALIZADA') return 5;
    return 99;
  };
  const filteredVehicles = (vehicles || []).filter(v => {
    const plateOk = filterPlate ? v.plate.toUpperCase().includes(filterPlate.trim().toUpperCase()) : true;
    const statusOk = filterStatus ? ((v.status || '').toLowerCase() === filterStatus.toLowerCase()) : true;
    return plateOk && statusOk;
  });

  // Regras de edição: cliente só pode alterar coleta quando status atual for um dos permitidos
  const canClientModify = (status?: string) => {
    const s = String(status || '').toUpperCase();
    return (
      s === 'AGUARDANDO DEFINIÇÃO DE COLETA' ||
      s === 'AGUARDANDO COLETA' ||
      s === 'AGUARDANDO CHEGADA DO VEÍCULO' ||
      s === 'AGUARDANDO CHEGADA DO CLIENTE'
    );
  };
  const allVehiclesAllowed = vehicles.every(v => canClientModify(v.status));

  if (loading) {
    return (
      <div className="vehicle-counter loading" role="status" aria-live="polite">
        <div className="counter-content">
          <h3>Carregando...</h3>
          <p>Contando seus veículos</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vehicle-counter error">
        <div className="counter-icon" aria-hidden>⚠️</div>
        <div className="counter-content">
          <h3>Erro</h3>
          <p>{error}</p>
          <button onClick={fetchVehiclesCount} className="retry-button" aria-label="Tentar novamente">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-counter">
      <div className="counter-header">
        <div className="counter-content">
          <h3>Meus Veículos</h3>
          <div className="counter-number" aria-live="polite">{count}</div>
          <p>{count === 1 ? 'veículo cadastrado' : 'veículos cadastrados'}</p>
          {/* Contadores por status (renderiza apenas status com pelo menos 1 veículo) */}
          {Object.keys(statusCounts).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }} aria-label="Contadores por status">
              {Object.entries(statusCounts)
                .filter(([, c]) => c > 0)
                .sort((a, b) => {
                  const [sa] = a; const [sb] = b;
                  const ra = statusOrder(sa);
                  const rb = statusOrder(sb);
                  if (ra !== rb) return ra - rb;
                  // dentro do mesmo nível, ordena por label para estabilidade
                  const la = statusLabel(sa);
                  const lb = statusLabel(sb);
                  return la.localeCompare(lb);
                })
                .map(([s, c]) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilterStatus(s)}
                    title={`Filtrar por ${statusLabel(s)}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255,255,255,0.18)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.25)',
                      borderRadius: 16,
                      padding: '4px 10px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{statusLabel(s)}</span>
                    <span style={{
                      background: 'rgba(0,0,0,0.25)',
                      borderRadius: 10,
                      padding: '2px 6px',
                      fontWeight: 600,
                      lineHeight: 1,
                    }}>{c}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
        <div className="counter-filters" role="group" aria-label="Filtros de veículo">
          <input
            type="text"
            placeholder="Buscar por placa"
            value={filterPlate}
            onChange={e => setFilterPlate(e.target.value)}
            aria-label="Buscar por placa"
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            aria-label="Filtrar por status"
          >
            <option value="">Todos os status</option>
            {statusOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="counter-actions">
          <button
            onClick={fetchVehiclesCount}
            className="refresh-button"
            title="Atualizar contagem"
            aria-label="Atualizar contagem de veículos"
          >
            🔄
          </button>
          {count > 0 && (
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="details-button"
              title={showDetails ? 'Ocultar detalhes' : 'Mostrar detalhes'}
              aria-expanded={showDetails}
              aria-controls="vehicles-details"
            >
              {showDetails ? '🔼' : '🔽'}
            </button>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="vehicles-details" id="vehicles-details">
          {vehicles.length > 0 && (
            <div className="collection-controls" aria-label="Opções de coleta em lote">
              <h4>Opções de coleta em lote</h4>
              <div className="row">
                <label>
                  <input type="radio" name="bulkMethod" checked={bulkMethod === 'collect_point'} onChange={() => setBulkMethod('collect_point')} /> Ponto de Coleta
                </label>
                <label>
                  <input type="radio" name="bulkMethod" checked={bulkMethod === 'bring_to_yard'} onChange={() => setBulkMethod('bring_to_yard')} /> Vou levar ao pátio ProLine
                </label>
              </div>
              {bulkMethod === 'collect_point' ? (
                <div className="row">
                  <select value={bulkAddressId} onChange={e => setBulkAddressId(e.target.value)}>
                    <option value="">Selecione um ponto de coleta</option>
                    {addresses.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.street} {a.number ? `, ${a.number}` : ''} {a.city ? `- ${a.city}` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    className="save-button"
                    disabled={!bulkAddressId || savingAll}
                    onClick={() => setBulkModalOpen('collect_point')}
                  >
                    Definir ponto de coleta em lote
                  </button>
                </div>
              ) : (
                <div className="row">
                  <button
                    className="save-button"
                    disabled={savingAll}
                    onClick={() => setBulkModalOpen('bring_to_yard')}
                  >
                    Levar ao pátio em lote
                  </button>
                </div>
              )}
            </div>
          )}

          <h4>Detalhes dos Veículos:</h4>

          {count > 0 && vehicles.length === 0 && (
            <p className="vehicles-hint">
              Encontramos registros, mas a lista não foi retornada pela API. Clique em atualizar.
            </p>
          )}

          <div className="vehicles-list">
            {filteredVehicles.map((vehicle) => {
              const sClass = sanitizeStatus(vehicle.status);
              return (
                <div
                  key={vehicle.id}
                  className="vehicle-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedVehicle(vehicle);
                    setShowModal(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedVehicle(vehicle);
                      setShowModal(true);
                    }
                  }}
                >
                  <div className="vehicle-info">
                    <span className="vehicle-plate">{vehicle.plate}</span>
                    <span className="vehicle-model">
                      {vehicle.brand} {vehicle.model} ({vehicle.year})
                    </span>
                  </div>
                  <div className="vehicle-meta">
                    <span className="vehicle-date">
                      Cadastrado em {formatDate(vehicle.created_at)}
                    </span>
                    <span className={`vehicle-status ${sClass}`}>
                      {statusLabel(vehicle.status)}
                    </span>
                  </div>

                  <div className="vehicle-row-controls" onClick={(e) => e.stopPropagation()}>
                    {true && (
                      <div style={{ gridColumn: '1 / -1', fontSize: '0.85rem', opacity: 0.9 }}>
                        {(() => {
                          const s = String(vehicle.status || '').toUpperCase();
                          if (s === 'AGUARDANDO CHEGADA DO VEÍCULO') {
                            const eta = vehicle.estimated_arrival_date || '';
                            const d = eta ? new Date(eta) : null;
                            const label = d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR') : '—';
                            return (
                              <span>
                                Previsão de chegada: <b>{label}</b>
                              </span>
                            );
                          }
                          const selId = vehicle.pickup_address_id || '';
                          const addr = addresses.find(a => a.id === selId);
                          const label = addr ? `${addr.street || ''}${addr.number ? `, ${addr.number}` : ''}${addr.city ? ` - ${addr.city}` : ''}`.trim() : '';
                          if (s === 'AGUARDANDO COLETA') {
                            return (
                              <span>
                                Ponto de coleta selecionado: <b>{label || 'Nenhum ponto selecionado'}</b>
                              </span>
                            );
                          }
                          return label ? (
                            <span>
                              Ponto de coleta selecionado: <b>{label}</b>
                            </span>
                          ) : null;
                        })()}
                      </div>
                    )}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <button
                        className="save-button"
                        onClick={() => setRowModalVehicle(vehicle)}
                        disabled={!canClientModify(vehicle.status)}
                        title={!canClientModify(vehicle.status) ? 'Não editável neste status' : 'Editar ponto de coleta'}
                      >
                        Editar ponto de coleta
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <VehicleDetailsModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedVehicle(null);
          }}
          vehicle={selectedVehicle}
        />
      )}

      {bulkModalOpen && (
        <BulkCollectionModal
          isOpen={!!bulkModalOpen}
          onClose={() => setBulkModalOpen(null)}
          method={bulkModalOpen}
          vehicles={vehicles}
          addresses={addresses as any}
          minDate={minDateIsoLocal}
          initialAddressId={bulkMethod === 'collect_point' ? bulkAddressId : undefined}
          initialEtaIso={bulkMethod === 'bring_to_yard' ? bulkEta : undefined}
          onApply={async (payload) => {
            const resp = await post('/api/client/set-vehicles-collection', payload);
            if (!resp.ok) throw new Error(resp.error || 'Erro ao aplicar');
            fetchVehiclesCount();
          }}
        />
      )}

      {rowModalVehicle && (
        <RowCollectionModal
          isOpen={!!rowModalVehicle}
          onClose={() => setRowModalVehicle(null)}
          vehicle={{ id: rowModalVehicle.id, pickup_address_id: rowModalVehicle.pickup_address_id }}
          addresses={addresses as any}
          minDate={new Date().toISOString().split('T')[0]}
          onApply={async (payload) => {
            const resp = await post('/api/client/set-vehicles-collection', payload);
            if (!resp.ok) throw new Error(resp.error || 'Erro ao salvar');
            fetchVehiclesCount();
          }}
        />
      )}
    </div>
  );
}
