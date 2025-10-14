import { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from '@/modules/common/constants/database';
import { getLogger } from '@/modules/logger';
import { ChecklistRecord, LoadChecklistOptions } from '../types';
import { applyIdFilters } from '../utils/checklistQueries';

const logger = getLogger('repositories:checklist');

export class ChecklistRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Busca checklist por vehicle_id e inspection_id/quote_id
   */
  async findOne(options: LoadChecklistOptions): Promise<ChecklistRecord | null> {
    try {
      let query = this.supabase.from(TABLES.MECHANICS_CHECKLIST).select('*');
      query = applyIdFilters(query, options) as typeof query;

      const { data, error } = await query.maybeSingle();

      if (error) {
        logger.error('find_one_error', { error: error.message });
        throw error;
      }

      return data as ChecklistRecord | null;
    } catch (error) {
      logger.error('find_one_unexpected_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Busca checklist garantindo escopo do parceiro
   */
  async findOneForPartner(
    options: LoadChecklistOptions,
    partner_id: string
  ): Promise<ChecklistRecord | null> {
    try {
      let query = this.supabase.from(TABLES.MECHANICS_CHECKLIST).select('*');
      query = applyIdFilters(query, options) as typeof query;
      // Escopo por parceiro
      // mechanics_checklist possui coluna partner_id
      // Garantir que apenas registros do parceiro autenticado sejam retornados
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const withScope = (query as any).eq('partner_id', partner_id);

      const { data, error } = await withScope.maybeSingle();

      if (error) {
        logger.error('find_one_for_partner_error', { error: error.message });
        throw error;
      }

      return data as ChecklistRecord | null;
    } catch (error) {
      logger.error('find_one_for_partner_unexpected_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Cria um novo checklist
   */
  async create(data: Partial<ChecklistRecord>): Promise<ChecklistRecord> {
    try {
      const { data: inserted, error } = await this.supabase
        .from(TABLES.MECHANICS_CHECKLIST)
        .insert(data)
        .select()
        .single();

      if (error) {
        logger.error('create_error', { error: error.message });
        throw error;
      }

      return inserted as ChecklistRecord;
    } catch (error) {
      logger.error('create_unexpected_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Atualiza checklist existente
   */
  async update(id: string, data: Partial<ChecklistRecord>): Promise<ChecklistRecord> {
    try {
      const { data: updated, error } = await this.supabase
        .from(TABLES.MECHANICS_CHECKLIST)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('update_error', { error: error.message });
        throw error;
      }

      return updated as ChecklistRecord;
    } catch (error) {
      logger.error('update_unexpected_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Verifica se existe checklist
   */
  async exists(vehicle_id: string, inspection_id: string): Promise<boolean> {
    try {
      const { data } = await this.supabase
        .from(TABLES.MECHANICS_CHECKLIST)
        .select('id')
        .eq('vehicle_id', vehicle_id)
        .eq('inspection_id', inspection_id)
        .maybeSingle();

      return !!data;
    } catch (error) {
      logger.error('exists_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
