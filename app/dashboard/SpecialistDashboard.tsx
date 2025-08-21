import React, { useEffect, useMemo, useState } from 'react';
import Header from '../../modules/admin/components/Header';
import { supabase } from '@/modules/common/services/supabaseClient';
import { useSpecialistClients } from '@/modules/specialist/hooks/useSpecialistClients';
import { useClientVehicles, type VehicleData } from '@/modules/specialist/hooks/useClientVehicles';
import VehicleChecklistModal from '@/modules/specialist/components/VehicleChecklistModal';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import ClientTable from '@/modules/specialist/components/ClientTable';

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
                <div
                  id={`vehicles-${selectedClient.client_id}`}
                  style={{ marginTop: 24, borderTop: '1px solid #eee', paddingTop: 16 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#333' }}>
                      Veículos de {selectedClient.client_full_name}
                    </h3>
                    <button
                      type="button"
                      onClick={refetch}
                      disabled={loadingVehicles}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid #ccc',
                        background: '#fafafa',
                        cursor: 'pointer',
                      }}
                    >
                      Atualizar
                    </button>
                  </div>

                  {vehiclesError && (
                    <p style={{ color: 'red', marginTop: 8 }}>Erro: {vehiclesError}</p>
                  )}
                  {loadingVehicles ? (
                    <p style={{ marginTop: 8 }}>Carregando veículos...</p>
                  ) : vehicles.length === 0 ? (
                    <p style={{ marginTop: 8 }}>Nenhum veículo cadastrado para este cliente.</p>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                        gap: 12,
                        marginTop: 12,
                      }}
                    >
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div
                          style={{
                            display: 'flex',
                            gap: 12,
                            flexWrap: 'wrap',
                            alignItems: 'flex-end',
                          }}
                        >
                          <div>
                            <label
                              htmlFor="filter-plate"
                              style={{ display: 'block', color: '#333' }}
                            >
                              Filtrar por placa
                            </label>
                            <input
                              id="filter-plate"
                              type="text"
                              placeholder="Ex: ABC1234"
                              value={filterPlate}
                              onChange={e => setFilterPlate(e.target.value)}
                              style={{
                                padding: '6px 8px',
                                border: '1px solid #ccc',
                                borderRadius: 6,
                              }}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="filter-status"
                              style={{ display: 'block', color: '#333' }}
                            >
                              Status
                            </label>
                            <select
                              id="filter-status"
                              value={filterStatus}
                              onChange={e => setFilterStatus(e.target.value)}
                              style={{
                                padding: '6px 8px',
                                border: '1px solid #ccc',
                                borderRadius: 6,
                              }}
                            >
                              <option value="">Todos</option>
                              {availableStatuses.map(s => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                          {(filterPlate || filterStatus) && (
                            <div>
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterPlate('');
                                  setFilterStatus('');
                                }}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: 6,
                                  border: '1px solid #ccc',
                                  background: '#fff',
                                  cursor: 'pointer',
                                }}
                              >
                                Limpar filtros
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {filteredVehicles.map(v => (
                        <div
                          key={v.id}
                          style={{
                            border: '1px solid #eee',
                            borderRadius: 8,
                            padding: 12,
                            background: '#fafafa',
                          }}
                        >
                          <div style={{ fontWeight: 600, color: '#333' }}>
                            {v.brand} {v.model}
                          </div>
                          <div style={{ color: '#555' }}>Placa: {v.plate}</div>
                          <div style={{ color: '#555' }}>Ano: {v.year}</div>
                          <div style={{ color: '#555' }}>Cor: {v.color}</div>
                          {v.status && <div style={{ color: '#555' }}>Status: {v.status}</div>}
                          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => openChecklist(v)}
                              disabled={
                                !(() => {
                                  const s = String(v.status || '').toUpperCase();
                                  return (
                                    s === VehicleStatus.CHEGADA_CONFIRMADA ||
                                    s === VehicleStatus.EM_ANALISE
                                  );
                                })()
                              }
                              style={{
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: '1px solid #ccc',
                                background: (() => {
                                  const s = String(v.status || '').toUpperCase();
                                  return s === VehicleStatus.CHEGADA_CONFIRMADA ||
                                    s === VehicleStatus.EM_ANALISE
                                    ? '#fff'
                                    : '#f0f0f0';
                                })(),
                                cursor: (() => {
                                  const s = String(v.status || '').toUpperCase();
                                  return s === VehicleStatus.CHEGADA_CONFIRMADA ||
                                    s === VehicleStatus.EM_ANALISE
                                    ? 'pointer'
                                    : 'not-allowed';
                                })(),
                              }}
                              aria-label={`Abrir checklist para o veículo ${v.plate}`}
                              title={(s =>
                                s === VehicleStatus.CHEGADA_CONFIRMADA ||
                                s === VehicleStatus.EM_ANALISE
                                  ? 'Abrir checklist'
                                  : 'Disponível após confirmar chegada')(
                                String(v.status || '').toUpperCase()
                              )}
                            >
                              Checklist
                            </button>

                            <button
                              type="button"
                              onClick={() => confirmArrival(v)}
                              disabled={
                                !!confirming[v.id] ||
                                !(() => {
                                  const s = String(v.status || '').toUpperCase();
                                  return (
                                    s === VehicleStatus.AGUARDANDO_COLETA ||
                                    s === VehicleStatus.AGUARDANDO_CHEGADA
                                  );
                                })()
                              }
                              style={{
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: '1px solid #ccc',
                                background: (() => {
                                  const s = String(v.status || '').toUpperCase();
                                  return s === VehicleStatus.AGUARDANDO_COLETA ||
                                    s === VehicleStatus.AGUARDANDO_CHEGADA
                                    ? '#e8f5e9'
                                    : '#f0f0f0';
                                })(),
                                cursor: (() => {
                                  const s = String(v.status || '').toUpperCase();
                                  return s === VehicleStatus.AGUARDANDO_COLETA ||
                                    s === VehicleStatus.AGUARDANDO_CHEGADA
                                    ? 'pointer'
                                    : 'not-allowed';
                                })(),
                              }}
                              aria-label={`Confirmar chegada do veículo ${v.plate}`}
                              title={(s =>
                                s === VehicleStatus.AGUARDANDO_COLETA ||
                                s === VehicleStatus.AGUARDANDO_CHEGADA
                                  ? 'Confirmar chegada'
                                  : `Disponível quando status for ${VehicleStatus.AGUARDANDO_COLETA} ou ${VehicleStatus.AGUARDANDO_CHEGADA}`)(
                                String(v.status || '').toUpperCase()
                              )}
                            >
                              {confirming[v.id] ? 'Confirmando...' : 'Confirmar chegada'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
