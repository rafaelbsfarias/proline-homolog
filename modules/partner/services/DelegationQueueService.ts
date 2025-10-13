import type { SupabaseClient } from '@supabase/supabase-js';

interface Logger {
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

interface DelegationQueueItem {
  id: string;
  inspection_id: string;
  service_category_id: string;
  partner_id: string;
  is_parallel: boolean;
  priority: number;
}

interface QuoteActivationResult {
  success: boolean;
  quote_id?: string;
  partner_id?: string;
  category_id?: string;
  error?: string;
}

/**
 * Serviço para gerenciar fila de delegações de serviços
 *
 * Responsabilidades:
 * - Identificar próximo parceiro na fila baseado em inspection_delegations
 * - Ativar quote do próximo parceiro (queued → pending_partner)
 * - Respeitar prioridades e delegações paralelas
 */
export class DelegationQueueService {
  constructor(
    private supabase: SupabaseClient,
    private logger?: Logger
  ) {}

  /**
   * Processa a fila quando um parceiro finaliza a execução
   *
   * @param vehicleId - ID do veículo que teve execução finalizada
   * @param completedCategoryId - ID da categoria que foi concluída
   * @returns Resultado da ativação do próximo quote
   */
  async processQueueOnCompletion(
    vehicleId: string,
    completedCategoryId: string
  ): Promise<QuoteActivationResult> {
    try {
      this.logger?.info?.('process_queue_start', { vehicleId, completedCategoryId });

      // 1. Buscar inspection_id do veículo
      const inspectionId = await this.getInspectionIdByVehicle(vehicleId);
      if (!inspectionId) {
        this.logger?.warn?.('no_inspection_found', { vehicleId });
        return { success: false, error: 'Inspeção não encontrada para este veículo' };
      }

      this.logger?.info?.('inspection_found', { inspectionId, vehicleId });

      // 2. Buscar todas as delegações desta inspeção
      const delegations = await this.getInspectionDelegations(inspectionId);
      if (delegations.length === 0) {
        this.logger?.info?.('no_delegations_found', { inspectionId });
        return { success: true }; // Não há fila, tudo ok
      }

      this.logger?.info?.('delegations_found', { count: delegations.length, inspectionId });

      // 3. Verificar se há múltiplas categorias
      const uniqueCategories = new Set(delegations.map(d => d.service_category_id));
      if (uniqueCategories.size <= 1) {
        this.logger?.info?.('single_category_only', {
          inspectionId,
          categoryCount: uniqueCategories.size,
        });
        return { success: true }; // Apenas uma categoria, não há fila sequencial
      }

      this.logger?.info?.('multiple_categories_detected', {
        inspectionId,
        categoryCount: uniqueCategories.size,
      });

      // 4. Filtrar delegações sequenciais (não paralelas)
      const sequentialDelegations = delegations
        .filter(d => !d.is_parallel)
        .sort((a, b) => a.priority - b.priority); // Menor priority = maior prioridade

      if (sequentialDelegations.length === 0) {
        this.logger?.info?.('all_delegations_parallel', { inspectionId });
        return { success: true }; // Todas são paralelas, não há fila
      }

      this.logger?.info?.('sequential_delegations_found', {
        count: sequentialDelegations.length,
        priorities: sequentialDelegations.map(d => d.priority),
      });

      // 5. Encontrar próxima delegação na fila (excluindo a que acabou de ser concluída)
      const nextDelegation = sequentialDelegations.find(
        d => d.service_category_id !== completedCategoryId
      );

      if (!nextDelegation) {
        this.logger?.info?.('no_next_delegation', {
          inspectionId,
          completedCategoryId,
        });
        return { success: true }; // Não há próxima categoria na fila
      }

      this.logger?.info?.('next_delegation_identified', {
        delegationId: nextDelegation.id,
        partnerId: nextDelegation.partner_id,
        categoryId: nextDelegation.service_category_id,
        priority: nextDelegation.priority,
      });

      // 6. Buscar quote do próximo parceiro que está em 'queued'
      const quoteId = await this.findQueuedQuote(
        vehicleId,
        nextDelegation.partner_id,
        nextDelegation.service_category_id
      );

      if (!quoteId) {
        this.logger?.warn?.('queued_quote_not_found', {
          vehicleId,
          partnerId: nextDelegation.partner_id,
          categoryId: nextDelegation.service_category_id,
        });
        return {
          success: false,
          error: 'Quote em fila não encontrado para o próximo parceiro',
        };
      }

      // 7. Ativar quote (queued → pending_partner)
      const activated = await this.activateQuote(quoteId);
      if (!activated) {
        this.logger?.error?.('failed_activate_quote', { quoteId });
        return { success: false, error: 'Erro ao ativar próximo quote' };
      }

      this.logger?.info?.('queue_processed_successfully', {
        vehicleId,
        completedCategoryId,
        activatedQuoteId: quoteId,
        nextPartnerId: nextDelegation.partner_id,
        nextCategoryId: nextDelegation.service_category_id,
      });

      return {
        success: true,
        quote_id: quoteId,
        partner_id: nextDelegation.partner_id,
        category_id: nextDelegation.service_category_id,
      };
    } catch (error) {
      this.logger?.error?.('process_queue_error', {
        error: error instanceof Error ? error.message : String(error),
        vehicleId,
        completedCategoryId,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Busca inspection_id associado ao veículo
   */
  private async getInspectionIdByVehicle(vehicleId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('inspections')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      this.logger?.error?.('get_inspection_error', { error, vehicleId });
      return null;
    }

    return data?.id || null;
  }

  /**
   * Busca todas as delegações de uma inspeção
   */
  private async getInspectionDelegations(inspectionId: string): Promise<DelegationQueueItem[]> {
    const { data, error } = await this.supabase
      .from('inspection_delegations')
      .select('id, inspection_id, service_category_id, partner_id, is_parallel, priority')
      .eq('inspection_id', inspectionId)
      .order('priority', { ascending: true });

    if (error) {
      this.logger?.error?.('get_delegations_error', { error, inspectionId });
      return [];
    }

    return (data as DelegationQueueItem[]) || [];
  }

  /**
   * Busca quote em estado 'queued' para um parceiro específico
   */
  private async findQueuedQuote(
    vehicleId: string,
    partnerId: string,
    categoryId: string
  ): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('quotes')
      .select(
        `
        id,
        service_orders!inner(
          vehicle_id,
          category_id
        )
      `
      )
      .eq('partner_id', partnerId)
      .eq('status', 'queued')
      .eq('service_orders.vehicle_id', vehicleId)
      .eq('service_orders.category_id', categoryId)
      .limit(1)
      .maybeSingle();

    if (error) {
      this.logger?.error?.('find_queued_quote_error', {
        error,
        vehicleId,
        partnerId,
        categoryId,
      });
      return null;
    }

    return data?.id || null;
  }

  /**
   * Ativa um quote mudando status de 'queued' para 'pending_partner'
   */
  private async activateQuote(quoteId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('quotes')
      .update({
        status: 'pending_partner',
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)
      .eq('status', 'queued'); // Garantir que só ativa se ainda estiver queued

    if (error) {
      this.logger?.error?.('activate_quote_error', { error, quoteId });
      return false;
    }

    return true;
  }

  /**
   * Verifica se há quotes pendentes na fila para uma inspeção
   */
  async hasQueuedQuotes(inspectionId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('quotes')
      .select('id, service_orders!inner(source_inspection_id)')
      .eq('status', 'queued')
      .eq('service_orders.source_inspection_id', inspectionId)
      .limit(1)
      .maybeSingle();

    if (error) {
      this.logger?.error?.('check_queued_quotes_error', { error, inspectionId });
      return false;
    }

    return !!data;
  }
}
