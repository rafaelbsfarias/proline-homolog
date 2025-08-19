'use client';

import { useState, useEffect, useCallback } from 'react';
import VehicleDetailsModal from './VehicleDetailsModal';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
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
