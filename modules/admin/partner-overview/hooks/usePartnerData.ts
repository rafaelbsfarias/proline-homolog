/**
 * Hook for loading partner overview data
 *
 * Responsibilities:
 * - Load partner overview (metrics + quotes)
 * - Load partner services
 * - Normalize quote structure
 * - Handle loading and error states
 *
 * Following project patterns:
 * - Uses supabase auth (NOT creating new helpers)
 * - Returns normalized data structure
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../common/services/supabaseClient';
import type { Partner, QuotesByStatus, Service } from '../types';

interface UsePartnerDataReturn {
  loading: boolean;
  error: string | null;
  partner: Partner | null;
  quotes: QuotesByStatus | null;
  services: Service[];
  refetch: () => Promise<void>;
}

export function usePartnerData(partnerId: string): UsePartnerDataReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [quotes, setQuotes] = useState<QuotesByStatus | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  const loadData = useCallback(async () => {
    if (!partnerId) {
      setError('Parâmetro partnerId ausente');
      setPartner(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get auth session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Load partner overview
      const overviewResp = await fetch(`/api/admin/partners/${partnerId}/overview`, {
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });

      const overviewData = await overviewResp.json();

      if (!overviewResp.ok) {
        setError(overviewData?.error || 'Erro ao carregar parceiro');
        setPartner(null);
        setQuotes(null);
        return;
      }

      setPartner(overviewData.partner as Partner);

      // Normalize quotes structure
      const q = overviewData.partner?.quotes || ({} as Partial<QuotesByStatus>);
      const normalized: QuotesByStatus = {
        pending_admin_approval: Array.isArray(q.pending_admin_approval)
          ? q.pending_admin_approval
          : [],
        pending_client_approval: Array.isArray(q.pending_client_approval)
          ? q.pending_client_approval
          : [],
        approved: Array.isArray(q.approved) ? q.approved : [],
        rejected: Array.isArray(q.rejected) ? q.rejected : [],
        executing: Array.isArray(q.executing) ? q.executing : [],
      };
      setQuotes(normalized);

      // Load services
      const servicesResp = await fetch(`/api/admin/partners/${partnerId}/services`, {
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });

      const servicesData = await servicesResp.json();
      setServices(
        servicesResp.ok && Array.isArray(servicesData.services) ? servicesData.services : []
      );
    } catch {
      setError('Erro de rede ao carregar parceiro');
      setPartner(null);
      setQuotes(null);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    loading,
    error,
    partner,
    quotes,
    services,
    refetch: loadData,
  };
}
