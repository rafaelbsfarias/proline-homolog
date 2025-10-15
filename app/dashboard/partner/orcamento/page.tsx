'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/modules/common/services/supabaseClient';
import { usePartnerServices, PartnerService } from '@/modules/partner/hooks/usePartnerServices';
import { useBudget } from '@/modules/partner/hooks/useBudget';
import { useQuoteLoader } from '@/modules/partner/hooks/useQuoteLoader';
import { useBudgetSaver } from '@/modules/partner/hooks/useBudgetSaver';
import BudgetServiceSelector from '../../../../modules/partner/components/budget/BudgetServiceSelector';
import BudgetSummary from '../../../../modules/partner/components/budget/BudgetSummary';
import BudgetLayout from '../../../../modules/partner/components/budget/BudgetLayout';
import BudgetHeader from '../../../../modules/partner/components/budget/BudgetHeader';
import TimeRevisionModal from '@/modules/partner/components/TimeRevisionModal/TimeRevisionModal';
import { usePartnerTimeRevisions } from '@/modules/partner/hooks/usePartnerTimeRevisions';

const OrcamentoPage = () => {
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');

  // Hooks para gerenciar estado e dados
  const { services, loading: servicesLoading, error: servicesError } = usePartnerServices();
  const {
    budget,
    addService,
    removeService,
    updateQuantity,
    updateEstimatedDays,
    updateBudgetInfo,
    clearBudget,
    loadBudgetFromData,
  } = useBudget();

  // Hook customizado para carregamento de quote
  const {
    isEditing,
    loadingQuote,
    error: quoteError,
  } = useQuoteLoader(quoteId, updateBudgetInfo, loadBudgetFromData);

  // Hook customizado para salvamento
  const { savingBudget, saveMessage, saveBudget, clearSaveMessage } = useBudgetSaver();

  // Revisão de prazos (modal)
  const [showTimeRevisionModal, setShowTimeRevisionModal] = useState(false);
  const [quoteStatus, setQuoteStatus] = useState<string | null>(null);
  const { fetchRevisionDetails, updateTimes } = usePartnerTimeRevisions();

  // Buscar status do orçamento para controlar visibilidade do botão de revisão
  React.useEffect(() => {
    const fetchQuoteStatus = async () => {
      if (!quoteId) {
        setQuoteStatus(null);
        return;
      }

      try {
        const { data: session } = await supabase.auth.getSession();
        const accessToken = session?.session?.access_token;

        if (!accessToken) return;

        const response = await fetch(`/api/partner/quotes/${quoteId}/status`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setQuoteStatus(data.status || null);
        }
      } catch {
        // Silently fail - button just won't show if we can't get status
        setQuoteStatus(null);
      }
    };

    fetchQuoteStatus();
  }, [quoteId]);

  // Handlers de eventos
  const handleServiceSelect = (service: PartnerService, selected: boolean) => {
    if (selected) {
      addService(service);
    } else {
      removeService(service.id);
    }
  };

  const handleQuantityChange = (serviceId: string, quantity: number) => {
    updateQuantity(serviceId, quantity);
  };

  const handleEstimatedDaysChange = (serviceId: string, estimatedDays: number | undefined) => {
    updateEstimatedDays(serviceId, estimatedDays);
  };

  const handleRemoveService = (serviceId: string) => {
    removeService(serviceId);
  };

  const handleBudgetInfoChange = (
    name: string,
    vehiclePlate: string,
    vehicleModel: string,
    vehicleBrand: string,
    vehicleYear?: number
  ) => {
    updateBudgetInfo(name, vehiclePlate, vehicleModel, vehicleBrand, vehicleYear);
  };

  const handleSaveBudget = async () => {
    clearSaveMessage();
    await saveBudget(budget, quoteId);
  };

  const handleClearBudget = () => {
    clearBudget();
    clearSaveMessage();
  };

  // Verificar se pode salvar
  const canSave = !!(budget.name.trim() && budget.vehiclePlate.trim() && budget.items.length > 0);

  // Loading state
  if (loadingQuote) {
    return (
      <BudgetLayout>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div>Carregando dados do orçamento...</div>
        </div>
      </BudgetLayout>
    );
  }

  return (
    <BudgetLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header com título, mensagens e info do orçamento */}
        <BudgetHeader
          isEditing={isEditing}
          quoteId={quoteId}
          saveMessage={saveMessage}
          error={quoteError}
        />

        {/* Botão para revisar prazos do orçamento (abre modal) */}
        {quoteId && quoteStatus === 'specialist_time_revision_requested' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '8px 0 16px' }}>
            <button
              onClick={() => setShowTimeRevisionModal(true)}
              title="Revisar prazos do orçamento"
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                background: '#fff',
                color: '#111827',
                cursor: 'pointer',
              }}
            >
              Revisar Prazos
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
          {/* Área de Seleção de Serviços */}
          <div>
            <BudgetServiceSelector
              services={services}
              selectedServices={budget.items}
              onServiceSelect={handleServiceSelect}
              loading={servicesLoading}
              error={servicesError}
            />
          </div>

          {/* Resumo do Orçamento */}
          <div>
            <BudgetSummary
              budget={budget}
              onBudgetInfoChange={handleBudgetInfoChange}
              onQuantityChange={handleQuantityChange}
              onEstimatedDaysChange={handleEstimatedDaysChange}
              onRemoveService={handleRemoveService}
              onSave={handleSaveBudget}
              onClear={handleClearBudget}
              canSave={canSave}
              isSaving={savingBudget}
              mode={isEditing ? 'edit' : 'create'}
            />
          </div>
        </div>
      </div>

      {/* Modal de Revisão de Prazos */}
      {quoteId && (
        <TimeRevisionModal
          isOpen={showTimeRevisionModal}
          onClose={() => setShowTimeRevisionModal(false)}
          quoteId={quoteId}
          onSuccess={() => {
            // Após atualizar prazos, apenas fechamos e mantemos na página
            setShowTimeRevisionModal(false);
          }}
          fetchRevisionDetails={fetchRevisionDetails}
          updateTimes={updateTimes}
        />
      )}
    </BudgetLayout>
  );
};

export default OrcamentoPage;
