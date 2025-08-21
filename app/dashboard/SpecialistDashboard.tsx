import React, { useEffect, useMemo, useState } from 'react';
import Header from '../../modules/admin/components/Header';
import { supabase } from '@/modules/common/services/supabaseClient';
import { useSpecialistClients } from '@/modules/specialist/hooks/useSpecialistClients';
import { useClientVehicles, type VehicleData } from '@/modules/specialist/hooks/useClientVehicles';
import VehicleChecklistModal from '@/modules/specialist/components/VehicleChecklistModal';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import ClientTable from '@/modules/specialist/components/ClientTable';

import VehicleSection from '@/modules/specialist/components/VehicleSection';

const SpecialistDashboard = () => {
  const [userName, setUserName] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);
  const { clients, loading: loadingClients, error: clientsError } = useSpecialistClients();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const selectedClient = useMemo(
    () => clients.find(c => c.client_id === selectedClientId) || null,
    [clients, selectedClientId]
  );
  const {
    vehicles,
    loading: loadingVehicles,
    error: vehiclesError,
    refetch,
  } = useClientVehicles(selectedClientId || undefined);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState<Record<string, boolean>>({});

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(prev => (prev === clientId ? null : clientId));
  };

  const openChecklist = async (vehicle: VehicleData) => {
    const s = String((statusOverrides[vehicle.id] ?? vehicle.status) || '').toUpperCase();
    const canOpen = s === VehicleStatus.CHEGADA_CONFIRMADA || s === VehicleStatus.EM_ANALISE;
    if (!canOpen) return;
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const resp = await fetch('/api/specialist/start-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ vehicleId: vehicle.id }),
      });
      if (resp.ok) {
        setStatusOverrides(prev => ({ ...prev, [vehicle.id]: VehicleStatus.EM_ANALISE }));
      }
    } finally {
      setSelectedVehicle(vehicle);
      setChecklistOpen(true);
    }
  };
  const closeChecklist = () => {
    setChecklistOpen(false);
    setSelectedVehicle(null);
  };

  const confirmArrival = async (vehicle: VehicleData) => {
    try {
      const currentStatus = String(
        (statusOverrides[vehicle.id] ?? vehicle.status) || ''
      ).toUpperCase();
      const canConfirm =
        currentStatus === VehicleStatus.AGUARDANDO_COLETA ||
        currentStatus === VehicleStatus.AGUARDANDO_CHEGADA;
      if (!canConfirm) return;
      setConfirming(prev => ({ ...prev, [vehicle.id]: true }));
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const resp = await fetch('/api/specialist/confirm-arrival', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ vehicleId: vehicle.id }),
      });
      if (resp.ok) {
        setStatusOverrides(prev => ({ ...prev, [vehicle.id]: VehicleStatus.CHEGADA_CONFIRMADA }));
        try {
          refetch();
        } catch {}
      }
    } finally {
      setConfirming(prev => ({ ...prev, [vehicle.id]: false }));
    }
  };

  // Filtros de veículos (placa e status)
  const uiVehicles = useMemo(() => {
    return vehicles.map(v => ({ ...v, status: statusOverrides[v.id] ?? v.status }));
  }, [vehicles, statusOverrides]);
  const [filterPlate, setFilterPlate] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const filteredVehicles = useMemo(() => {
    const term = filterPlate.trim().toLowerCase();
    return uiVehicles.filter(v => {
      const matchesPlate = term ? v.plate.toLowerCase().includes(term) : true;
      const matchesStatus = filterStatus ? (v.status || '').toLowerCase() === filterStatus : true;
      return matchesPlate && matchesStatus;
    });
  }, [uiVehicles, filterPlate, filterStatus]);
  const availableStatuses = useMemo(() => {
    const set = new Set<string>();
    uiVehicles.forEach(v => v.status && set.add((v.status as string).toLowerCase()));
    return Array.from(set);
  }, [uiVehicles]);

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
                  filteredVehicles={filteredVehicles}
                  onOpenChecklist={openChecklist}
                  onConfirmArrival={confirmArrival}
                  confirming={confirming}
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
