import React, { useEffect, useState } from 'react';
import styles from '@/modules/common/components/SignupPage.module.css';
import Header from '@/modules/admin/components/Header';
import { supabase } from '@/modules/common/services/supabaseClient';
import ClientVehicleRegistrationModal from '@/modules/client/components/VehicleRegistrationModal';
import ClientCollectPointModal from '@/modules/client/components/ClientCollectPointModal';
import VehicleCounter from '@/modules/client/components/VehicleCounter';
import ForceChangePasswordModal from '@/modules/common/components/ForceChangePasswordModal/ForceChangePasswordModal';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import '@/modules/client/components/ClientDashboard.css';
import VehicleCollectionSection from '@/modules/client/components/VehicleCollectionSection';

interface ProfileData {
  full_name: string;
  must_change_password?: boolean; // Made optional to prevent type errors
  clients: {
    parqueamento?: number;
    taxa_operacao?: number;
  }[];
}

const ClientDashboard: React.FC = () => {
  const [accepted, setAccepted] = useState(false);
  const [checked, setChecked] = useState(false);
  const [userName, setUserName] = useState('');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCadastrarVeiculoModal, setShowCadastrarVeiculoModal] = useState(false);
  const [showAddCollectPointModal, setShowAddCollectPointModal] = useState(false);
  const [showForceChangePasswordModal, setShowForceChangePasswordModal] = useState(false); // Added state for password change modal
  const [vehicleCount, setVehicleCount] = useState(0);
  const [refreshVehicleCounter, setRefreshVehicleCounter] = useState(0);
  const [showForceChangePasswordModal, setShowForceChangePasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    async function fetchUserAndAcceptance() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Buscar perfil com fallback caso a coluna must_change_password não exista
        const profilePromise = supabase
          .from('profiles')
          .select('full_name, must_change_password')
          .eq('id', user.id)
          .single();
        const clientPromise = supabase
          .from('clients')
          .select('parqueamento, taxa_operacao')
          .eq('profile_id', user.id)
          .single();

        const [profileResponse, clientResponse] = await Promise.all([
          supabase
            .from('profiles')
            .select('full_name, must_change_password')
            .eq('id', user.id)
            .single(),
          supabase
            .from('clients')
            .select('parqueamento, taxa_operacao')
            .eq('profile_id', user.id)
            .single(),
        ]);

        interface ProfileResponseShape {
          data?: { full_name?: string; must_change_password?: boolean };
          error?: unknown;
        }
        const profileResp = profileResponse as ProfileResponseShape;
        const profileError = profileResp.error;
        let profile = profileResp.data ?? null;
        if (profileError) {
          // Normalize error to string for environments where profileError is not typed
          const getStringProp = (obj: unknown, prop: string): string | undefined => {
            if (typeof obj === 'object' && obj !== null && prop in obj) {
              try {
                const r = obj as Record<string, unknown>;
                return r[prop] !== undefined ? String(r[prop]) : undefined;
              } catch {
                return undefined;
              }
            }
            return undefined;
          };

          const msg = (
            getStringProp(profileError, 'message') || String(profileError || '')
          ).toLowerCase();
          // Fallback: ambientes sem a coluna must_change_password
          const code = getStringProp(profileError, 'code');
          if (
            msg.includes('must_change_password') ||
            msg.includes('column') ||
            code === 'PGRST100'
          ) {
            const fallback = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', user.id)
              .single();
            profile = fallback.data ? { ...fallback.data, must_change_password: false } : null;
          }
        }

        const { data: clientData } = clientResponse;

        if (profile) {
          setUserName(profile.full_name || '');
          setProfileData({
            full_name: profile.full_name || '',
            must_change_password: !!profile.must_change_password,
            clients: [
              {
                parqueamento: clientData?.parqueamento,
                taxa_operacao: clientData?.taxa_operacao,
              },
            ],
          });

          if (profile.must_change_password) {
            setShowForceChangePasswordModal(true);
          }
        }

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
          }
        } catch {}
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
      if (!profileData?.clients?.length) {
        setLoading(false);
        return;
      }
      const contentToSend = JSON.stringify(profileData.clients[0]);
      const { error } = await supabase.rpc('accept_client_contract', {
        p_client_id: user.id,
        p_content: contentToSend,
      });
      if (error) {
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

  if (loading) return <div style={{ padding: 48, textAlign: 'center' }}>Carregando...</div>;

  if (!profileData) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p>Erro ao carregar dados do perfil. Tente recarregar a página.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      {!accepted ? (
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 10px 0 0' }}>
          <h1
            style={{
              fontSize: '2.4rem',
              fontWeight: 600,
              marginBottom: 8,
              textAlign: 'center',
              color: '#333',
            }}
          >
            Termos do Contrato
          </h1>
          <p style={{ textAlign: 'center', color: '#666', fontSize: '1.15rem', marginBottom: 32 }}>
            Por favor, leia e aceite os termos abaixo para ter acesso completo ao seu painel.
          </p>
          <div
            style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center' }}
          >
            <div
              style={{
                background: '#fafafa',
                borderRadius: 12,
                boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
                padding: '36px 32px 32px 32px',
                minWidth: 600,
                maxWidth: 900,
                marginBottom: 32,
              }}
            >
              <h2 style={{ fontWeight: 600, fontSize: '1.3rem', marginBottom: 18 }}>
                Detalhes do Serviço
              </h2>
              <div style={{ fontSize: '1.08rem', color: '#222', marginBottom: 8 }}>
                <b>Parqueamento:</b> R${' '}
                {profileData?.clients[0]?.parqueamento?.toFixed(2) || '0.00'}
              </div>
              <div style={{ fontSize: '1.08rem', color: '#222', marginBottom: 8 }}>
                <b>Taxa de Operação:</b> R${' '}
                {profileData?.clients[0]?.taxa_operacao?.toFixed(2) || '0.00'}
              </div>
              <div style={{ fontSize: '1.08rem', color: '#222', marginBottom: 8 }}>...</div>
              <div style={{ color: '#888', fontSize: '1.08rem', marginTop: 18 }}>
                Demais termos e condições serão detalhados em documento anexo.
              </div>
              <div style={{ marginTop: 32 }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '1.08rem',
                    color: '#222',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => setChecked(e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  Li e concordo com os termos do contrato
                </label>
              </div>
              <button
                className={styles.submitButton}
                style={{
                  marginTop: 24,
                  background: '#aab0bb',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '1.13rem',
                  opacity: checked ? 1 : 0.7,
                  cursor: checked ? 'pointer' : 'not-allowed',
                }}
                disabled={!checked || loading}
                onClick={handleAcceptContract}
              >
                Aceitar Contrato
              </button>
            </div>
          </div>
        </main>
      ) : (
        <main className="dashboard-main">
          <h1 className="dashboard-title">Painel do Cliente</h1>
          <p className="dashboard-welcome">Bem-vindo, {userName}!</p>

          <div className="dashboard-actions">
            <button onClick={() => setShowCadastrarVeiculoModal(true)} className="dashboard-btn">
              Cadastrar Novo Veículo
            </button>
            <button onClick={() => setShowAddCollectPointModal(true)} className="dashboard-btn">
              Adicionar Ponto de Coleta
            </button>
          </div>

          {/* Meus Veículos */}
          <div className="dashboard-counter">
            <VehicleCounter key={refreshVehicleCounter} />
          </div>

          {/* Coleta de Veículos */}
          <div className="dashboard-counter">
            <VehicleCollectionSection />
          </div>
        </main>
      )}

      <ClientVehicleRegistrationModal
        isOpen={showCadastrarVeiculoModal}
        onClose={() => setShowCadastrarVeiculoModal(false)}
        onSuccess={() => setRefreshVehicleCounter(k => k + 1)}
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

export default ClientDashboard;
