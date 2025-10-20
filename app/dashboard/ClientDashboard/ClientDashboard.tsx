import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import ClientVehicleRegistrationModal from '@/modules/client/components/VehicleRegistrationModal';
import ClientCollectPointModal from '@/modules/client/components/ClientCollectPointModal';
import VehicleCounter, {
  VehicleCounterRef,
} from '@/modules/client/components/VehicleCounter/VehicleCounter';
import ForceChangePasswordModal from '@/modules/common/components/ForceChangePasswordModal/ForceChangePasswordModal';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';
import './ClientDashboard.css';
import VehicleCollectionSection from '@/modules/client/components/Collection/VehicleCollectionSection/VehicleCollectionSection';
import PendingQuotesCard from '@/modules/client/components/PendingQuotes/PendingQuotesCard';
import { useAddresses } from '@/modules/client/hooks/useAddresses';
import ApprovedQuotesCard from '@/modules/client/components/ApprovedQuotes/ApprovedQuotesCard';
import { useUserProfile } from '@/modules/client/hooks/useUserProfile';
import { useContractAcceptance } from '@/modules/client/hooks/useContractAcceptance';
import ContractAcceptanceScreen from '@/modules/client/components/Dashboard/ContractAcceptanceScreen';
import { Loading } from '@/modules/common/components/Loading/Loading';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';

const ClientDashboard: React.FC = () => {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [userName, setUserName] = useState('');
  const { profileData, userId, loading } = useUserProfile();
  const { accepted, loadingAcceptance, acceptContract } = useContractAcceptance(userId);
  const { addresses, collectPoints, refetch: refetchAddresses } = useAddresses();
  const vehicleCounterRef = useRef<VehicleCounterRef>(null);
  const [showCadastrarVeiculoModal, setShowCadastrarVeiculoModal] = useState(false);
  const [showAddCollectPointModal, setShowAddCollectPointModal] = useState(false);
  const [showForceChangePasswordModal, setShowForceChangePasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [vehicleCounterLoading, setVehicleCounterLoading] = useState(true);
  const [collectionSectionLoading, setCollectionSectionLoading] = useState(true);
  const [pendingQuotesLoading, setPendingQuotesLoading] = useState(true);
  const [approvedQuotesLoading, setApprovedQuotesLoading] = useState(true);

  const isComponentLoading =
    vehicleCounterLoading ||
    collectionSectionLoading ||
    pendingQuotesLoading ||
    approvedQuotesLoading;

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
  const [initialLoadFinished, setInitialLoadFinished] = useState(false);

  useEffect(() => {
    // Only show the overall loader on the initial load cycle.
    if (!initialLoadFinished) {
      if (loading || (accepted && isComponentLoading)) {
        setShowOverallLoader(true);
      } else {
        // This marks the end of the initial load.
        const timeout = setTimeout(() => {
          setShowOverallLoader(false);
          setInitialLoadFinished(true);
        }, 300);
        return () => clearTimeout(timeout);
      }
    }
  }, [loading, accepted, isComponentLoading, initialLoadFinished]);

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
              <SolidButton
                onClick={() => setShowCadastrarVeiculoModal(true)}
                className="solidButtonLarge"
              >
                Cadastrar Novo Veículo
              </SolidButton>
              <SolidButton
                onClick={() => setShowAddCollectPointModal(true)}
                className="solidButtonLarge"
              >
                Adicionar Ponto de Coleta
              </SolidButton>
              <SolidButton
                onClick={() => userId && router.push(`/dashboard/client/${userId}/overview`)}
                className="solidButtonLarge"
              >
                Resumo Financeiro
              </SolidButton>
            </div>

            <div className="dashboard-counter">
              <VehicleCounter
                ref={vehicleCounterRef}
                onLoadingChange={setVehicleCounterLoading}
                addresses={addresses}
                collectPoints={collectPoints}
              />
            </div>

            <div className="dashboard-counter">
              <VehicleCollectionSection onLoadingChange={setCollectionSectionLoading} />
            </div>

            <div className="dashboard-counter">
              <PendingQuotesCard onLoadingChange={setPendingQuotesLoading} />
            </div>

            <div className="dashboard-counter">
              <ApprovedQuotesCard onLoadingChange={setApprovedQuotesLoading} />
            </div>
          </main>
        )}
      </div>

      <ClientVehicleRegistrationModal
        isOpen={showCadastrarVeiculoModal}
        onClose={() => setShowCadastrarVeiculoModal(false)}
        onSuccess={() => {
          refetchAddresses();
          vehicleCounterRef.current?.refetch();
        }}
      />
      <ClientCollectPointModal
        isOpen={showAddCollectPointModal}
        onClose={() => setShowAddCollectPointModal(false)}
        onSuccess={() => {
          setShowAddCollectPointModal(false);
          refetchAddresses();
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
