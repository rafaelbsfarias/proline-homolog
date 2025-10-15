import { SupabaseClient } from '@supabase/supabase-js';
import { getLogger } from '@/modules/logger';

const logger = getLogger('services:checklist-template');

export interface ChecklistTemplate {
  id: string;
  category: string;
  version: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplateItem {
  id: string;
  template_id: string;
  item_key: string;
  label: string;
  description: string | null;
  help_text: string | null;
  section: string;
  subsection: string | null;
  position: number;
  is_required: boolean;
  allows_photos: boolean;
  max_photos: number | null;
  created_at: string;
}

export interface ChecklistTemplateWithItems extends ChecklistTemplate {
  items: ChecklistTemplateItem[];
}

export interface TemplateSection {
  section: string;
  items: ChecklistTemplateItem[];
}

/**
 * ChecklistTemplateService
 *
 * Responsável por gerenciar templates de checklists por categoria.
 * Templates definem a estrutura padrão de itens para cada tipo de parceiro.
 */
export class ChecklistTemplateService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Busca o template ativo para uma categoria
   */
  async getActiveTemplateForCategory(category: string): Promise<ChecklistTemplateWithItems | null> {
    try {
      logger.info('get_active_template_start', { category });

      // Buscar template ativo
      const { data: template, error: templateError } = await this.supabase
        .from('checklist_templates')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .single();

      if (templateError || !template) {
        logger.warn('template_not_found', { category, error: templateError?.message });
        return null;
      }

      // Buscar itens do template
      const { data: items, error: itemsError } = await this.supabase
        .from('checklist_template_items')
        .select('*')
        .eq('template_id', template.id)
        .order('section')
        .order('position');

      if (itemsError) {
        logger.error('template_items_fetch_error', {
          template_id: template.id,
          error: itemsError.message,
        });
        return null;
      }

      logger.info('get_active_template_success', {
        category,
        template_id: template.id,
        items_count: items?.length || 0,
      });

      return {
        ...template,
        items: items || [],
      };
    } catch (error) {
      logger.error('get_active_template_error', {
        category,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Busca template por ID
   */
  async getTemplateById(templateId: string): Promise<ChecklistTemplateWithItems | null> {
    try {
      const { data: template, error: templateError } = await this.supabase
        .from('checklist_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError || !template) {
        return null;
      }

      const { data: items } = await this.supabase
        .from('checklist_template_items')
        .select('*')
        .eq('template_id', templateId)
        .order('section')
        .order('position');

      return {
        ...template,
        items: items || [],
      };
    } catch (error) {
      logger.error('get_template_by_id_error', {
        templateId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Lista todos os templates disponíveis
   */
  async listTemplates(activeOnly = false): Promise<ChecklistTemplate[]> {
    try {
      let query = this.supabase.from('checklist_templates').select('*').order('category');

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('list_templates_error', { error: error.message });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('list_templates_error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Agrupa itens por seção
   */
  groupItemsBySection(items: ChecklistTemplateItem[]): TemplateSection[] {
    const sections = new Map<string, ChecklistTemplateItem[]>();

    for (const item of items) {
      if (!sections.has(item.section)) {
        sections.set(item.section, []);
      }
      sections.get(item.section)!.push(item);
    }

    return Array.from(sections.entries()).map(([section, items]) => ({
      section,
      items: items.sort((a, b) => a.position - b.position),
    }));
  }

  /**
   * Valida se um item_key existe no template
   */
  async validateItemKey(templateId: string, itemKey: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('checklist_template_items')
        .select('id')
        .eq('template_id', templateId)
        .eq('item_key', itemKey)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  /**
   * Busca configurações de um item específico
   */
  async getItemConfig(templateId: string, itemKey: string): Promise<ChecklistTemplateItem | null> {
    try {
      const { data, error } = await this.supabase
        .from('checklist_template_items')
        .select('*')
        .eq('template_id', templateId)
        .eq('item_key', itemKey)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      logger.error('get_item_config_error', {
        templateId,
        itemKey,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}
