'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/modules/common/services/AuthProvider';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import styles from './SpecialistDashboard.module.css';
import VehicleDetailsModal from '@/modules/vehicles/components/VehicleDetailsModal';

interface Client {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
}

interface DashboardState {
  clients: Client[];
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
}

// Single Responsibility: Gerenciamento de estado do dashboard
class DashboardStateManager {
  static getInitialState(): DashboardState {
    return {
      clients: [],
      vehicles: [],
      loading: false,
      error: null,
    };
  }

  static setLoading(state: DashboardState): DashboardState {
    return { ...state, loading: true, error: null };
  }

  static setClients(state: DashboardState, clients: Client[]): DashboardState {
    return { ...state, clients, loading: false };
  }

  static setVehicles(state: DashboardState, vehicles: Vehicle[]): DashboardState {
    return { ...state, vehicles, loading: false };
  }

  static setError(state: DashboardState, error: string): DashboardState {
    return { ...state, error, loading: false };
  }
}

// Single Responsibility: Componente de lista de clientes
const ClientList: React.FC<{ clients: Client[] }> = ({ clients }) => {
  if (clients.length === 0) {
    return <div className={styles.emptyState}>Nenhum cliente associado</div>;
  }

  return (
    <div className={styles.listContainer}>
      {clients.map(client => (
        <div key={client.id} className={styles.clientCard}>
          <h3>{client.full_name}</h3>
          <p>{client.email}</p>
          <span className={styles.date}>
            Desde: {new Date(client.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  );
};

// Single Responsibility: Componente de lista de veículos
const VehicleList: React.FC<{ vehicles: Vehicle[]; onOpenDetails: (v: Vehicle) => void }> = ({
  vehicles,
  onOpenDetails,
}) => {
  if (vehicles.length === 0) {
    return <div className={styles.emptyState}>Nenhum veículo cadastrado</div>;
  }

  return (
    <div className={styles.listContainer}>
      {vehicles.map(vehicle => (
        <div key={vehicle.id} className={styles.vehicleCard}>
          <h3>
            {vehicle.brand} {vehicle.model}
          </h3>
          <p>Ano: {vehicle.year}</p>
          <p>Placa: {vehicle.license_plate}</p>
          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              onClick={() => onOpenDetails(vehicle)}
              className={styles.refreshButton}
            >
              Detalhes
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Single Responsibility: Componente de estatísticas
const StatsCard: React.FC<{ title: string; count: number; icon: string }> = ({
  title,
  count,
  icon,
}) => (
  <div className={styles.statsCard}>
    <div className={styles.statsIcon}>{icon}</div>
    <div className={styles.statsContent}>
      <h3>{count}</h3>
      <p>{title}</p>
    </div>
  </div>
);

const SpecialistDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { get } = useAuthenticatedFetch();
  const [state, setState] = useState<DashboardState>(DashboardStateManager.getInitialState());
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Single Responsibility: Buscar dados do dashboard
  const fetchDashboardData = useCallback(async () => {
    setState(DashboardStateManager.setLoading);

    try {
      const [clientsResponse, vehiclesResponse] = await Promise.all([
        get<{ clients: Client[] }>('/api/specialist/my-clients'),
        get<{ vehicles: Vehicle[] }>('/api/specialist/my-vehicles'),
      ]);

      if (!clientsResponse.ok) {
        throw new Error('Erro ao buscar clientes');
      }

      if (!vehiclesResponse.ok) {
        throw new Error('Erro ao buscar veículos');
      }

      setState(prev => {
        const newState = DashboardStateManager.setClients(
          prev,
          clientsResponse.data?.clients || []
        );
        return DashboardStateManager.setVehicles(newState, vehiclesResponse.data?.vehicles || []);
      });
    } catch (error) {
      setState(prev =>
        DashboardStateManager.setError(
          prev,
          error instanceof Error ? error.message : 'Erro ao carregar dados'
        )
      );
    }
  }, [get]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Single Responsibility: Refresh dos dados
  const handleRefresh = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Dashboard Especialista</h1>
          <div className={styles.userActions}>
            <span>Bem-vindo, {user?.user_metadata?.full_name || 'Especialista'}</span>
            <button
              onClick={handleRefresh}
              className={styles.refreshButton}
              disabled={state.loading}
            >
              🔄 Atualizar
            </button>
            <button onClick={logout} className={styles.logoutButton}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        {state.error && (
          <div className={styles.errorMessage}>
            {state.error}
            <button onClick={handleRefresh} className={styles.retryButton}>
              Tentar novamente
            </button>
          </div>
        )}

        {state.loading ? (
          <div className={styles.loading}>Carregando...</div>
        ) : (
          <>
            {/* Estatísticas */}
            <section className={styles.statsSection}>
              <StatsCard
                key="clientes-atendidos"
                title="Clientes Atendidos"
                count={state.clients.length}
                icon="👥"
              />
              <StatsCard
                key="veiculos-cadastrados"
                title="Veículos Cadastrados"
                count={state.vehicles.length}
                icon="🚗"
              />
            </section>

            {/* Seção de Clientes */}
            <section className={styles.section}>
              <h2>Meus Clientes</h2>
              <ClientList clients={state.clients} />
            </section>

            {/* Seção de Veículos */}
            <section className={styles.section}>
              <h2>Veículos dos Clientes</h2>
              <VehicleList
                vehicles={state.vehicles}
                onOpenDetails={v => {
                  setSelectedVehicle(v);
                  setShowDetails(true);
                }}
              />
            </section>
          </>
        )}
      </main>

      {showDetails && (
        <VehicleDetailsModal
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedVehicle(null);
          }}
          vehicle={
            selectedVehicle
              ? {
                  id: selectedVehicle.id,
                  plate: selectedVehicle.license_plate,
                  brand: selectedVehicle.brand,
                  model: selectedVehicle.model,
                  year: selectedVehicle.year,
                  color: '',
                  status: '',
                  created_at: '',
                  fipe_value: undefined,
                  client_name: undefined,
                  analyst: undefined,
                  arrival_forecast: undefined,
                  current_km: undefined,
                  params: undefined,
                  notes: undefined,
                  estimated_arrival_date: undefined,
                  current_odometer: undefined,
                  fuel_level: undefined,
                }
              : null
          }
          // Evitar chamada ao endpoint de cliente neste contexto
          specialistsLoader={async () => ({ names: '' })}
        />
      )}
    </div>
  );
};

export default SpecialistDashboard;
