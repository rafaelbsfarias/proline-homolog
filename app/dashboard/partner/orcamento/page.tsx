'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartnerServices, PartnerService } from '@/modules/partner/hooks/usePartnerServices';
import { useBudget } from '@/modules/partner/hooks/useBudget';
import BudgetServiceSelector from '../../../../modules/partner/components/budget/BudgetServiceSelector';
import BudgetSummary from '../../../../modules/partner/components/budget/BudgetSummary';
import BudgetLayout from '../../../../modules/partner/components/budget/BudgetLayout';

const OrcamentoPage = () => {
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  // Usar hook real para buscar dados do banco
  const { services, loading: servicesLoading, error: servicesError } = usePartnerServices();
  const { budget, addService, removeService, updateQuantity, updateBudgetInfo, clearBudget } =
    useBudget();

  // Estado para controlar se estamos editando ou criando
  const [isEditing, setIsEditing] = React.useState(false);
  const [loadingQuote, setLoadingQuote] = React.useState(false);

  // Carregar dados da cotação se houver quoteId
  useEffect(() => {
    if (quoteId) {
      setIsEditing(true);
      setLoadingQuote(true);

      // Implementar carregamento dos dados da cotação da API
      // Por enquanto, simulamos alguns dados para demonstração

      // Simulação de carregamento de dados
      setTimeout(() => {
        // Exemplo de como seria carregar dados de uma cotação existente
        updateBudgetInfo(`Orçamento #${quoteId}`, 'Cliente Exemplo');

        // Adicionar alguns serviços como exemplo
        if (services.length > 0) {
          addService(services[0]); // Adiciona o primeiro serviço
          if (services.length > 1) {
            addService(services[1]); // Adiciona o segundo serviço
          }
        }

        setLoadingQuote(false);
      }, 1000);
    } else {
      setIsEditing(false);
    }
  }, [quoteId, services, addService, updateBudgetInfo]);

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
    // Implementar salvamento do orçamento na API
    // Por enquanto, apenas placeholder. Em produção, implementar chamada para API
  };

  const handleClearBudget = () => {
    clearBudget();
  };

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
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            {isEditing ? 'Editar Orçamento' : 'Criar Orçamento'}
          </h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            {isEditing
              ? 'Edite os serviços selecionados para este orçamento'
              : 'Selecione os serviços desejados para compor seu orçamento'}
          </p>
          {isEditing && quoteId && (
            <div
              style={{
                background: '#e3f2fd',
                border: '1px solid #2196f3',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '16px',
              }}
            >
              <strong>Editando Orçamento ID:</strong> {quoteId}
            </div>
          )}
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
