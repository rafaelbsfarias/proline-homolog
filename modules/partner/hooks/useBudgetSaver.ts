import { useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import { getLogger } from '@/modules/logger';

interface BudgetItem {
  service: {
    id: string;
    name: string;
    description?: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  estimatedDays?: number;
}

interface Budget {
  name: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleBrand: string;
  vehicleYear?: number;
  items: BudgetItem[];
  totalValue: number;
}

interface SaveMessage {
  type: 'success' | 'error';
  text: string;
}

interface UseBudgetSaverReturn {
  savingBudget: boolean;
  saveMessage: SaveMessage | null;
  saveBudget: (budget: Budget, quoteId: string | null) => Promise<void>;
  clearSaveMessage: () => void;
}

export const useBudgetSaver = (): UseBudgetSaverReturn => {
  const [savingBudget, setSavingBudget] = useState(false);
  const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null);

  const logger = getLogger('partner:budget-saver');

  const validateBudget = (budget: Budget): string | null => {
    if (!budget.name.trim()) {
      return 'Por favor, informe o nome do orçamento.';
    }

    if (!budget.vehiclePlate.trim()) {
      return 'Por favor, informe a placa do veículo.';
    }

    if (budget.items.length === 0) {
      return 'Adicione pelo menos um serviço ao orçamento.';
    }

    return null;
  };

  const saveBudget = async (budget: Budget, quoteId: string | null) => {
    logger.info('🚀 Iniciando salvamento do orçamento', {
      budgetName: budget.name,
      vehiclePlate: budget.vehiclePlate,
      itemsCount: budget.items.length,
      totalValue: budget.totalValue,
      quoteId,
    });

    // Validação
    const validationError = validateBudget(budget);
    if (validationError) {
      logger.warn('Validação falhou', { error: validationError });
      setSaveMessage({ type: 'error', text: validationError });
      return;
    }

    setSavingBudget(true);
    setSaveMessage(null);

    try {
      // Verificar autenticação e obter token de acesso
      logger.info('Verificando autenticação do usuário');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      // Verificar se estamos editando (precisa de quoteId)
      if (!quoteId) {
        throw new Error('Modo de edição inválido. Recarregue a página.');
      }

      logger.info('✅ Enviando orçamento para API', {
        quoteId,
        vehiclePlate: budget.vehiclePlate,
        totalValue: budget.totalValue,
        itemCount: budget.items.length,
      });

      // Montar payload para a API
      const payload = {
        name: budget.name,
        vehiclePlate: budget.vehiclePlate,
        vehicleModel: budget.vehicleModel,
        vehicleBrand: budget.vehicleBrand,
        vehicleYear: budget.vehicleYear,
        totalValue: budget.totalValue,
        items: budget.items.map(item => ({
          description: item.service.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          estimatedDays: item.estimatedDays,
        })),
      };

      const response = await fetch(`/api/partner/budgets/${quoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Falha ao salvar orçamento via API', {
          status: response.status,
          errorText,
          url: `/api/partner/budgets/${quoteId}`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session.access_token.substring(0, 20)}...`,
          },
        });
        throw new Error(
          `Erro ao salvar orçamento (HTTP ${response.status}). ${errorText || 'Tente novamente.'}`
        );
      }

      logger.info('Orçamento salvo com sucesso via API');
      setSaveMessage({ type: 'success', text: `Orçamento "${budget.name}" salvo com sucesso!` });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro durante salvamento', { error: errorMessage });
      setSaveMessage({ type: 'error', text: errorMessage });
    } finally {
      setSavingBudget(false);
      logger.info('Processo de salvamento finalizado');
    }
  };

  const clearSaveMessage = () => {
    setSaveMessage(null);
  };

  return {
    savingBudget,
    saveMessage,
    saveBudget,
    clearSaveMessage,
  };
};
