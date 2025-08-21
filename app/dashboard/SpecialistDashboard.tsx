import React, { useEffect, useMemo, useState } from 'react';
import Header from '../../modules/admin/components/Header';
import { supabase } from '@/modules/common/services/supabaseClient';
import { useSpecialistClients } from '@/modules/specialist/hooks/useSpecialistClients';
import { useClientVehicles, type VehicleData } from '@/modules/specialist/hooks/useClientVehicles';
import VehicleChecklistModal from '@/modules/specialist/components/VehicleChecklistModal';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import ClientTable from '@/modules/specialist/components/ClientTable';
import VehicleSection from '@/modules/specialist/components/VehicleSection';
import { useToast } from '@/modules/common/components/ToastProvider';

const SpecialistDashboard = () => {
  const { showToast } = useToast();
  const [userName, setUserName] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);
  const { clients, loading: loadingClients, error: clientsError } = useSpecialistClients();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Filtros de veículos (placa e status)
  const [filterPlate, setFilterPlate] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [checklistOpen, setChecklistOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);

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
  } = useClientVehicles(selectedClientId || undefined, {
    plate: filterPlate,
    status: filterStatus,
  });

  const availableStatuses = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach(v => v.status && set.add((v.status as string).toLowerCase()));
    return Array.from(set);
  }, [vehicles]);

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

  if (loadingUser || loadingClients) {
    return <div style={{ padding: 48, textAlign: 'center' }}>Carregando...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 0 0 0' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: 8, color: '#333' }}>
          Painel do Especialista
        </h1>
        <p style={{ color: '#666', fontSize: '1.15rem', marginBottom: 24 }}>
          Bem-vindo, {userName}!
        </p>

        <div
          style={{
            background: '#fff',
            borderRadius: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            padding: '36px 22px',
            maxWidth: '90vw',
            margin: '0 auto',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 20, color: '#333' }}>
            Meus Clientes Associados
          </h2>
          {clientsError ? (
            <p style={{ color: 'red' }}>Erro ao carregar clientes: {clientsError}</p>
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
                  vehicles={vehicles}
                  loading={loadingVehicles}
                  error={vehiclesError}
                  onRefetch={refetch}
                  filterPlate={filterPlate}
                  onFilterPlateChange={setFilterPlate}
                  filterStatus={filterStatus}
                  onFilterStatusChange={setFilterStatus}
                  availableStatuses={availableStatuses}
                  onClearFilters={() => {
                    setFilterPlate('');
                    setFilterStatus('');
                  }}
                  // filteredVehicles is no longer needed as filtering is done by backend
                  // vehicles prop now contains the already filtered and paginated list
                  filteredVehicles={vehicles}
                  onOpenChecklist={handleOpenChecklist} // Pass new handler
                  onConfirmArrival={handleConfirmArrival} // Pass new handler
                  confirming={isSubmitting} // Pass state from hook
                  // Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          )}
        </div>
      </main>
      <VehicleChecklistModal
        isOpen={checklistOpen}
        onClose={closeChecklist}
        onSaved={() => {
          try {
            refetch();
          } catch {}
        }}
        onFinalized={() => {
          try {
            refetch();
          } catch {}
        }}
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
