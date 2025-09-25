import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import { supabase } from '@/modules/common/services/supabaseClient';
import CounterCard from '@/modules/partner/components/dashboard/CounterCard';
import DataTable from '@/modules/common/components/shared/DataTable';
import ActionButton from '@/modules/partner/components/dashboard/ActionButton';
import { PARTNER_CONTRACT_CONTENT } from '@/modules/common/constants/contractContent';
import ServiceModal from '@/modules/partner/components/services/ServiceModal';
import ContractAcceptanceView from '@/modules/partner/components/contract/ContractAcceptanceView';
import {
  usePartnerDashboard,
  type PendingQuote,
  type InProgressService,
} from '@/modules/partner/hooks/usePartnerDashboard';
import { Loading } from '@/modules/common/components/Loading/Loading';
import {
  formatDate,
  formatCurrency,
  formatQuoteStatus,
  formatVehicleInfo,
} from '@/modules/common/utils/format';

// Tipo derivado para exibição na tabela
type PendingQuoteDisplay = Omit<PendingQuote, 'status' | 'total_value' | 'date'> & {
  status: string;
  total_value: string;
  date: string;
  vehicle: string;
};

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

  const handleEditQuote = (quote: PendingQuoteDisplay) => {
    // Navegar para a página de orçamento com o ID da cotação
    router.push(`/dashboard/partner/orcamento?quoteId=${quote.id}`);
  };

  const handleDeleteQuote = () => {
    // Implementar lógica para excluir orçamento
  };

  const handleChecklist = async (quote: PendingQuoteDisplay) => {
    // Obter a categoria do parceiro para determinar a rota correta
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: partner } = await supabase
        .from('partners')
        .select('service_categories')
        .eq('id', user.id)
        .single();

      // Se o parceiro tem categoria "Mecânica", vai para checklist completo
      // Senão, vai para checklist dinâmico (com evidências)
      const isMechanical = partner?.service_categories?.includes('Mecânica');
      const route = isMechanical
        ? `/dashboard/partner/checklist?quoteId=${quote.id}`
        : `/dashboard/partner/dynamic-checklist?quoteId=${quote.id}`;

      router.push(route);
    }
  };

  const handleEditService = () => {
    // Implementar lógica para editar serviço
  };

  const handleDeleteService = () => {
    // Implementar lógica para excluir serviço
  };

  const pendingQuotesColumns: { key: keyof PendingQuoteDisplay; header: string }[] = [
    { key: 'vehicle', header: 'Veículo' },
    { key: 'status', header: 'Status' },
    { key: 'total_value', header: 'Valor' },
    { key: 'date', header: 'Data' },
  ];

  const inProgressServicesColumns: { key: keyof InProgressService; header: string }[] = [
    { key: 'id', header: 'ID' },
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
              <ActionButton onClick={() => router.push('/dashboard/partner/services')}>
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

          <DataTable<PendingQuoteDisplay>
            title="Solicitações de Orçamentos Pendentes"
            data={pendingQuotes.map(quote => ({
              ...quote,
              vehicle: formatVehicleInfo(quote),
              status: formatQuoteStatus(quote.status),
              total_value: formatCurrency(quote.total_value),
              date: formatDate(quote.date),
            }))}
            columns={pendingQuotesColumns}
            emptyMessage="Nenhuma solicitação de orçamento pendente."
            showActions={true}
            onEdit={handleEditQuote}
            onDelete={handleDeleteQuote}
            onChecklist={handleChecklist}
          />

          <DataTable
            title="Serviços em Andamento"
            data={inProgressServices}
            columns={inProgressServicesColumns}
            emptyMessage="Nenhum serviço em andamento."
            showActions={true}
            onEdit={handleEditService}
            onDelete={handleDeleteService}
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
