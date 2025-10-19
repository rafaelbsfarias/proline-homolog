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
import { useSpecialistPendingReviews } from '@/modules/specialist/hooks/useSpecialistPendingReviews';
import { useSpecialistProfile } from '@/modules/specialist/hooks/useSpecialistProfile';
import ForceChangePasswordModal from '@/modules/common/components/ForceChangePasswordModal/ForceChangePasswordModal';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import { useRouter } from 'next/navigation';
import styles from './SpecialistDashboard.module.css';

const SpecialistDashboard = () => {
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
