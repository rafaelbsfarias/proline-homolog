/**
 * BudgetService - Serviço de domínio para gestão de orçamentos
 *
 * Responsabilidades:
 * - CRUD de orçamentos (quotes)
 * - Gestão de itens de orçamento (quote_items)
 * - Mapeamento entre modelos de domínio e banco de dados
 *
 * Segue princípios:
 * - Single Responsibility: apenas lógica de negócio de orçamentos
 * - Dependency Inversion: recebe SupabaseClient via construtor
 * - Separação de concerns: autenticação é responsabilidade da camada de API
 *
 * @see docs/partner/REFACTOR_PLAN_DRY_SOLID.md - Fase 2
 */
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

const logger = getLogger('partner:BudgetService');

export interface BudgetData {
  id?: string;
  name: string;
  vehiclePlate: string;
  vehicleModel?: string;
  vehicleBrand?: string;
  vehicleYear?: number;
  totalValue: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  items: BudgetItemData[];
}

export interface BudgetItemData {
  serviceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Interfaces para tipagem das respostas do Supabase
interface SupabaseQuoteItem {
  service_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface SupabaseQuote {
  id: string;
  name: string;
  vehicle_plate: string;
  vehicle_model: string | null;
  vehicle_brand: string | null;
  vehicle_year: number | null;
  total_value: number;
  status: string;
  quote_items: SupabaseQuoteItem[];
}

/**
 * Serviço de orçamentos seguindo padrão Singleton + Dependency Injection
 */
export class BudgetService {
  private static instance: BudgetService;
  private readonly supabase: SupabaseClient;

  private constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Obtém instância singleton do serviço
   * Usa SupabaseService para obter client configurado
   */
  static getInstance(): BudgetService {
    if (!BudgetService.instance) {
      const supabaseService = SupabaseService.getInstance();
      BudgetService.instance = new BudgetService(supabaseService.getAdminClient());
    }
    return BudgetService.instance;
  }

  /**
   * Criar orçamento baseado em um quote existente
   *
   * @param partnerId - ID do parceiro autenticado (vem da camada de API)
   * @param quoteId - ID do quote original
   * @param budgetData - Dados do orçamento a ser criado
   * @returns ID do orçamento criado
   */
  async createBudgetFromQuote(
    partnerId: string,
    quoteId: string,
    budgetData: Omit<BudgetData, 'id'>
  ): Promise<string> {
    try {
      // Buscar dados do veículo do quote original
      const { data: quoteWithVehicle, error: quoteError } = await this.supabase
        .from('quotes')
        .select(
          `
          id,
          service_orders (
            id,
            vehicles (
              plate,
              model,
              brand,
              year,
              color
            )
          )
        `
        )
        .eq('id', quoteId)
        .eq('partner_id', partnerId)
        .single();

      if (quoteError) {
        logger.error('Erro ao buscar dados do quote e veículo', { error: quoteError, quoteId });
        throw new Error('Quote não encontrado ou sem permissão de acesso');
      }

      const vehicle = quoteWithVehicle?.service_orders?.vehicles;
      const vehicleData = {
        vehiclePlate: vehicle?.plate || budgetData.vehiclePlate || '',
        vehicleModel: vehicle?.model || budgetData.vehicleModel || '',
        vehicleBrand: vehicle?.brand || budgetData.vehicleBrand || '',
        vehicleYear: vehicle?.year || budgetData.vehicleYear || null,
      };

      // Criar o orçamento com dados do veículo
      const { data: budget, error: budgetError } = await this.supabase
        .from('quotes')
        .insert({
          partner_id: partnerId,
          name: budgetData.name,
          vehicle_plate: vehicleData.vehiclePlate,
          vehicle_model: vehicleData.vehicleModel || null,
          vehicle_brand: vehicleData.vehicleBrand || null,
          vehicle_year: vehicleData.vehicleYear,
          total_value: budgetData.totalValue,
          status: budgetData.status,
          service_order_id: quoteId, // Vincula ao quote original
        })
        .select()
        .single();

      if (budgetError) throw budgetError;

      // Criar os itens
      if (budgetData.items.length > 0) {
        const { error: itemsError } = await this.supabase.from('quote_items').insert(
          budgetData.items.map(item => ({
            quote_id: budget.id,
            service_id: item.serviceId,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.totalPrice,
          }))
        );

        if (itemsError) throw itemsError;
      }

      logger.info('Orçamento criado a partir de quote', {
        budgetId: budget.id,
        quoteId,
        partnerId,
      });
      return budget.id;
    } catch (error) {
      logger.error('Erro ao criar orçamento a partir de quote', { error, quoteId, partnerId });
      throw error;
    }
  }

  /**
   * Verificar se já existe orçamento para um quote
   *
   * @param partnerId - ID do parceiro autenticado
   * @param quoteId - ID do quote a verificar
   * @returns ID do orçamento existente ou null
   */
  async getBudgetByQuoteId(partnerId: string, quoteId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('quotes')
        .select('id')
        .eq('service_order_id', quoteId)
        .eq('partner_id', partnerId)
        .maybeSingle();

      if (error) throw error;

      return data?.id || null;
    } catch (error) {
      logger.error('Erro ao buscar orçamento por quote ID', { error, quoteId, partnerId });
      return null;
    }
  }

  /**
   * Criar novo orçamento
   *
   * @param partnerId - ID do parceiro autenticado
   * @param budgetData - Dados do orçamento
   * @returns ID do orçamento criado
   */
  async createBudget(partnerId: string, budgetData: Omit<BudgetData, 'id'>): Promise<string> {
    try {
      // Criar o orçamento
      const { data: budget, error: budgetError } = await this.supabase
        .from('quotes')
        .insert({
          partner_id: partnerId,
          name: budgetData.name,
          vehicle_plate: budgetData.vehiclePlate,
          vehicle_model: budgetData.vehicleModel || null,
          vehicle_brand: budgetData.vehicleBrand || null,
          vehicle_year: budgetData.vehicleYear || null,
          total_value: budgetData.totalValue,
          status: budgetData.status,
        })
        .select()
        .single();

      if (budgetError) throw budgetError;

      // Criar os itens
      if (budgetData.items.length > 0) {
        const { error: itemsError } = await this.supabase.from('quote_items').insert(
          budgetData.items.map(item => ({
            quote_id: budget.id,
            service_id: item.serviceId,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.totalPrice,
          }))
        );

        if (itemsError) throw itemsError;
      }

      logger.info('Orçamento criado', { budgetId: budget.id, partnerId });
      return budget.id;
    } catch (error) {
      logger.error('Erro ao criar orçamento', { error, partnerId });
      throw error;
    }
  }

  /**
   * Atualizar orçamento existente
   *
   * @param partnerId - ID do parceiro autenticado
   * @param budgetId - ID do orçamento a atualizar
   * @param budgetData - Novos dados do orçamento
   */
  async updateBudget(
    partnerId: string,
    budgetId: string,
    budgetData: Omit<BudgetData, 'id'>
  ): Promise<void> {
    try {
      // Atualizar o orçamento
      const { error: budgetError } = await this.supabase
        .from('quotes')
        .update({
          name: budgetData.name,
          vehicle_plate: budgetData.vehiclePlate,
          vehicle_model: budgetData.vehicleModel || null,
          vehicle_brand: budgetData.vehicleBrand || null,
          vehicle_year: budgetData.vehicleYear || null,
          total_value: budgetData.totalValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', budgetId)
        .eq('partner_id', partnerId);

      if (budgetError) throw budgetError;

      // Remover itens existentes
      const { error: deleteError } = await this.supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', budgetId);

      if (deleteError) throw deleteError;

      // Inserir novos itens
      if (budgetData.items.length > 0) {
        const { error: itemsError } = await this.supabase.from('quote_items').insert(
          budgetData.items.map(item => ({
            quote_id: budgetId,
            service_id: item.serviceId,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.totalPrice,
          }))
        );

        if (itemsError) throw itemsError;
      }

      logger.info('Orçamento atualizado', { budgetId, partnerId });
    } catch (error) {
      logger.error('Erro ao atualizar orçamento', { error, budgetId, partnerId });
      throw error;
    }
  }

  /**
   * Listar orçamentos do parceiro
   *
   * @param partnerId - ID do parceiro autenticado
   * @returns Lista de orçamentos do parceiro
   */
  async listPartnerBudgets(partnerId: string): Promise<BudgetData[]> {
    try {
      const { data: budgets, error } = await this.supabase
        .from('quotes')
        .select(
          `
          id,
          name,
          vehicle_plate,
          vehicle_model,
          vehicle_brand,
          vehicle_year,
          total_value,
          status,
          quote_items (
            service_id,
            description,
            quantity,
            unit_price,
            total_price
          )
        `
        )
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!budgets) return [];

      return budgets.map((budget: SupabaseQuote) => ({
        id: budget.id,
        name: budget.name,
        vehiclePlate: budget.vehicle_plate,
        vehicleModel: budget.vehicle_model || undefined,
        vehicleBrand: budget.vehicle_brand || undefined,
        vehicleYear: budget.vehicle_year || undefined,
        totalValue: budget.total_value,
        status: budget.status as BudgetData['status'],
        items: budget.quote_items.map((item: SupabaseQuoteItem) => ({
          serviceId: item.service_id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
        })),
      }));
    } catch (error) {
      logger.error('Erro ao listar orçamentos do parceiro', { error, partnerId });
      throw error;
    }
  }

  /**
   * Buscar orçamento por ID
   *
   * @param partnerId - ID do parceiro autenticado
   * @param budgetId - ID do orçamento
   * @returns Dados do orçamento ou null se não encontrado
   */
  async getBudgetById(partnerId: string, budgetId: string): Promise<BudgetData | null> {
    try {
      const { data: budget, error } = await this.supabase
        .from('quotes')
        .select(
          `
          id,
          name,
          vehicle_plate,
          vehicle_model,
          vehicle_brand,
          vehicle_year,
          total_value,
          status,
          quote_items (
            service_id,
            description,
            quantity,
            unit_price,
            total_price
          )
        `
        )
        .eq('id', budgetId)
        .eq('partner_id', partnerId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return {
        id: budget.id,
        name: budget.name,
        vehiclePlate: budget.vehicle_plate,
        vehicleModel: budget.vehicle_model || undefined,
        vehicleBrand: budget.vehicle_brand || undefined,
        vehicleYear: budget.vehicle_year || undefined,
        totalValue: budget.total_value,
        status: budget.status as BudgetData['status'],
        items: budget.quote_items.map((item: SupabaseQuoteItem) => ({
          serviceId: item.service_id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
        })),
      };
    } catch (error) {
      logger.error('Erro ao buscar orçamento por ID', { error, budgetId, partnerId });
      throw error;
    }
  }
}
