import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import { supabase } from '@/modules/common/services/supabaseClient';
import CounterCard from '@/modules/partner/components/CounterCard';
import DataTable from '@/modules/partner/components/DataTable';
import ActionButton from '@/modules/partner/components/ActionButton';
import { PARTNER_CONTRACT_CONTENT } from '@/modules/common/constants/contractContent';
import ServiceModal from '@/modules/partner/components/ServiceModal';
import ContractAcceptanceView from '@/modules/partner/components/ContractAcceptanceView';

interface PendingQuote {
  id: number;
  client: string;
  service: string;
  date: string;
}

interface InProgressService {
  id: number;
  client: string;
  service: string;
  status: string;
}

const PartnerDashboard = () => {
  const router = useRouter();
  const [contractAccepted, setContractAccepted] = useState(false);
  const [contractContent, setContractContent] = useState('');
  const [contractSignedAt, setContractSignedAt] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingQuotesCount, setPendingQuotesCount] = useState(0);
  const [inProgressServicesCount, setInProgressServicesCount] = useState(0);

  const [pendingQuotes, setPendingQuotes] = useState<PendingQuote[]>([]);
  const [inProgressServices, setInProgressServices] = useState<InProgressService[]>([]);

  const [showAddServiceModal, setShowAddServiceModal] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
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

      const { data: acceptance } = await supabase
        .from('contract_partners')
        .select('created_at, content')
        .eq('partner_id', user.id)
        .maybeSingle();

      setContractAccepted(!!acceptance);
      if (acceptance) {
        setContractContent(acceptance.content || '');
        setContractSignedAt(acceptance.created_at);
      } else {
        setContractContent(PARTNER_CONTRACT_CONTENT);
      }

      // Dados mockados para visualização
      setPendingQuotesCount(5);
      setInProgressServicesCount(3);
      setPendingQuotes([
        { id: 1, client: 'Cliente A', service: 'Serviço X', date: '2025-08-01' },
        { id: 2, client: 'Cliente B', service: 'Serviço Y', date: '2025-08-02' },
      ]);
      setInProgressServices([
        { id: 101, client: 'Cliente C', service: 'Serviço Z', status: 'Em Andamento' },
        { id: 102, client: 'Cliente D', service: 'Serviço W', status: 'Aguardando Peças' },
      ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  async function handleAcceptContract() {
    if (!checked) return;

    setLoading(true);
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
        // Adicionar feedback para o usuário aqui, se desejar
      } else {
        setContractAccepted(true);
        fetchDashboardData(); // Recarrega os dados do dashboard
      }
    }
    setLoading(false);
  }

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center' }}>Carregando...</div>;
  }

  const pendingQuotesColumns: { key: keyof PendingQuote; header: string }[] = [
    { key: 'id', header: 'ID' },
    { key: 'client', header: 'Cliente' },
    { key: 'service', header: 'Serviço' },
    { key: 'date', header: 'Data' },
  ];

  const inProgressServicesColumns: { key: keyof InProgressService; header: string }[] = [
    { key: 'id', header: 'ID' },
    { key: 'client', header: 'Cliente' },
    { key: 'service', header: 'Serviço' },
    { key: 'status', header: 'Status' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      {!contractAccepted ? (
        <ContractAcceptanceView
          contractContent={contractContent}
          checked={checked}
          setChecked={setChecked}
          handleAcceptContract={handleAcceptContract}
          loading={loading}
          contractSignedAt={contractSignedAt}
        />
      ) : (
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 0 0 0' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: 8, color: '#333' }}>
            Painel do Parceiro - teste
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
              <ActionButton onClick={() => router.push('/dashboard/#')}>
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

          <DataTable
            title="Solicitações de Orçamentos Pendentes"
            data={pendingQuotes}
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
            onServiceAdded={fetchDashboardData}
          />
        </main>
      )}
    </div>
  );
};

export default PartnerDashboard;
