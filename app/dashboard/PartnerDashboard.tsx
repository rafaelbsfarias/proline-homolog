import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import { supabase } from '@/modules/common/services/supabaseClient';
import CounterCard from '@/modules/partner/components/CounterCard';
import DataTable from '@/modules/partner/components/DataTable';
import ActionButton from '@/modules/partner/components/ActionButton';
import { PARTNER_CONTRACT_CONTENT } from '@/modules/common/constants/contractContent';
import ServiceModal from '@/modules/partner/components/ServiceModal';
import ContractAcceptanceView from '@/modules/partner/components/ContractAcceptanceView';
import {
  usePartnerDashboard,
  type PendingQuote,
  type InProgressService,
} from '@/modules/partner/hooks/usePartnerDashboard';
import { Loading } from '@/modules/common/components/Loading/Loading';

const PartnerDashboard = () => {
  const router = useRouter();
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [checked, setChecked] = useState(false); // Para o checkbox do contrato
  const [isAcceptingContract, setIsAcceptingContract] = useState(false);

  const {
    loading,
    userName,
    contractAccepted,
    contractContent,
    contractSignedAt,
    pendingQuotesCount,
    inProgressServicesCount,
    budgetCounters,
    pendingQuotes,
    inProgressServices,
    reloadData,
  } = usePartnerDashboard();

  async function handleAcceptContract() {
    if (!checked) return;

    setIsAcceptingContract(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase.rpc('accept_partner_contract', {
        p_partner_id: user.id,
        p_content: PARTNER_CONTRACT_CONTENT,
        p_signed: true,
      });

      if (error) {
        // A futura implementação de feedback ao usuário (ex: Toast) deve ser inserida aqui.
      } else {
        reloadData(); // Recarrega os dados do dashboard
      }
    }
    setIsAcceptingContract(false);
  }

  const formatQuoteStatus = (status: string) => {
    const statusMap = {
      pending_admin_approval: 'Aguardando Admin',
      pending_client_approval: 'Aguardando Cliente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const pendingQuotesColumns: { key: keyof PendingQuote; header: string }[] = [
    { key: 'id', header: 'ID' },
    { key: 'client_name', header: 'Cliente' },
    { key: 'service_description', header: 'Serviço' },
    { key: 'status', header: 'Status' },
    { key: 'total_value', header: 'Valor' },
    { key: 'date', header: 'Data' },
  ];

  const inProgressServicesColumns: { key: keyof InProgressService; header: string }[] = [
    { key: 'id', header: 'ID' },
    { key: 'client_name', header: 'Cliente' },
    { key: 'service_description', header: 'Serviço' },
    { key: 'status', header: 'Status' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      {loading ? (
        <Loading />
      ) : !contractAccepted ? (
        <ContractAcceptanceView
          contractContent={contractContent}
          checked={checked}
          setChecked={setChecked}
          handleAcceptContract={handleAcceptContract}
          loading={isAcceptingContract}
          contractSignedAt={contractSignedAt}
        />
      ) : (
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 0 0 0' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: 8, color: '#333' }}>
            Painel do Parceiro
          </h1>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <p style={{ color: '#666', fontSize: '1.15rem' }}>Bem-vindo, {userName}!</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <ActionButton onClick={() => router.push('/dashboard/services')}>
                Serviços Cadastrados
              </ActionButton>
              <ActionButton onClick={() => setShowAddServiceModal(true)}>
                Adicionar Serviço
              </ActionButton>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 24 }}>
            <CounterCard title="Solicitações Pendentes" count={pendingQuotesCount} />
            <CounterCard title="Serviços em Andamento" count={inProgressServicesCount} />
          </div>

          {/* Contadores de Orçamentos */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16, color: '#333' }}>
              Orçamentos
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '16px',
              }}
            >
              <div
                style={{
                  background: '#fff',
                  borderRadius: 8,
                  padding: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{ fontSize: '2rem', fontWeight: 700, color: '#f39c12', marginBottom: 4 }}
                >
                  {budgetCounters.pending}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Pendentes</div>
              </div>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 8,
                  padding: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{ fontSize: '2rem', fontWeight: 700, color: '#27ae60', marginBottom: 4 }}
                >
                  {budgetCounters.approved}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Aprovados</div>
              </div>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 8,
                  padding: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{ fontSize: '2rem', fontWeight: 700, color: '#e74c3c', marginBottom: 4 }}
                >
                  {budgetCounters.rejected}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Rejeitados</div>
              </div>
            </div>
          </div>

          <DataTable
            title="Solicitações de Orçamentos Pendentes"
            data={pendingQuotes.map(quote => ({
              ...quote,
              status: formatQuoteStatus(quote.status),
              total_value: formatCurrency(quote.total_value),
            }))}
            columns={pendingQuotesColumns}
            emptyMessage="Nenhuma solicitação de orçamento pendente."
          />

          <DataTable
            title="Serviços em Andamento"
            data={inProgressServices}
            columns={inProgressServicesColumns}
            emptyMessage="Nenhum serviço em andamento."
          />
          <ServiceModal
            isOpen={showAddServiceModal}
            onClose={() => setShowAddServiceModal(false)}
            onServiceAdded={reloadData} // Usa a função de recarregamento do hook
          />
        </main>
      )}
    </div>
  );
};

export default PartnerDashboard;
