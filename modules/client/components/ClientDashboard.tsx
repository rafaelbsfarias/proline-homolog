'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import styles from './ClientDashboard.module.css';
import { VehicleCounterHeader } from '@/modules/client/components/VehicleCounterHeader';
import { VehicleCounterActions } from '@/modules/client/components/VehicleCounterActions';
import { VehicleCounterError } from '@/modules/client/components/VehicleCounterError';
import { VehicleCard } from '@/modules/client/components/VehicleCard';
import VehicleRegistrationModal from '@/modules/client/components/VehicleRegistrationModal';
import ClientCollectPointModal from '@/modules/client/components/ClientCollectPointModal';
import { ClientModule } from '@/modules/client/ClientModule';
import { useToast } from '@/modules/common/components/ToastProvider';

interface ProfileData {
  full_name: string;
  clients: {
    parqueamento?: number;
    taxa_operacao?: number;
  }[];
}

const ClientDashboard = () => {
  const [accepted, setAccepted] = useState(false);
  const [checked, setChecked] = useState(false);
  const [userName, setUserName] = useState('');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCadastrarVeiculoModal, setShowCadastrarVeiculoModal] = useState(false);
  const [showAddCollectPointModal, setShowAddCollectPointModal] = useState(false);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const clientModule = new ClientModule();

  useEffect(() => {
    async function fetchUserAndAcceptance() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch profile and client data in parallel
        const [profileResponse, clientResponse] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', user.id).single(),
          supabase
            .from('clients')
            .select('parqueamento, taxa_operacao')
            .eq('profile_id', user.id)
            .single(),
        ]);

        const { data: profile } = profileResponse;
        const { data: clientData } = clientResponse;

        if (profile) {
          setUserName(profile.full_name || '');
          setProfileData({
            full_name: profile.full_name || '',
            clients: [
              {
                parqueamento: clientData?.parqueamento,
                taxa_operacao: clientData?.taxa_operacao,
              },
            ],
          });
        }

        // Verifica aceite do contrato
        const { data: acceptance } = await supabase
          .from('client_contract_acceptance')
          .select('accepted_at')
          .eq('client_id', user.id)
          .maybeSingle();
        setAccepted(!!acceptance);
      }
      setLoading(false);
    }

    fetchUserAndAcceptance();
  }, []);

  useEffect(() => {
    const fetchVehicleCount = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token) {
        try {
          const response = await fetch('/api/client/vehicles-count', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const vehicleData = await response.json();
            const count =
              typeof vehicleData.count === 'number'
                ? vehicleData.count
                : vehicleData.vehicle_count || 0;
            setVehicleCount(count);
            
            // Fetch vehicles for display
            if (vehicleData.vehicles) {
              setVehicles(vehicleData.vehicles);
            }
          }
        } catch (err) {
          setError('Erro ao carregar veículos');
        }
      }
    };

    fetchVehicleCount();
  }, [profileData]);

  async function handleAcceptContract() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      if (!profileData || !profileData.clients || profileData.clients.length === 0) {
        setLoading(false);
        return;
      }

      const contentToSend = JSON.stringify(profileData.clients[0]);

      // Tenta usar a RPC; se indisponível, faz upsert direto como fallback
      const { data, error: generateLinkError } =
        await supabase.rpc('accept_client_contract', {
          p_client_id: user.id,
          p_content: contentToSend,
        });

      if (generateLinkError) {
        // Fallback: upsert direto, caso a função não exista no banco
        const { error: upsertError } = await supabase.from('client_contract_acceptance').upsert(
          {
            client_id: user.id,
            content: contentToSend,
            accepted_at: new Date().toISOString(),
          },
          { onConflict: 'client_id' }
        );
        if (upsertError) {
          setLoading(false);
          return;
        }
      }

      setAccepted(true);
    }
    setLoading(false);
  }

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token) {
        const response = await fetch('/api/client/vehicles-count', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const vehicleData = await response.json();
          const count =
            typeof vehicleData.count === 'number'
              ? vehicleData.count
              : vehicleData.vehicle_count || 0;
          setVehicleCount(count);
          
          // Fetch vehicles for display
          if (vehicleData.vehicles) {
            setVehicles(vehicleData.vehicles);
          }
        } else {
          throw new Error('Erro ao buscar dados');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleCreated = () => {
    showToast('success', 'Veículo cadastrado com sucesso!');
    handleRefresh();
  };

  const handleAddressCreated = () => {
    showToast('success', 'Endereço cadastrado com sucesso!');
  };

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center' }}>Carregando...</div>;
  }

  if (!profileData) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p>Erro ao carregar dados do perfil. Tente recarregar a página.</p>
      </div>
    );
  }

  return (
    <div className={styles.clientDashboard}>
      <div className={styles.dashboardMain}>
        {!accepted ? (
          <div className={styles.contractSection}>
            <h1 className={styles.contractTitle}>Termos do Contrato</h1>
            <p className={styles.contractSubtitle}>
              Por favor, leia e aceite os termos abaixo para ter acesso completo ao seu painel.
            </p>
            <div className={styles.contractCard}>
              <h2 className={styles.contractHeader}>Detalhes do Serviço</h2>
              <div className={styles.contractDetail}>
                <span className={styles.detailLabel}>Parqueamento:</span>
                <span className={styles.detailValue}>
                  R$ {profileData?.clients[0]?.parqueamento?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className={styles.contractDetail}>
                <span className={styles.detailLabel}>Taxa de Operação:</span>
                <span className={styles.detailValue}>
                  R$ {profileData?.clients[0]?.taxa_operacao?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className={styles.contractDetail}>
                <span>...</span>
              </div>
              <div className={styles.contractNote}>
                Demais termos e condições serão detalhados em documento anexo.
              </div>
              <div className={styles.contractAgreement}>
                <label className={styles.agreementCheckbox}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => setChecked(e.target.checked)}
                  />
                  Li e concordo com os termos do contrato
                </label>
              </div>
              <button
                className={styles.acceptButton}
                disabled={!checked || loading}
                onClick={handleAcceptContract}
              >
                Aceitar Contrato
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.dashboardContent}>
            <VehicleCounterHeader
              userName={userName}
              vehicleCount={vehicleCount}
              onRefresh={handleRefresh}
              loading={loading}
            />
            
            <VehicleCounterActions
              onCreateVehicle={() => setShowCadastrarVeiculoModal(true)}
              onCreateAddress={() => setShowAddCollectPointModal(true)}
              onRefresh={handleRefresh}
              loading={loading}
            />
            
            {error && (
              <VehicleCounterError
                error={error}
                onRetry={handleRefresh}
              />
            )}
            
            <div className={styles.vehiclesSection}>
              <h2 className={styles.sectionTitle}>Meus Veículos</h2>
              {vehicles.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Você ainda não possui veículos cadastrados.</p>
                  <button
                    className={styles.addButton}
                    onClick={() => setShowCadastrarVeiculoModal(true)}
                  >
                    Cadastrar meu primeiro veículo
                  </button>
                </div>
              ) : (
                <div className={styles.vehiclesGrid}>
                  {vehicles.map(vehicle => (
                    <VehicleCard
                      key={vehicle.id}
                      plate={vehicle.plate}
                      brand={vehicle.brand}
                      model={vehicle.model}
                      year={vehicle.year}
                      color={vehicle.color}
                      status={vehicle.status}
                      onClick={() => {
                        // TODO: Implement vehicle detail view
                        console.log('Vehicle clicked:', vehicle);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        <VehicleRegistrationModal
          isOpen={showCadastrarVeiculoModal}
          onClose={() => setShowCadastrarVeiculoModal(false)}
          onSuccess={handleVehicleCreated}
        />
        
        <ClientCollectPointModal
          isOpen={showAddCollectPointModal}
          onClose={() => setShowAddCollectPointModal(false)}
          onSuccess={handleAddressCreated}
        />
      </div>
    </div>
  );
};

export default ClientDashboard;