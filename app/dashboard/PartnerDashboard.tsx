import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import { supabase } from '@/modules/common/services/supabaseClient';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

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
  raw_status: string;
  status: string;
  total_value: string;
  date: string;
  vehicle: string;
};

// Tipo derivado para exibição de serviços em andamento
type InProgressServiceDisplay = Omit<InProgressService, 'total_value' | 'approved_at'> & {
  total_value: string;
  approved_at: string;
  vehicle_info: string;
};

const PartnerDashboard = () => {
  const router = useRouter();
  const { post } = useAuthenticatedFetch();
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [checked, setChecked] = useState(false); // Para o checkbox do contrato
  const [isAcceptingContract, setIsAcceptingContract] = useState(false);
  const [quotesWithChecklist, setQuotesWithChecklist] = useState<Set<string>>(new Set());
  const [isCheckingChecklists, setIsCheckingChecklists] = useState(false);

  // Sistema de toast interno
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Função para verificar se existe checklist salvo para o orçamento
  const checkChecklistExists = async (quoteId: string): Promise<boolean> => {
    let attempts = 0;
    while (attempts < 3) {
      try {
        const response = await post<{ hasChecklist: boolean }>(
          '/api/partner/checklist/exists',
          { quoteId, _t: Date.now() }, // Cache-busting
          { requireAuth: true }
        );
        if (response.data?.hasChecklist) {
          return true;
        }
      } catch {
        // Ignore error and retry
      }
      attempts++;
      if (attempts < 3) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retrying
      }
    }
    return false;
  };

  const {
    loading,
    userName,
    contractAccepted,
    contractContent,
    contractSignedAt,
    budgetCounters,
    pendingQuotes,
    inProgressServices,
    reloadData,
  } = usePartnerDashboard();

  const checkAllQuotesChecklist = async () => {
    setIsCheckingChecklists(true);
    const checklistStatuses = new Set<string>();
    if (!pendingQuotes || pendingQuotes.length === 0) {
      setQuotesWithChecklist(checklistStatuses);
      setIsCheckingChecklists(false);
      return;
    }

    // Verificação concorrente para reduzir latência
    const results = await Promise.all(
      pendingQuotes.map(async quote => ({
        id: quote.id,
        exists: await checkChecklistExists(quote.id),
      }))
    );
    for (const r of results) {
      if (r.exists) checklistStatuses.add(r.id);
    }
    setQuotesWithChecklist(checklistStatuses);
    setIsCheckingChecklists(false);
  };
  const checkAllQuotesChecklistRef = useRef(checkAllQuotesChecklist);
  useEffect(() => {
    checkAllQuotesChecklistRef.current = checkAllQuotesChecklist;
  });

  // Verificar checklist quando a lista de pendingQuotes mudar
  useEffect(() => {
    checkAllQuotesChecklist();
  }, [pendingQuotes]);

  // Re-checar quando o usuário volta ao dashboard (focus/visibility)
  useEffect(() => {
    const onFocus = () => {
      checkAllQuotesChecklistRef.current();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAllQuotesChecklistRef.current();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisibility);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }, []);

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
        showToast('Erro ao aceitar contrato. Tente novamente.', 'error');
      } else {
        showToast('Contrato aceito com sucesso!', 'success');
        reloadData(); // Recarrega os dados do dashboard
      }
    }
    setIsAcceptingContract(false);
  }

  const handleEditQuote = async (quote: PendingQuoteDisplay) => {
    // Verificar se existe checklist salvo antes de permitir edição do orçamento
    const hasChecklist = await checkChecklistExists(quote.id);

    if (!hasChecklist) {
      showToast('É necessário realizar o checklist antes de editar o orçamento.', 'info');
      // Redirecionar para o checklist
      handleChecklist(quote);
      return;
    }

    // Se existe checklist, permitir editar orçamento
    router.push(`/dashboard/partner/orcamento?quoteId=${quote.id}`);
  };

  // Removido botão dedicado; status será atualizado junto com "Enviar para Admin"

  const handleSendToAdmin = async (quote: PendingQuoteDisplay) => {
    try {
      // Verificar se existe checklist e orçamento salvo
      const hasChecklist = await checkChecklistExists(quote.id);
      if (!hasChecklist) {
        showToast('É necessário realizar o checklist antes de enviar o orçamento.', 'error');
        return;
      }

      // Verificar se o orçamento foi salvo (tem valor > 0)
      const quoteValue = parseFloat(quote.total_value.replace(/[^\d,.-]/g, '').replace(',', '.'));
      if (quoteValue <= 0) {
        showToast(
          'É necessário salvar o orçamento com valor antes de enviar para análise.',
          'error'
        );
        return;
      }

      const resp = await post<{ ok: boolean; error?: string }>(
        '/api/partner/quotes/send-to-admin',
        {
          quoteId: quote.id,
          vehicleStatus: 'Análise Orçamentária Iniciada',
        },
        { requireAuth: true }
      );

      if (!resp.ok || !resp.data?.ok) {
        showToast(resp.error || 'Falha ao enviar orçamento.', 'error');
        return;
      }

      showToast(
        'Orçamento enviado ao admin e veículo marcado como "Análise Orçamentária Iniciada"!',
        'success'
      );
      reloadData();
    } catch {
      showToast('Erro inesperado. Tente novamente.', 'error');
    }
  };

  const handleChecklist = async (quote: PendingQuoteDisplay) => {
    // Obter a categoria do parceiro para determinar a rota correta
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Query alternativa: usar RPC para contornar possíveis problemas de RLS
      const { data: partnerCategories, error } = await supabase.rpc('get_partner_categories', {
        partner_id: user.id,
      });

      if (error) {
        return;
      }

      // A função RPC retorna um array direto de nomes de categorias
      const categories = partnerCategories || [];
      const isMechanical = categories.includes('Mecânica');

      // Se o parceiro tem categoria "mechanics", vai para checklist estruturado
      // Senão, vai para checklist dinâmico (com evidências)
      const route = isMechanical
        ? `/dashboard/partner/checklist?quoteId=${quote.id}`
        : `/dashboard/partner/dynamic-checklist?quoteId=${quote.id}`;

      router.push(route);
    }
  };

  const pendingQuotesColumns: { key: keyof PendingQuoteDisplay; header: string }[] = [
    { key: 'vehicle', header: 'Veículo' },
    { key: 'status', header: 'Status' },
    { key: 'total_value', header: 'Valor' },
    { key: 'date', header: 'Data' },
  ];

  const inProgressServicesColumns: { key: keyof InProgressServiceDisplay; header: string }[] = [
    { key: 'vehicle_info', header: 'Veículo' },
    { key: 'client_name', header: 'Cliente' },
    { key: 'service_description', header: 'Serviço' },
    { key: 'total_value', header: 'Valor' },
    { key: 'approved_at', header: 'Aprovado em' },
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

          {/* Contador de Serviços em Andamento */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                background: '#fff',
                borderRadius: 8,
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textAlign: 'center',
                maxWidth: '200px',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 8, color: '#333' }}>
                Serviços em Andamento
              </h3>
              <div
                style={{ fontSize: '2.5rem', fontWeight: 700, color: '#3498db', marginBottom: 4 }}
              >
                {inProgressServices.length}
              </div>
            </div>
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
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Pendente</div>
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
                  style={{ fontSize: '2rem', fontWeight: 700, color: '#9b59b6', marginBottom: 4 }}
                >
                  {budgetCounters.in_analysis || 0}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Em Análise</div>
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
            data={pendingQuotes.map(quote => {
              const getStatus = () => {
                const hasChecklist = quotesWithChecklist.has(quote.id);
                const hasValue = (quote.total_value ?? 0) > 0;

                if (!hasChecklist) {
                  return 'Checklist Pendente';
                }
                if (hasChecklist && !hasValue) {
                  return 'Checklist Iniciado';
                }
                if (hasChecklist && hasValue) {
                  // Lógica final: se a data de envio existe, foi enviado. Senão, está em elaboração.
                  if (quote.sent_to_admin_at) {
                    return 'Aguardando Admin';
                  }
                  return 'Orçamento Iniciado';
                }

                // Fallback para outros status como approved, rejected, etc.
                return formatQuoteStatus(quote.status);
              };

              return {
                ...quote,
                raw_status: quote.status,
                vehicle: formatVehicleInfo(quote),
                status: getStatus(),
                total_value: formatCurrency(quote.total_value ?? 0),
                date: formatDate(quote.date),
              };
            })}
            columns={pendingQuotesColumns}
            emptyMessage="Nenhuma solicitação de orçamento pendente."
            showActions={true}
            onEdit={handleEditQuote}
            onSendToAdmin={handleSendToAdmin}
            onChecklist={handleChecklist}
            canEdit={quote => quotesWithChecklist.has(quote.id)}
            canSendToAdmin={quote => {
              const hasChecklist = quotesWithChecklist.has(quote.id);
              // O valor vem formatado como 'R$ 1.234,56', precisamos converter para número
              const hasValue =
                parseFloat(quote.total_value.replace(/[^\d,.-]/g, '').replace(',', '.')) > 0;
              const isFinalStatus = ['pending_client_approval', 'approved', 'rejected'].includes(
                quote.raw_status
              );

              // Libera o botão se o status for "Orçamento Iniciado"
              return hasChecklist && hasValue && !isFinalStatus;
            }}
            loading={isCheckingChecklists}
          />

          <DataTable<InProgressServiceDisplay>
            title="Orçamentos Aprovados - Aguardando Execução"
            data={inProgressServices.map(service => ({
              ...service,
              total_value: service.total_value ? formatCurrency(service.total_value) : 'N/A',
              approved_at: service.approved_at ? formatDate(service.approved_at) : 'N/A',
              vehicle_info:
                service.vehicle_info ||
                formatVehicleInfo({
                  vehicle_plate: service.vehicle_plate,
                  vehicle_brand: service.vehicle_brand,
                  vehicle_model: service.vehicle_model,
                }),
            }))}
            columns={inProgressServicesColumns}
            emptyMessage="Nenhum orçamento aprovado aguardando execução."
            showActions={false}
          />
          <ServiceModal
            isOpen={showAddServiceModal}
            onClose={() => setShowAddServiceModal(false)}
            onServiceAdded={reloadData} // Usa a função de recarregamento do hook
          />
        </main>
      )}

      {/* Toast Component */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            background:
              toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxWidth: '400px',
            fontSize: '14px',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default PartnerDashboard;
