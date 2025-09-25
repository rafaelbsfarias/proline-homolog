import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import { getLogger } from '@/modules/logger';

interface QuoteItem {
  id: string;
  serviceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface QuoteData {
  id: string;
  name: string;
  vehiclePlate: string;
  vehicleModel: string | null;
  vehicleBrand: string | null;
  vehicleYear?: number;
  items: QuoteItem[];
  totalValue: number;
  createdAt: string;
  updatedAt: string;
}

interface UseQuoteLoaderReturn {
  isEditing: boolean;
  loadingQuote: boolean;
  quoteData: QuoteData | null;
  error: string | null;
}

export const useQuoteLoader = (
  quoteId: string | null,
  updateBudgetInfo: (
    name: string,
    vehiclePlate: string,
    vehicleModel: string,
    vehicleBrand: string,
    vehicleYear?: number
  ) => void,
  loadBudgetFromData?: (budgetData: QuoteData) => void
): UseQuoteLoaderReturn => {
  const [isEditing, setIsEditing] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Memoize logger to avoid effect re-runs due to identity changes
  const logger = useMemo(() => getLogger('partner:quote-loader'), []);

  useEffect(() => {
    const loadQuoteData = async () => {
      logger.info('🚀 === INÍCIO DO CARREGAMENTO DE DADOS ===', {
        timestamp: new Date().toISOString(),
        quoteId,
        hasQuoteId: !!quoteId,
      });

      if (!quoteId) {
        logger.info('📝 Modo criação de orçamento - nenhum quoteId fornecido');
        setIsEditing(false);
        setQuoteData(null);
        setError(null);
        return;
      }

      logger.info('🔍 Iniciando carregamento de dados da cotação', {
        quoteId,
        quoteIdType: typeof quoteId,
        quoteIdLength: quoteId.length,
      });

      setIsEditing(true);
      setLoadingQuote(true);
      setError(null);

      try {
        // Verificar autenticação
        logger.info('🔐 Verificando autenticação do usuário...');
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error('Usuário não autenticado. Faça login novamente.');
        }

        logger.info('✅ Usuário autenticado', { userId: user.id, email: user.email });

        // Buscar dados via API
        const apiUrl = `/api/partner/budgets/${quoteId}`;
        logger.info('📡 Fazendo requisição para API', { url: apiUrl });

        const { data: session } = await supabase.auth.getSession();
        const accessToken = session?.session?.access_token;

        if (!accessToken) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
        }

        const quoteData = await response.json();

        logger.info('✅ Dados da cotação carregados com sucesso', {
          hasId: !!quoteData.id,
          hasVehiclePlate: !!quoteData.vehiclePlate,
          itemsCount: quoteData.items?.length || 0,
        });

        setQuoteData(quoteData);

        // Atualizar informações do orçamento
        updateBudgetInfo(
          quoteData.name || `Orçamento #${quoteId}`,
          quoteData.vehiclePlate || '',
          quoteData.vehicleModel || '',
          quoteData.vehicleBrand || '',
          quoteData.vehicleYear
        );

        // Se há uma função loadBudgetFromData fornecida, carregar o orçamento completo
        if (loadBudgetFromData) {
          logger.info('🔧 Carregando orçamento completo no estado do budget');
          loadBudgetFromData(quoteData);
          logger.info('✅ Orçamento carregado no estado do budget');
        }

        logger.info('Informações do orçamento atualizadas');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        logger.error('Erro ao carregar dados da cotação', { error: errorMessage, quoteId });
        setError(errorMessage);
      } finally {
        setLoadingQuote(false);
        logger.info('Carregamento finalizado');
      }
    };

    loadQuoteData();
    // Note: updateBudgetInfo is stable (useCallback) and logger is memoized
  }, [quoteId, updateBudgetInfo]);

  return {
    isEditing,
    loadingQuote,
    quoteData,
    error,
  };
};
