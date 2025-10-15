import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import { getLogger } from '@/modules/logger';

const logger = getLogger('hooks:usePartnerChecklistCategories');

interface PartnerChecklistEntry {
  id: string;
  category: string;
  partner_id: string;
  partner_name: string;
  type: 'mechanics_checklist' | 'vehicle_anomalies';
  has_anomalies: boolean;
  created_at: string;
  status: string;
}

/**
 * Hook para buscar categorias de parceiros que têm checklists dinâmicos
 * para um determinado veículo
 */
export function usePartnerChecklistCategories(vehicleId?: string, inspectionId?: string) {
  const [categories, setCategories] = useState<PartnerChecklistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!vehicleId) {
      setCategories([]);
      return;
    }

    const fetchCategories = async () => {
      // Evitar execução duplicada em StrictMode no dev para o mesmo conjunto de chaves
      const key = `${vehicleId || ''}|${inspectionId || ''}`;
      if (lastKeyRef.current === key) {
        return;
      }
      lastKeyRef.current = key;

      setLoading(true);
      setError(null);

      try {
        // Obter token da sessão Supabase
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.access_token) {
          // Em ambientes sem sessão, definir erro
          logger.warn('session_missing_or_error', {
            error: sessionError,
            hasSession: !!session,
          });
          setCategories([]);
          setError('Sessão não encontrada');
          setLoading(false);
          return;
        }

        const token = session.access_token;

        const params = new URLSearchParams({
          vehicle_id: vehicleId,
        });

        if (inspectionId) {
          params.append('inspection_id', inspectionId);
        }

        const url = `/api/checklist/categories?${params.toString()}`;
        logger.info('fetching_categories', { url, vehicleId, inspectionId });

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          logger.info('categories_fetched_successfully', {
            categories_count: data.categories?.length || 0,
            categories: data.categories,
          });
          setCategories(data.categories || []);
        } else {
          let errorData: { error?: string } = {};
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
          }
          // Usar lista vazia para reduzir ruído de console e manter UX funcional
          logger.warn('fetch_categories_failed', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
          setCategories([]);
          setError('Erro ao carregar categorias');
        }
      } catch (err) {
        // Fallback para lista vazia em erros inesperados (ex.: offline)
        logger.warn('fetch_categories_error', { error: err });
        setCategories([]);
        setError('Erro ao carregar categorias');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [vehicleId, inspectionId]);

  return { categories, loading, error };
}
