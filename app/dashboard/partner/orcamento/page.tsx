'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartnerServices, PartnerService } from '@/modules/partner/hooks/usePartnerServices';
import { useBudget } from '@/modules/partner/hooks/useBudget';
import { useQuoteLoader } from '@/modules/partner/hooks/useQuoteLoader';
import { useBudgetSaver } from '@/modules/partner/hooks/useBudgetSaver';
import BudgetServiceSelector from '../../../../modules/partner/components/budget/BudgetServiceSelector';
import BudgetSummary from '../../../../modules/partner/components/budget/BudgetSummary';
import BudgetLayout from '../../../../modules/partner/components/budget/BudgetLayout';
import BudgetHeader from '../../../../modules/partner/components/budget/BudgetHeader';
import BudgetActions from '../../../../modules/partner/components/budget/BudgetActions';

const OrcamentoPage = () => {
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');

  // Hooks para gerenciar estado e dados
  const { services, loading: servicesLoading, error: servicesError } = usePartnerServices();
  const { budget, addService, removeService, updateQuantity, updateBudgetInfo, clearBudget } =
    useBudget();

  // Hook customizado para carregamento de quote
  const { isEditing, loadingQuote, error: quoteError } = useQuoteLoader(quoteId, updateBudgetInfo);

  // Hook customizado para salvamento
  const { savingBudget, saveMessage, saveBudget, clearSaveMessage } = useBudgetSaver();

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
              onRemoveService={handleRemoveService}
            />

            {/* Botões de Ação */}
            <BudgetActions
              onSave={handleSaveBudget}
              onClear={handleClearBudget}
              canSave={canSave}
              isSaving={savingBudget}
              mode={isEditing ? 'edit' : 'create'}
            />
          </div>
        </div>
      </div>
    </BudgetLayout>
  );
};

export default OrcamentoPage;
