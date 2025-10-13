import { useState, useEffect } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import { getLogger } from '@/modules/logger';

const logger = getLogger('hooks:usePartnerChecklistCategories');

interface PartnerChecklistCategory {
  category: string;
  partner_id: string;
  partner_name: string;
  has_anomalies: boolean;
}

/**
 * Hook para buscar categorias de parceiros que têm checklists dinâmicos
 * para um determinado veículo
 */
export function usePartnerChecklistCategories(vehicleId?: string, inspectionId?: string) {
  const [categories, setCategories] = useState<PartnerChecklistCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId) {
      setCategories([]);
      return;
    }

    const fetchCategories = async () => {
      setLoading(true);
      setError(null);

      try {
        // Obter token da sessão Supabase
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.access_token) {
          logger.error('session_error', {
            error: sessionError,
            hasSession: !!session,
          });
          setError('Sessão de autenticação não encontrada');
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
          logger.error('fetch_categories_failed', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
          setError(errorData.error || `Erro ${response.status} ao buscar categorias`);
        }
      } catch (err) {
        logger.error('fetch_categories_error', { error: err });
        setError('Erro ao buscar categorias de checklist');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [vehicleId, inspectionId]);

  return { categories, loading, error };
}
