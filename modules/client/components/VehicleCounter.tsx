'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { supabase } from '@/modules/common/services/supabaseClient';
import VehicleDetailsModal from './VehicleDetailsModal';
import './VehicleCounter.css';

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  status: string;
  created_at: string;
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
  const s = sanitizeStatus(status);
  if (s === 'ativo') return 'Ativo';
  if (s === 'inativo') return 'Inativo';
  if (s === 'pendente') return 'Pendente';
  return status ?? '—';
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

  // Collection controls state
  type Method = 'collect_point' | 'bring_to_yard';
  const [addresses, setAddresses] = useState<{ id: string; street: string | null; number: string | null; city: string | null; is_collect_point: boolean }[]>([]);
  const [bulkMethod, setBulkMethod] = useState<Method>('collect_point');
  const [bulkAddressId, setBulkAddressId] = useState('');
  const [bulkEta, setBulkEta] = useState('');
  const [savingAll, setSavingAll] = useState(false);
  const [rowMethod, setRowMethod] = useState<Record<string, Method>>({});
  const [rowAddress, setRowAddress] = useState<Record<string, string>>({});
  const [rowEta, setRowEta] = useState<Record<string, string>>({});
  const [savingRow, setSavingRow] = useState<Record<string, boolean>>({});
  const { post } = useAuthenticatedFetch();

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
          <h4>Detalhes dos Veículos:</h4>

          {vehicles.length > 0 && (
            <div className="collection-controls">
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
                  <button className="save-button" disabled={!bulkAddressId || savingAll} onClick={async () => {
                    try {
                      setSavingAll(true);
                      const resp = await post('/api/client/set-vehicles-collection', { method: 'collect_point', addressId: bulkAddressId });
                      if (!resp.ok) throw new Error(resp.error || 'Erro ao aplicar');
                      fetchVehiclesCount();
                    } finally {
                      setSavingAll(false);
                    }
                  }}>Aplicar a todos</button>
                </div>
              ) : (
                <div className="row">
                  <input type="date" value={bulkEta} onChange={e => setBulkEta(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                  <button className="save-button" disabled={!bulkEta || savingAll} onClick={async () => {
                    try {
                      setSavingAll(true);
                      const resp = await post('/api/client/set-vehicles-collection', { method: 'bring_to_yard', estimated_arrival_date: bulkEta });
                      if (!resp.ok) throw new Error(resp.error || 'Erro ao aplicar');
                      fetchVehiclesCount();
                    } finally {
                      setSavingAll(false);
                    }
                  }}>Aplicar a todos</button>
                </div>
              )}
            </div>
          )}

          {count > 0 && vehicles.length === 0 && (
            <p className="vehicles-hint">
              Encontramos registros, mas a lista não foi retornada pela API. Clique em atualizar.
            </p>
          )}

          <div className="vehicles-list">
            {vehicles.map((vehicle) => {
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
                    <div>
                      <select
                        value={rowMethod[vehicle.id] || 'collect_point'}
                        onChange={e => setRowMethod(prev => ({ ...prev, [vehicle.id]: e.target.value as Method }))}
                      >
                        <option value="collect_point">Ponto de Coleta</option>
                        <option value="bring_to_yard">Vou levar ao pátio</option>
                      </select>
                    </div>
                    {rowMethod[vehicle.id] === 'bring_to_yard' ? (
                      <input
                        type="date"
                        value={rowEta[vehicle.id] || ''}
                        onChange={e => setRowEta(prev => ({ ...prev, [vehicle.id]: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    ) : (
                      <select
                        value={rowAddress[vehicle.id] || ''}
                        onChange={e => setRowAddress(prev => ({ ...prev, [vehicle.id]: e.target.value }))}
                      >
                        <option value="">Selecione um ponto</option>
                        {addresses.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.street} {a.number ? `, ${a.number}` : ''} {a.city ? `- ${a.city}` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      className="save-button"
                      disabled={
                        !!savingRow[vehicle.id] ||
                        (rowMethod[vehicle.id] === 'collect_point' && !(rowAddress[vehicle.id])) ||
                        (rowMethod[vehicle.id] === 'bring_to_yard' && !(rowEta[vehicle.id]))
                      }
                      onClick={async () => {
                        try {
                          setSavingRow(prev => ({ ...prev, [vehicle.id]: true }));
                          const method = rowMethod[vehicle.id] || 'collect_point';
                          const payload: any = { method, vehicleIds: [vehicle.id] };
                          if (method === 'collect_point') payload.addressId = rowAddress[vehicle.id];
                          else payload.estimated_arrival_date = rowEta[vehicle.id];
                          const resp = await post('/api/client/set-vehicles-collection', payload);
                          if (!resp.ok) throw new Error(resp.error || 'Erro ao salvar');
                          fetchVehiclesCount();
                        } finally {
                          setSavingRow(prev => ({ ...prev, [vehicle.id]: false }));
                        }
                      }}
                    >
                      Salvar
                    </button>
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
    </div>
  );
}
