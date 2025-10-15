import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../../../modules/admin/components/Header';
import { supabase } from '@/modules/common/services/supabaseClient';
import { useSpecialistClients } from '@/modules/specialist/hooks/useSpecialistClients';
import { useClientVehicles, type VehicleData } from '@/modules/specialist/hooks/useClientVehicles';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import ClientTable from '@/modules/specialist/components/ClientTable/ClientTable';
import VehicleSection from '@/modules/specialist/components/VehicleSection/VehicleSection';
import { useToast } from '@/modules/common/components/ToastProvider';
import { useClientVehicleStatuses } from '@/modules/specialist/hooks/useClientVehicleStatuses';
import { Loading } from '@/modules/common/components/Loading/Loading';
import VehicleChecklistModal from '@/modules/specialist/components/VehicleChecklistModal/VehicleChecklistModal';
import styles from './SpecialistDashboard.module.css';

const SpecialistDashboard = () => {
  const { showToast } = useToast();
  const [userName, setUserName] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);
  const { clients, loading: loadingClients, error: clientsError } = useSpecialistClients();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Filtros de veículos (placa e status)
  const [filterPlate, setFilterPlate] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<string[]>([]);

  const [checklistOpen, setChecklistOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);

  const handleFilterStatusChange = (newStatus: string[]) => {
    setFilterStatus(newStatus);
  };

  const handleDateFilterChange = (newDateFilter: string[]) => {
    setDateFilter(newDateFilter);
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(prev => (prev === clientId ? null : clientId));
  };

  const handleOpenChecklist = async (vehicle: VehicleData) => {
    const s = String(vehicle.status || '').toUpperCase();
    const canOpen = s === VehicleStatus.CHEGADA_CONFIRMADA || s === VehicleStatus.EM_ANALISE;
    if (!canOpen) return;

    try {
      await startVehicleAnalysis(vehicle.id);
      setSelectedVehicle(vehicle);
      setChecklistOpen(true);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Erro ao iniciar análise');
    }
  };

  const handleConfirmArrival = async (vehicle: VehicleData) => {
    const s = String(vehicle.status || '').toUpperCase();
    const canConfirm =
      s === VehicleStatus.AGUARDANDO_COLETA || s === VehicleStatus.AGUARDANDO_CHEGADA;
    if (!canConfirm) return;

    try {
      await confirmVehicleArrival(vehicle.id);
      showToast('success', 'Chegada do veículo confirmada!');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Erro ao confirmar chegada');
    }
  };

  const closeChecklist = () => {
    setChecklistOpen(false);
    setSelectedVehicle(null);
  };

  const selectedClient = useMemo(
    () => clients.find(c => c.client_id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const handleClearCheckboxFilters = useCallback(() => {
    setFilterStatus([]);
    setDateFilter([]);
  }, []);

  const filters = useMemo(() => {
    const f: { plate?: string; status?: string[]; dateFilter?: string[] } = {};
    if (filterPlate) f.plate = filterPlate;
    if (filterStatus.length > 0) f.status = filterStatus;
    if (dateFilter.length > 0) f.dateFilter = dateFilter;
    return f;
  }, [filterPlate, filterStatus, dateFilter]);

  const {
    vehicles,
    loading: loadingVehicles,
    error: vehiclesError,
    refetch,
    isSubmitting,
    confirmVehicleArrival,
    startVehicleAnalysis,
    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,
  } = useClientVehicles(selectedClientId || undefined, filters);

  const { statuses: availableStatuses } = useClientVehicleStatuses(selectedClientId || undefined);

  // Calcular estatísticas para os contadores
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const totalVehicles = selectedClientId ? vehicles.length : 0;

    // Contar veículos por status (apenas se um cliente estiver selecionado)
    const vehiclesByStatus = selectedClientId
      ? vehicles.reduce(
          (acc, vehicle) => {
            const status = String(vehicle.status || '').toUpperCase();
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        )
      : {};

    return {
      totalClients,
      totalVehicles,
      vehiclesByStatus,
    };
  }, [clients.length, vehicles, selectedClientId]);

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        setUserName(profile?.full_name || '');
      }
      setLoadingUser(false);
    }
    fetchUser();
  }, []);

  return (
    <div className={styles.container}>
      <Header />

      {loadingUser || loadingClients ? (
        <div className={styles.loadingContainer}>
          <Loading />
        </div>
      ) : (
        <main className={styles.main}>
          <h1 className={styles.title}>Painel do Especialista</h1>
          <p className={styles.welcomeMessage}>Bem-vindo, {userName}!</p>

          {/* Contadores */}
          <div className={styles.statsContainer}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{stats.totalClients}</div>
              <div className={styles.statLabel}>Clientes Associados</div>
            </div>

            {selectedClient && (
              <>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{stats.totalVehicles}</div>
                  <div className={styles.statLabel}>Veículos do Cliente</div>
                </div>

                {/* Mostrar contadores por status se houver veículos */}
                {Object.entries(stats.vehiclesByStatus).map(([status, count]) => (
                  <div key={status} className={styles.statCard}>
                    <div className={styles.statNumber}>{count}</div>
                    <div className={styles.statLabel}>
                      {status === 'AGUARDANDO_CHEGADA' && 'Aguardando Chegada'}
                      {status === 'CHEGADA_CONFIRMADA' && 'Chegada Confirmada'}
                      {status === 'EM_ANALISE' && 'Em Análise'}
                      {status === 'ANALISE_FINALIZADA' && 'Análise Finalizada'}
                      {status === 'AGUARDANDO_COLETA' && 'Aguardando Coleta'}
                      {status === 'COLETADO' && 'Coletado'}
                      {![
                        'AGUARDANDO_CHEGADA',
                        'CHEGADA_CONFIRMADA',
                        'EM_ANALISE',
                        'ANALISE_FINALIZADA',
                        'AGUARDANDO_COLETA',
                        'COLETADO',
                      ].includes(status) && status}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className={styles.contentWrapper}>
            <h2 className={styles.clientsTitle}>Meus Clientes Associados</h2>

            {clientsError ? (
              <p className={styles.errorText}>Erro ao carregar clientes: {clientsError}</p>
            ) : clients.length === 0 ? (
              <p>Nenhum cliente associado a você ainda.</p>
            ) : (
              <div>
                <ClientTable
                  clients={clients}
                  selectedClientId={selectedClientId}
                  onSelectClient={handleSelectClient}
                />

                {selectedClient && (
                  <VehicleSection
                    clientName={selectedClient.client_full_name}
                    loading={loadingVehicles}
                    error={vehiclesError}
                    onRefetch={refetch}
                    filterPlate={filterPlate}
                    onFilterPlateChange={setFilterPlate}
                    filterStatus={filterStatus}
                    onFilterStatusChange={handleFilterStatusChange}
                    availableStatuses={availableStatuses}
                    dateFilter={dateFilter}
                    onDateFilterChange={handleDateFilterChange}
                    onClearFilters={() => {
                      setFilterPlate('');
                      setFilterStatus([]);
                      setDateFilter([]);
                    }}
                    onClearCheckboxFilters={handleClearCheckboxFilters}
                    filteredVehicles={vehicles}
                    onOpenChecklist={handleOpenChecklist}
                    onConfirmArrival={handleConfirmArrival}
                    confirming={isSubmitting}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>
            )}
          </div>
        </main>
      )}

      <VehicleChecklistModal
        isOpen={checklistOpen}
        onClose={closeChecklist}
        onSaved={() => refetch()}
        onFinalized={() => refetch()}
        vehicle={
          selectedVehicle
            ? {
                id: selectedVehicle.id,
                plate: selectedVehicle.plate,
                brand: selectedVehicle.brand,
                model: selectedVehicle.model,
                year: selectedVehicle.year,
                color: selectedVehicle.color,
              }
            : null
        }
      />
    </div>
  );
};

export default SpecialistDashboard;
