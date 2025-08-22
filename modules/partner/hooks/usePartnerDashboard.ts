import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import { PARTNER_CONTRACT_CONTENT } from '@/modules/common/constants/contractContent';

// Estrutura de dados para os retornos do hook
export interface PartnerDashboardData {
  loading: boolean;
  userName: string;
  contractAccepted: boolean;
  contractContent: string;
  contractSignedAt: string | null;
  pendingQuotesCount: number;
  inProgressServicesCount: number;
  pendingQuotes: any[]; // Substituir por tipo real quando definido
  inProgressServices: any[]; // Substituir por tipo real quando definido
}

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

  const fetchDashboardData = useCallback(async () => {
    setDashboardData(prev => ({ ...prev, loading: true }));

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Busca perfil do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Busca dados do contrato
      const { data: acceptance } = await supabase
        .from('contract_partners')
        .select('created_at, content')
        .eq('partner_id', user.id)
        .maybeSingle();

      // TODO: Implementar a busca real dos dados de serviços e solicitações
      // Por enquanto, os dados de contagem e listas permanecerão zerados/vazios.

      setDashboardData({
        loading: false,
        userName: profile?.full_name || '',
        contractAccepted: !!acceptance,
        contractContent: acceptance?.content || PARTNER_CONTRACT_CONTENT,
        contractSignedAt: acceptance?.created_at || null,
        pendingQuotesCount: 0, // Mock removido
        inProgressServicesCount: 0, // Mock removido
        pendingQuotes: [], // Mock removido
        inProgressServices: [], // Mock removido
      });
    } else {
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Expõe a função de recarregamento para que o componente possa chamá-la
  return { ...dashboardData, reloadData: fetchDashboardData };
}
