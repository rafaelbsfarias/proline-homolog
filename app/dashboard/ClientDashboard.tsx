import React, { useEffect, useState } from 'react';
import Header from '@/modules/admin/components/Header';
import ClientVehicleRegistrationModal from '@/modules/client/components/VehicleRegistrationModal';
import ClientCollectPointModal from '@/modules/client/components/ClientCollectPointModal';
import VehicleCounter from '@/modules/client/components/VehicleCounter/VehicleCounter';
import ForceChangePasswordModal from '@/modules/common/components/ForceChangePasswordModal/ForceChangePasswordModal';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import '@/modules/client/components/ClientDashboard.css';
import VehicleCollectionSection from '@/modules/client/components/collection/VehicleCollectionSection';
import { useUserProfile } from '@/modules/client/hooks/useUserProfile';
import { useContractAcceptance } from '@/modules/client/hooks/useContractAcceptance';
import ContractAcceptanceScreen from '@/modules/client/components/dashboard/ContractAcceptanceScreen';
import { Loading } from '@/modules/common/components/Loading/Loading';

interface ProfileData {
  full_name: string;
  must_change_password?: boolean; // Made optional to prevent type errors
  clients: {
    parqueamento?: number;
    taxa_operacao?: number;
  }[];
}

const ClientDashboard: React.FC = () => {
  const [checked, setChecked] = useState(false);
  const [userName, setUserName] = useState('');
  const { profileData, userId, loading } = useUserProfile();
  const { accepted, setAccepted, loadingAcceptance, acceptContract } =
    useContractAcceptance(userId);
  const [showCadastrarVeiculoModal, setShowCadastrarVeiculoModal] = useState(false);
  const [showAddCollectPointModal, setShowAddCollectPointModal] = useState(false);
  const [showForceChangePasswordModal, setShowForceChangePasswordModal] = useState(false); // Added state for password change modal
  const [refreshVehicleCounter, setRefreshVehicleCounter] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [vehicleCounterLoading, setVehicleCounterLoading] = useState(true);
  const [collectionSectionLoading, setCollectionSectionLoading] = useState(true);

  const isComponentLoading = vehicleCounterLoading || collectionSectionLoading;

  useEffect(() => {
    if (profileData) {
      setUserName(profileData.full_name || '');
      if (profileData.must_change_password) {
        setShowForceChangePasswordModal(true);
      }
    }
  }, [profileData]);

  async function handleAcceptContract() {
    if (!profileData?.clients?.length) return;
    const contentToSend = JSON.stringify(profileData.clients[0]);
    await acceptContract(contentToSend);
  }

  const [showOverallLoader, setShowOverallLoader] = useState(true);

  useEffect(() => {
    if (loading || (accepted && isComponentLoading)) {
      setShowOverallLoader(true);
    } else {
      const timeout = setTimeout(() => setShowOverallLoader(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [loading, accepted, isComponentLoading]);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />

      {showOverallLoader && <Loading />}

      <div style={{ visibility: showOverallLoader ? 'hidden' : 'visible' }}>
        {!profileData ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p>Erro ao carregar dados do perfil. Tente recarregar a página.</p>
          </div>
        ) : !accepted ? (
          <ContractAcceptanceScreen
            fullName={userName}
            parqueamento={profileData?.clients[0]?.parqueamento}
            taxaOperacao={profileData?.clients[0]?.taxa_operacao}
            checked={checked}
            setChecked={setChecked}
            loading={loadingAcceptance}
            onAccept={handleAcceptContract}
          />
        ) : (
          <main className="dashboard-main">
            {/*   <h1 className="dashboard-title">Painel do Cliente</h1> */}
            <p className="dashboard-welcome">Bem-vindo, {userName}!</p>

            <div className="dashboard-actions">
              <button onClick={() => setShowCadastrarVeiculoModal(true)} className="dashboard-btn">
                Cadastrar Novo Veículo
              </button>
              <button onClick={() => setShowAddCollectPointModal(true)} className="dashboard-btn">
                Adicionar Ponto de Coleta
              </button>
            </div>

            <div className="dashboard-counter">
              <VehicleCounter
                key={refreshVehicleCounter}
                onLoadingChange={setVehicleCounterLoading}
              />
            </div>

            <div className="dashboard-counter">
              <VehicleCollectionSection onLoadingChange={setCollectionSectionLoading} />
            </div>
          </main>
        )}
      </div>

      <ClientVehicleRegistrationModal
        isOpen={showCadastrarVeiculoModal}
        onClose={() => setShowCadastrarVeiculoModal(false)}
        onSuccess={() => setRefreshVehicleCounter(k => k + 1)}
      />
      <ClientCollectPointModal
        isOpen={showAddCollectPointModal}
        onClose={() => setShowAddCollectPointModal(false)}
        onSuccess={() => {
          setShowAddCollectPointModal(false);
        }}
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
