'use client';

import { useState, useEffect } from 'react';
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

interface VehicleCountResponse {
  success: boolean;
  count: number;
  vehicles: Vehicle[];
  message: string;
}

interface VehicleCounterProps {
  onRefresh?: () => void;
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

  const fetchVehiclesCount = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await get<VehicleCountResponse>('/api/client/vehicles-count');

      if (!response.ok) {
        throw new Error(response.error || 'Erro ao buscar contagem de veículos');
      }

      const data = response.data!;
      setCount(data.count);
      setVehicles(data.vehicles);

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehiclesCount();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="vehicle-counter loading">
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
        <div className="counter-icon">⚠️</div>
        <div className="counter-content">
          <h3>Erro</h3>
          <p>{error}</p>
          <button onClick={fetchVehiclesCount} className="retry-button">
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
          <div className="counter-number">{count}</div>
          <p>{count === 1 ? 'veículo cadastrado' : 'veículos cadastrados'}</p>
        </div>
        <div className="counter-actions">
          <button
            onClick={fetchVehiclesCount}
            className="refresh-button"
            title="Atualizar contagem"
          >
            🔄
          </button>
          {count > 0 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="details-button"
              title={showDetails ? 'Ocultar detalhes' : 'Mostrar detalhes'}
            >
              {showDetails ? '🔼' : '🔽'}
            </button>
          )}
        </div>
      </div>

      {showDetails && count > 0 && (
        <div className="vehicles-details">
          <h4>Detalhes dos Veículos:</h4>
          <div className="vehicles-list">
            {vehicles.map(vehicle => (
              <div
                key={vehicle.id}
                className="vehicle-item"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSelectedVehicle(vehicle);
                  setShowModal(true);
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
                  <span className={`vehicle-status ${vehicle.status}`}>
                    {vehicle.status === 'ativo' ? 'Ativo' : vehicle.status}
                  </span>
                </div>
              </div>
            ))}
            <VehicleDetailsModal
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              vehicle={selectedVehicle}
            />
          </div>
        </div>
      )}
    </div>
  );
}
