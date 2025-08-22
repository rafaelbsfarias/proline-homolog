import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import { PARTNER_CONTRACT_CONTENT } from '@/modules/common/constants/contractContent';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

// --- Tipos de Dados ---
export interface PendingQuote {
  id: string;
  client_name: string;
  service_description: string;
  date: string;
}

export interface InProgressService {
  id: string;
  client_name: string;
  service_description: string;
  status: string;
}

export interface PartnerDashboardData {
  loading: boolean;
  userName: string;
  contractAccepted: boolean;
  contractContent: string;
  contractSignedAt: string | null;
  pendingQuotesCount: number;
  inProgressServicesCount: number;
  pendingQuotes: PendingQuote[];
  inProgressServices: InProgressService[];
}

// --- Hook ---
export function usePartnerDashboard() {
  const [dashboardData, setDashboardData] = useState<PartnerDashboardData>({
    loading: true,
    userName: '',
    contractAccepted: false,
    contractContent: '',
    contractSignedAt: null,
    pendingQuotesCount: 0,
    inProgressServicesCount: 0,
    pendingQuotes: [],
    inProgressServices: [],
  });

  const { authenticatedFetch } = useAuthenticatedFetch();

  const fetchDashboardData = useCallback(async () => {
    setDashboardData(prev => ({ ...prev, loading: true }));

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setDashboardData(prev => ({ ...prev, loading: false }));
        return;
      }

      // Busca de dados básicos (perfil, contrato) em paralelo com dados do dashboard
      const profilePromise = supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      const acceptancePromise = supabase
        .from('contract_partners')
        .select('created_at, content')
        .eq('partner_id', user.id)
        .maybeSingle();
      const dashboardDataPromise = authenticatedFetch('/api/partner/dashboard');

      const [profileResult, acceptanceResult, dashboardResult] = await Promise.all([
        profilePromise,
        acceptancePromise,
        dashboardDataPromise,
      ]);

      const { data: profile } = profileResult;
      const { data: acceptance } = acceptanceResult;
      const apiData = dashboardResult.data as any; // Cast temporário

      setDashboardData({
        loading: false,
        userName: profile?.full_name || '',
        contractAccepted: !!acceptance,
        contractContent: acceptance?.content || PARTNER_CONTRACT_CONTENT,
        contractSignedAt: acceptance?.created_at || null,
        pendingQuotesCount: apiData?.pending_quotes?.count || 0,
        pendingQuotes: apiData?.pending_quotes?.items || [],
        inProgressServicesCount: apiData?.in_progress_services?.count || 0,
        inProgressServices: apiData?.in_progress_services?.items || [],
      });
    } catch (error) {
      console.error('Falha ao buscar dados do dashboard:', error);
      setDashboardData(prev => ({ ...prev, loading: false })); // Garante que o loading termine em caso de erro
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { ...dashboardData, reloadData: fetchDashboardData };
}
