import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import { supabase } from '@/modules/common/services/supabaseClient';
import CounterCard from '@/modules/partner/components/CounterCard';
import DataTable from '@/modules/partner/components/DataTable';
import ActionButton from '@/modules/partner/components/ActionButton';
import PartnerVehicleChecklistModal from '@/modules/partner/components/PartnerVehicleChecklistModal';
import { PARTNER_CONTRACT_CONTENT } from '@/modules/common/constants/contractContent';
import ServiceModal from '@/modules/partner/components/ServiceModal';
import ContractAcceptanceView from '@/modules/partner/components/ContractAcceptanceView';
import {
  usePartnerDashboard,
  type PendingQuote,
  type InProgressService,
} from '@/modules/partner/hooks/usePartnerDashboard';
import { Loading } from '@/modules/common/components/Loading/Loading';
import { useToast } from '@/modules/common/components/ToastProvider';

type TablePendingQuote = {
  id: string;
  client_name: string;
  service_description: string;
  status: string;
  total_value: string;
  date: string;
};

const PartnerDashboard = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [checked, setChecked] = useState(false); // Para o checkbox do contrato
  const [isAcceptingContract, setIsAcceptingContract] = useState(false);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<PendingQuote | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<{
    id: string;
    brand: string;
    model: string;
    plate: string;
    year?: number;
    color?: string;
  } | null>(null);
  const [partnerCategory, setPartnerCategory] = useState<string>('');

  // Verificar categoria do parceiro
  useEffect(() => {
    const checkPartnerCategory = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) return;

      try {
        const { data: partnerCategories, error } = await supabase
          .from('partners_service_categories')
          .select('service_categories(name)')
          .eq('partner_id', user.id);

        if (error) {
          showToast('error', 'Erro ao carregar categoria do parceiro. Tente novamente.');
          return;
        }

        // Pega a primeira categoria encontrada (assumindo que um parceiro tem uma categoria principal)
        const category = partnerCategories?.[0]?.service_categories?.name?.toLowerCase() || '';
        setPartnerCategory(category);
      } catch {
        showToast('error', 'Erro ao carregar categoria do parceiro. Tente novamente.');
      }
    };

    checkPartnerCategory();
  }, []);

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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleOpenChecklist = async (quote: PendingQuote) => {
    try {
      // Buscar informações do veículo
      const { data: quoteData, error } = await supabase
        .from('quotes')
        .select(
          `
          vehicle_id,
          vehicles (
            id,
            brand,
            model,
            plate,
            year,
            color
          )
        `
        )
        .eq('id', quote.id)
        .single();

      if (error) {
        showToast('error', 'Erro ao buscar informações do veículo. Tente novamente.');
        return;
      }

      if (quoteData?.vehicles) {
        setSelectedVehicle({
          id: quoteData.vehicles.id,
          brand: quoteData.vehicles.brand,
          model: quoteData.vehicles.model,
          plate: quoteData.vehicles.plate,
          year: quoteData.vehicles.year,
          color: quoteData.vehicles.color,
        });
      }

      setSelectedQuote(quote);
      setChecklistModalOpen(true);
    } catch {
      showToast('error', 'Erro ao abrir checklist. Tente novamente.');
    }
  };

  const pendingQuotesColumns: {
    key: keyof TablePendingQuote;
    header: string;
    render?: (item: TablePendingQuote) => React.ReactNode;
  }[] = [
    { key: 'id', header: 'ID' },
    { key: 'service_description', header: 'Serviço' },
    { key: 'status', header: 'Status' },
    { key: 'total_value', header: 'Valor' },
    { key: 'date', header: 'Data' },
    {
      key: 'id',
      header: 'Checklist',
      render: (item: TablePendingQuote) => (
        <button
          onClick={() => handleOpenChecklist(item as unknown as PendingQuote)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Checklist
        </button>
      ),
    },
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
            data={pendingQuotes.map(
              (quote): TablePendingQuote => ({
                id: quote.id,
                client_name: quote.client_name,
                service_description: quote.service_description,
                status: formatQuoteStatus(quote.status),
                total_value: formatCurrency(quote.total_value),
                date: formatDate(quote.date),
              })
            )}
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

          {selectedQuote && (
            <PartnerVehicleChecklistModal
              isOpen={checklistModalOpen}
              onClose={() => {
                setChecklistModalOpen(false);
                setSelectedQuote(null);
                setSelectedVehicle(null);
              }}
              vehicle={selectedVehicle}
              quoteId={selectedQuote.id}
              partnerCategory={partnerCategory}
              onSaved={reloadData}
            />
          )}
        </main>
      )}
    </div>
  );
};

export default PartnerDashboard;
