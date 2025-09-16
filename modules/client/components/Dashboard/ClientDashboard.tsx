'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import { useVehicleManager } from '@/modules/client/hooks/useVehicleManager';
import { useToast } from '@/modules/common/components/ToastProvider';
import { VehicleCounterHeader } from './VehicleCounterHeader';
import { VehicleCounterActions } from '../VehicleCounterActions';
import { VehicleCounterError } from '../VehicleCounterError';
import { VehicleRegistrationModal } from '../Modals';
import { ClientCollectPointModal } from '../Modals';
import styles from './ClientDashboard.module.css';

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
  const [loadingUser, setLoadingUser] = useState(true);
  const [showCadastrarVeiculoModal, setShowCadastrarVeiculoModal] = useState(false);
  const [showAddCollectPointModal, setShowAddCollectPointModal] = useState(false);
  const {
    vehicles,
    loading: loadingVehicles,
    error: vehiclesError,
    refetch: refetchVehicles,
  } = useVehicleManager();
  const { showToast } = useToast();

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
      setLoadingUser(false);
    }
    fetchUserAndAcceptance();
  }, []);

  const handleAcceptContract = async () => {
    setLoadingUser(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      if (!profileData || !profileData.clients || profileData.clients.length === 0) {
        setLoadingUser(false);
        return;
      }

      const contentToSend = JSON.stringify(profileData.clients[0]);

      // Tenta usar a RPC; se indisponível, faz upsert direto como fallback
      const { data, error } = await supabase.rpc('accept_client_contract', {
        p_client_id: user.id,
        p_content: contentToSend,
      });

      if (error) {
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
          setLoadingUser(false);
          return;
        }
      }

      setAccepted(true);
    }
    setLoadingUser(false);
  };

  const handleVehicleCreated = () => {
    showToast('success', 'Veículo cadastrado com sucesso!');
    refetchVehicles();
  };

  const handleAddressCreated = () => {
    showToast('success', 'Endereço cadastrado com sucesso!');
  };

  if (loadingUser) {
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
                disabled={!checked || loadingUser}
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
              vehicleCount={vehicles.length}
              onRefresh={refetchVehicles}
              loading={loadingVehicles}
            />

            <VehicleCounterActions
              onCreateVehicle={() => setShowCadastrarVeiculoModal(true)}
              onCreateAddress={() => setShowAddCollectPointModal(true)}
              onRefresh={refetchVehicles}
              loading={loadingVehicles}
            />

            {vehiclesError && (
              <VehicleCounterError error={vehiclesError} onRetry={refetchVehicles} />
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
                <div className={styles.vehiclesList}>
                  {vehicles.map(vehicle => (
                    <div key={vehicle.id} className={styles.vehicleItem}>
                      <div className={styles.vehicleInfo}>
                        <span className={styles.vehiclePlate}>{vehicle.plate}</span>
                        <span className={styles.vehicleModel}>
                          {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </span>
                      </div>
                      <div className={styles.vehicleMeta}>
                        <span className={styles.vehicleDate}>
                          Cadastrado em {new Date(vehicle.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span className={styles.vehicleStatus}>
                          {vehicle.status || 'Sem status'}
                        </span>
                      </div>
                    </div>
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
