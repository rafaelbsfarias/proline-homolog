import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../../../modules/admin/components/Header';
import { useSpecialistClients } from '@/modules/specialist/hooks/useSpecialistClients';
import { useClientVehicles, type VehicleData } from '@/modules/specialist/hooks/useClientVehicles';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import ClientTable from '@/modules/specialist/components/ClientTable/ClientTable';
import VehicleSection from '@/modules/specialist/components/VehicleSection/VehicleSection';
import { useToast } from '@/modules/common/components/ToastProvider';
import { useClientVehicleStatuses } from '@/modules/specialist/hooks/useClientVehicleStatuses';
import { Loading } from '@/modules/common/components/Loading/Loading';
import VehicleChecklistModal from '@/modules/specialist/components/VehicleChecklistModal/VehicleChecklistModal';
import SpecialistRequestedPartsCounter from '@/modules/specialist/components/SpecialistRequestedPartsCounter';
import SpecialistTimeApprovalsCounter from '@/modules/specialist/components/SpecialistTimeApprovalsCounter';
import PendingReviewsCard from '@/modules/specialist/components/PendingReviewsCard';
import AwaitingPickupCard from '@/modules/specialist/components/AwaitingPickupCard';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { useSpecialistPendingReviews } from '@/modules/specialist/hooks/useSpecialistPendingReviews';
import { useSpecialistProfile } from '@/modules/specialist/hooks/useSpecialistProfile';
import ForceChangePasswordModal from '@/modules/common/components/ForceChangePasswordModal/ForceChangePasswordModal';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import { useRouter } from 'next/navigation';
import styles from './SpecialistDashboard.module.css';

const SpecialistDashboard = () => {
  const { get } = useAuthenticatedFetch();
  const { showToast } = useToast();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const { clients, loading: loadingClients, error: clientsError } = useSpecialistClients();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Hook para perfil do especialista (incluindo must_change_password)
  const { profileData, loading: loadingProfile } = useSpecialistProfile();

  // Hook para revisões pendentes do parceiro
  const { pendingReviews, loading: loadingReviews } = useSpecialistPendingReviews();

  // Estados para modal de mudança de senha
  const [showForceChangePasswordModal, setShowForceChangePasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Filtros de veículos (placa e status)
  const [filterPlate, setFilterPlate] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<string[]>([]);

  const [checklistOpen, setChecklistOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);

  // Retiradas aguardando (pickup) para o especialista
  const [awaitingPickup, setAwaitingPickup] = useState<any[]>([]);
  const [loadingAwaiting, setLoadingAwaiting] = useState(false);

  const refetchAwaitingPickup = async () => {
    setLoadingAwaiting(true);
    try {
      const resp = await get<{ success: boolean; items: any[] }>(
        '/api/specialist/vehicles-awaiting-pickup'
      );
      if (resp.ok && resp.data?.success) {
        setAwaitingPickup(resp.data.items || []);
      }
    } finally {
      setLoadingAwaiting(false);
    }
  };

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

    // Detectar status de entrega/retirada
    const isAwaitingDelivery = vehicle.status?.includes('Finalizado: Aguardando Entrega');
    const isAwaitingPickup = vehicle.status?.includes('Finalizado: Aguardando Retirada');
    const isDeliveryPickup = isAwaitingDelivery || isAwaitingPickup;

    if (!canConfirm && !isDeliveryPickup) return;

    try {
      if (isDeliveryPickup) {
        // Chamar API de confirmar entrega/retirada
        await confirmVehicleDelivery(vehicle.id);
        const message = isAwaitingDelivery
          ? 'Entrega do veículo confirmada!'
          : 'Retirada do veículo confirmada!';
        showToast('success', message);
      } else {
        // Lógica original de confirmar chegada
        await confirmVehicleArrival(vehicle.id);
        showToast('success', 'Chegada do veículo confirmada!');
      }
    } catch (err) {
      const action = isDeliveryPickup ? 'confirmar entrega/retirada' : 'confirmar chegada';
      showToast('error', err instanceof Error ? err.message : `Erro ao ${action}`);
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

  const handleReviewClick = (quoteId: string) => {
    router.push(`/dashboard/specialist/time-approvals?quote=${quoteId}`);
  };

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
    confirmVehicleDelivery,
    startVehicleAnalysis,
    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,
  } = useClientVehicles(selectedClientId || undefined, filters);

  const { statuses: availableStatuses, refetchStatuses } = useClientVehicleStatuses(
    selectedClientId || undefined
  );

  useEffect(() => {
    if (profileData) {
      setUserName(profileData.full_name || '');
      if (profileData.must_change_password) {
        setShowForceChangePasswordModal(true);
      }
    }
  }, [profileData]);

  useEffect(() => {
    refetchAwaitingPickup();
  }, []);

  return (
    <div className={styles.container}>
      <Header />

      {loadingProfile || loadingClients ? (
        <div className={styles.loadingContainer}>
          <Loading />
        </div>
      ) : (
        <main className={styles.main}>
          <h1 className={styles.title}>Painel do Especialista</h1>
          <p className={styles.welcomeMessage}>Bem-vindo, {userName}!</p>

          {/* Contadores */}
          <div className={styles.countersContainer}>
            <SpecialistRequestedPartsCounter />
            <SpecialistTimeApprovalsCounter />
          </div>

          {/* Card de Revisões Pendentes */}
          <PendingReviewsCard
            reviews={pendingReviews}
            loading={loadingReviews}
            onReviewClick={handleReviewClick}
          />

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

          {/* Card: Entregas/Retiradas Agendadas — posicionado abaixo, dentro do main */}
          <div style={{ marginTop: 16 }}>
            <AwaitingPickupCard
              items={awaitingPickup}
              loading={loadingAwaiting}
              onRefresh={refetchAwaitingPickup}
            />
          </div>
        </main>
      )}

      <VehicleChecklistModal
        isOpen={checklistOpen}
        onClose={closeChecklist}
        onSaved={() => refetch()}
        onFinalized={() => refetch()}
        vehicle={selectedVehicle}
      />

      <ForceChangePasswordModal
        isOpen={showForceChangePasswordModal}
        onClose={() => setShowForceChangePasswordModal(false)}
        onSuccess={() => {
          setShowForceChangePasswordModal(false);
          setShowSuccessModal(true);
        }}
        onError={message => {
          setErrorMessage(message);
          setShowErrorModal(true);
        }}
      />

      {showSuccessModal && (
        <MessageModal
          title="Sucesso!"
          message="Sua senha foi atualizada com sucesso."
          variant="success"
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      {showErrorModal && (
        <MessageModal
          title="Erro"
          message={errorMessage}
          variant="error"
          onClose={() => setShowErrorModal(false)}
        />
      )}
    </div>
  );
};

export default SpecialistDashboard;
