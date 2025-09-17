'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartnerServices, PartnerService } from '@/modules/partner/hooks/usePartnerServices';
import { useBudget } from '@/modules/partner/hooks/useBudget';
import { supabase } from '@/modules/common/services/supabaseClient';
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
  const [savingBudget, setSavingBudget] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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
        updateBudgetInfo(`Orçamento #${quoteId}`, 'ABC-1234', 'Civic', 'Honda', 2020);

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
    updateBudgetInfo(
      name,
      budget.vehiclePlate,
      budget.vehicleModel,
      budget.vehicleBrand,
      budget.vehicleYear
    );
  };

  const handleSaveBudget = async () => {
    if (!budget.name.trim()) {
      setSaveMessage({ type: 'error', text: 'Por favor, informe o nome do orçamento.' });
      return;
    }

    if (!budget.vehiclePlate.trim()) {
      setSaveMessage({ type: 'error', text: 'Por favor, informe a placa do veículo.' });
      return;
    }

    if (budget.items.length === 0) {
      setSaveMessage({ type: 'error', text: 'Adicione pelo menos um serviço ao orçamento.' });
      return;
    }

    setSavingBudget(true);
    setSaveMessage(null);

    try {
      // Verificar se o usuário está autenticado
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setSaveMessage({ type: 'error', text: 'Usuário não autenticado. Faça login novamente.' });
        return;
      }

      // Preparar dados para salvar
      const budgetData = {
        partner_id: user.id,
        name: budget.name.trim(),
        vehicle_plate: budget.vehiclePlate.trim(),
        vehicle_model: budget.vehicleModel?.trim() || null,
        vehicle_brand: budget.vehicleBrand?.trim() || null,
        vehicle_year: budget.vehicleYear || null,
        total_value: budget.totalValue,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Salvar o orçamento
      const { data: savedBudget, error: budgetError } = await supabase
        .from('partner_budgets')
        .insert(budgetData)
        .select()
        .single();

      if (budgetError) {
        setSaveMessage({ type: 'error', text: 'Erro ao salvar orçamento. Tente novamente.' });
        return;
      }

      // Preparar e salvar os itens do orçamento
      const budgetItems = budget.items.map(item => ({
        budget_id: savedBudget.id,
        service_id: item.service.id,
        description: item.service.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        created_at: new Date().toISOString(),
      }));

      const { error: itemsError } = await supabase.from('partner_budget_items').insert(budgetItems);

      if (itemsError) {
        // Tentar remover o orçamento se os itens falharam
        await supabase.from('partner_budgets').delete().eq('id', savedBudget.id);
        setSaveMessage({ type: 'error', text: 'Erro ao salvar serviços do orçamento.' });
        return;
      }

      setSaveMessage({
        type: 'success',
        text: `Orçamento "${budget.name}" salvo com sucesso!`,
      });

      // Limpar o orçamento após salvar com sucesso
      setTimeout(() => {
        clearBudget();
        setSaveMessage(null);
      }, 3000);
    } catch {
      setSaveMessage({ type: 'error', text: 'Erro de conexão. Tente novamente.' });
    } finally {
      setSavingBudget(false);
    }
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

          {/* Mensagem de confirmação */}
          {saveMessage && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: saveMessage.type === 'success' ? '#d4edda' : '#f8d7da',
                border: `1px solid ${saveMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                color: saveMessage.type === 'success' ? '#155724' : '#721c24',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {saveMessage.text}
            </div>
          )}

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
              vehiclePlate={budget.vehiclePlate}
              vehicleModel={budget.vehicleModel}
              vehicleBrand={budget.vehicleBrand}
              vehicleYear={budget.vehicleYear}
              selectedServices={budget.items}
              totalValue={budget.totalValue}
              onBudgetNameChange={handleBudgetNameChange}
              onQuantityChange={handleQuantityChange}
              onRemoveService={handleRemoveService}
              onSave={handleSaveBudget}
              onClear={handleClearBudget}
              isLoading={savingBudget}
            />
          </div>
        </div>
      </div>
    </BudgetLayout>
  );
};

export default OrcamentoPage;
