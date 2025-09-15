'use client';

import React from 'react';
import { usePartnerServices, PartnerService } from '@/modules/partner/hooks/usePartnerServices';
import { useBudget } from '@/modules/partner/hooks/useBudget';
import BudgetServiceSelector from '@/modules/partner/components/budget/BudgetServiceSelector';
import BudgetSummary from '@/modules/partner/components/budget/BudgetSummary';
import BudgetLayout from '@/modules/partner/components/budget/BudgetLayout';

const OrcamentoPage = () => {
  const { services, loading: servicesLoading, error: servicesError } = usePartnerServices();
  const { budget, addService, removeService, updateQuantity, updateBudgetInfo, clearBudget } =
    useBudget();

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

  const handleBudgetNameChange = (name: string) => {
    updateBudgetInfo(name, budget.clientName);
  };

  const handleClientNameChange = (clientName: string) => {
    updateBudgetInfo(budget.name, clientName);
  };

  const handleSaveBudget = async () => {
    // TODO: Implementar salvamento do orçamento na API
    // Por enquanto, apenas placeholder. Em produção, implementar chamada para API
  };

  const handleClearBudget = () => {
    clearBudget();
  };

  return (
    <BudgetLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            Criar Orçamento
          </h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Selecione os serviços desejados para compor seu orçamento
          </p>
        </div>

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
              budgetName={budget.name}
              clientName={budget.clientName}
              selectedServices={budget.items}
              totalValue={budget.totalValue}
              onBudgetNameChange={handleBudgetNameChange}
              onClientNameChange={handleClientNameChange}
              onQuantityChange={handleQuantityChange}
              onRemoveService={handleRemoveService}
              onSave={handleSaveBudget}
              onClear={handleClearBudget}
            />
          </div>
        </div>
      </div>
    </BudgetLayout>
  );
};

export default OrcamentoPage;
