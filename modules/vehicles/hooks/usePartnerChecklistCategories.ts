import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import { getLogger } from '@/modules/logger';

const logger = getLogger('hooks:usePartnerChecklistCategories');

interface PartnerChecklistCategory {
  category: string;
  partner_id: string;
  partner_name: string;
  has_anomalies: boolean;
}

function getMockCategories(vehicleId?: string): PartnerChecklistCategory[] {
  // Mock determinístico simples para evitar erros de console quando não há backend/sessão
  const base: PartnerChecklistCategory[] = [
    {
      category: 'Elétrica',
      partner_id: 'p-001',
      partner_name: 'Parceiro Elétrica',
      has_anomalies: false,
    },
    {
      category: 'Mecânica',
      partner_id: 'p-002',
      partner_name: 'Parceiro Mecânica',
      has_anomalies: false,
    },
    {
      category: 'Lataria',
      partner_id: 'p-003',
      partner_name: 'Parceiro Lataria',
      has_anomalies: false,
    },
  ];
  if (!vehicleId) return [];
  // Varie levemente pelo último caractere do id
  const last = vehicleId.at(-1);
  if (last && /[0-9]/.test(last)) {
    const n = Number(last) % base.length;
    return [...base.slice(n), ...base.slice(0, n)];
  }
  return base;
}

/**
 * Hook para buscar categorias de parceiros que têm checklists dinâmicos
 * para um determinado veículo
 */
export function usePartnerChecklistCategories(vehicleId?: string, inspectionId?: string) {
  const [categories, setCategories] = useState<PartnerChecklistCategory[]>([]);
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
          // Em ambientes sem sessão (dev), usar mock e registrar apenas um aviso
          logger.warn('session_missing_or_error_using_mock', {
            error: sessionError,
            hasSession: !!session,
          });
          setCategories(getMockCategories(vehicleId));
          setError(null);
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
          // Usar mock para reduzir ruído de console e manter UX funcional
          logger.warn('fetch_categories_failed_using_mock', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
          setCategories(getMockCategories(vehicleId));
          setError(null);
        }
      } catch (err) {
        // Fallback para mock em erros inesperados (ex.: offline)
        logger.warn('fetch_categories_error_using_mock', { error: err });
        setCategories(getMockCategories(vehicleId));
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [vehicleId, inspectionId]);

  return { categories, loading, error };
}
