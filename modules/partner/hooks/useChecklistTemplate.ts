import { useState, useEffect } from 'react';
import { getLogger } from '@/modules/logger';

const logger = getLogger('hooks:useChecklistTemplate');

export interface ChecklistTemplateItem {
  id: string;
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
}

export interface ChecklistTemplateSection {
  section: string;
  items: ChecklistTemplateItem[];
}

export interface ChecklistTemplate {
  id: string;
  title: string;
  version: string;
  sections: ChecklistTemplateSection[];
}

export interface UseChecklistTemplateResult {
  template: ChecklistTemplate | null;
  loading: boolean;
  error: string | null;
  category: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para carregar template de checklist baseado na categoria do parceiro
 *
 * @param vehicleId - ID do veículo (usado no endpoint init)
 * @param quoteId - ID do orçamento (opcional)
 * @returns Template carregado, estado de loading e erro
 */
export function useChecklistTemplate(
  vehicleId: string | null,
  quoteId?: string | null
): UseChecklistTemplateResult {
  const [template, setTemplate] = useState<ChecklistTemplate | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplate = async () => {
    if (!vehicleId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Chamar endpoint init que agora retorna o template
      const response = await fetch('/api/partner/checklist/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId,
          quoteId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar template: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data?.template) {
        setTemplate(data.data.template);
        setCategory(data.data.category);

        logger.info('template_loaded', {
          category: data.data.category,
          template_id: data.data.template.id,
          sections_count: data.data.template.sections.length,
        });
      } else {
        logger.warn('no_template_returned', {
          success: data.success,
          category: data.data?.category,
        });
        setTemplate(null);
        setCategory(data.data?.category || null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      logger.error('template_fetch_error', { error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, [vehicleId, quoteId]);

  return {
    template,
    loading,
    error,
    category,
    refetch: fetchTemplate,
  };
}

/**
 * Hook para carregar template direto pela categoria (sem passar pelo init)
 *
 * @param category - Categoria normalizada (mecanica, funilaria_pintura, etc.)
 * @returns Template carregado, estado de loading e erro
 */
export function useChecklistTemplateByCategory(
  category: string | null
): Omit<UseChecklistTemplateResult, 'category' | 'refetch'> {
  const [template, setTemplate] = useState<ChecklistTemplate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) {
      setLoading(false);
      return;
    }

    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/partner/checklist/templates/${category}`);

        if (!response.ok) {
          throw new Error(`Erro ao carregar template: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          setTemplate({
            id: data.data.template.id,
            title: data.data.template.title,
            version: data.data.template.version,
            sections: data.data.sections,
          });

          logger.info('template_loaded_by_category', {
            category,
            template_id: data.data.template.id,
            sections_count: data.data.sections.length,
          });
        } else {
          setTemplate(null);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        logger.error('template_fetch_by_category_error', { error: errorMessage, category });
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [category]);

  return { template, loading, error };
}
