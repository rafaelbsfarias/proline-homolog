# Exemplos de Implementação: Partner Overview Refactoring

## 📝 Exemplos Práticos de Código

### 1. Domain Layer - Tipos

#### `modules/admin/partner-overview/domain/types/Partner.types.ts`
```typescript
export interface Partner {
  id: string;
  company_name: string;
  services_count: number;
  pending_budgets: number;
  executing_budgets: number;
  approval_budgets: number;
  is_active: boolean;
}

export interface PartnerMetrics {
  services_count: number;
  pending_budgets: number;
  executing_budgets: number;
  approval_budgets: number;
}

export interface PartnerOverviewResponse {
  partner: Partner & {
    quotes: QuotesByStatus;
  };
}
```

#### `modules/admin/partner-overview/domain/types/Quote.types.ts`
```typescript
export type QuoteStatus = 
  | 'pending_admin_approval'
  | 'pending_client_approval'
  | 'approved'
  | 'rejected'
  | 'executing'
  | 'admin_review';

export interface Quote {
  id: string;
  status: QuoteStatus;
  total_value: number;
  created_at: string;
  service_order_id: string | null;
  vehicle_id: string | null;
  partner_id: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface QuoteWithItems {
  quote: Quote;
  items: QuoteItem[];
}

export interface QuotesByStatus {
  pending_admin_approval: Quote[];
  pending_client_approval: Quote[];
  approved: Quote[];
  rejected: Quote[];
  executing: Quote[];
}

export type QuoteFilterStatus = QuoteStatus | 'all';

export interface QuoteFilters {
  query: string;
  status: QuoteFilterStatus;
}

export type ReviewAction = 'approve_full' | 'reject_full' | 'approve_partial';

export interface ReviewData {
  rejectedItemIds?: string[];
  rejectionReason?: string;
}
```

#### `modules/admin/partner-overview/domain/types/Service.types.ts`
```typescript
export interface Service {
  id: string;
  partner_id: string;
  name: string;
  description: string | null;
  price: number | null;
  is_active: boolean;
  created_at: string;
}

export type ServiceFilterStatus = 'all' | 'active' | 'inactive';

export interface ServiceFilters {
  query: string;
  status: ServiceFilterStatus;
}
```

---

### 2. Infrastructure Layer - API

#### `modules/admin/partner-overview/infrastructure/api/apiHelpers.ts`
```typescript
import { supabase } from '@/modules/common/services/supabaseClient';
import type { Session } from '@supabase/supabase-js';

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function createHeaders(session: Session | null): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data?.error || `API Error: ${response.status}`);
  }
  
  return data;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

#### `modules/admin/partner-overview/infrastructure/api/partnerApi.ts`
```typescript
import { getSession, createHeaders, handleApiResponse, ApiError } from './apiHelpers';
import type { PartnerOverviewResponse } from '../../domain/types/Partner.types';
import type { Service } from '../../domain/types/Service.types';

export class PartnerApi {
  private static readonly BASE_URL = '/api/admin/partners';

  static async fetchOverview(partnerId: string): Promise<PartnerOverviewResponse> {
    try {
      const session = await getSession();
      const response = await fetch(`${this.BASE_URL}/${partnerId}/overview`, {
        headers: createHeaders(session),
      });
      
      return handleApiResponse<PartnerOverviewResponse>(response);
    } catch (error) {
      throw new ApiError(
        'Erro ao carregar dados do parceiro',
        500,
        error
      );
    }
  }

  static async fetchServices(partnerId: string): Promise<Service[]> {
    try {
      const session = await getSession();
      const response = await fetch(`${this.BASE_URL}/${partnerId}/services`, {
        headers: createHeaders(session),
      });
      
      const data = await handleApiResponse<{ services: Service[] }>(response);
      return data.services || [];
    } catch (error) {
      throw new ApiError(
        'Erro ao carregar serviços do parceiro',
        500,
        error
      );
    }
  }

  static async updateServiceStatus(
    partnerId: string,
    serviceId: string,
    isActive: boolean
  ): Promise<void> {
    try {
      const session = await getSession();
      const response = await fetch(
        `${this.BASE_URL}/${partnerId}/services/${serviceId}`,
        {
          method: 'PATCH',
          headers: createHeaders(session),
          body: JSON.stringify({ is_active: isActive }),
        }
      );
      
      await handleApiResponse(response);
    } catch (error) {
      throw new ApiError(
        'Erro ao atualizar status do serviço',
        500,
        error
      );
    }
  }
}
```

#### `modules/admin/partner-overview/infrastructure/api/quoteApi.ts`
```typescript
import { getSession, createHeaders, handleApiResponse, ApiError } from './apiHelpers';
import type { QuoteWithItems, ReviewAction, ReviewData } from '../../domain/types/Quote.types';

export class QuoteApi {
  private static readonly BASE_URL = '/api/admin/quotes';

  static async fetchDetails(quoteId: string): Promise<QuoteWithItems> {
    try {
      const session = await getSession();
      const response = await fetch(`${this.BASE_URL}/${quoteId}`, {
        headers: createHeaders(session),
      });
      
      return handleApiResponse<QuoteWithItems>(response);
    } catch (error) {
      throw new ApiError(
        'Erro ao carregar detalhes do orçamento',
        500,
        error
      );
    }
  }

  static async submitReview(
    quoteId: string,
    action: ReviewAction,
    data: ReviewData
  ): Promise<void> {
    try {
      const session = await getSession();
      const payload = {
        action,
        rejectedItemIds: data.rejectedItemIds || [],
        rejectionReason: data.rejectionReason,
      };

      const response = await fetch(`${this.BASE_URL}/${quoteId}/review`, {
        method: 'POST',
        headers: createHeaders(session),
        body: JSON.stringify(payload),
      });
      
      await handleApiResponse(response);
    } catch (error) {
      throw new ApiError(
        'Erro ao enviar revisão do orçamento',
        500,
        error
      );
    }
  }
}
```

---

### 3. Application Layer - Hooks

#### `modules/admin/partner-overview/application/hooks/usePartnerOverview.ts`
```typescript
import { useEffect, useState, useCallback } from 'react';
import { PartnerApi } from '../../infrastructure/api/partnerApi';
import type { Partner, PartnerMetrics } from '../../domain/types/Partner.types';
import type { QuotesByStatus } from '../../domain/types/Quote.types';
import type { Service } from '../../domain/types/Service.types';

interface UsePartnerOverviewReturn {
  loading: boolean;
  error: string | null;
  partner: Partner | null;
  quotes: QuotesByStatus | null;
  services: Service[];
  refetch: () => Promise<void>;
}

export function usePartnerOverview(partnerId: string): UsePartnerOverviewReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [quotes, setQuotes] = useState<QuotesByStatus | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  const loadData = useCallback(async () => {
    if (!partnerId) {
      setError('Parâmetro partnerId ausente');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [overviewData, servicesData] = await Promise.all([
        PartnerApi.fetchOverview(partnerId),
        PartnerApi.fetchServices(partnerId),
      ]);

      setPartner(overviewData.partner);
      setQuotes(normalizeQuotes(overviewData.partner.quotes));
      setServices(servicesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
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

function normalizeQuotes(quotes: QuotesByStatus | undefined): QuotesByStatus {
  return {
    pending_admin_approval: quotes?.pending_admin_approval || [],
    pending_client_approval: quotes?.pending_client_approval || [],
    approved: quotes?.approved || [],
    rejected: quotes?.rejected || [],
    executing: quotes?.executing || [],
  };
}
```

#### `modules/admin/partner-overview/application/hooks/useQuoteFilters.ts`
```typescript
import { useState, useMemo } from 'react';
import type { Quote, QuotesByStatus, QuoteFilterStatus } from '../../domain/types/Quote.types';

interface UseQuoteFiltersReturn {
  query: string;
  setQuery: (query: string) => void;
  status: QuoteFilterStatus;
  setStatus: (status: QuoteFilterStatus) => void;
  filteredQuotes: Quote[];
}

export function useQuoteFilters(quotes: QuotesByStatus | null): UseQuoteFiltersReturn {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<QuoteFilterStatus>('pending_admin_approval');

  const filteredQuotes = useMemo(() => {
    if (!quotes) return [];

    const searchTerm = query.trim().toLowerCase();
    const allQuotes: Quote[] = [];

    // Flatten quotes by status
    const statusKeys: Array<keyof QuotesByStatus> = [
      'pending_admin_approval',
      'pending_client_approval',
      'approved',
      'rejected',
      'executing',
    ];

    statusKeys.forEach(key => {
      if (status === 'all' || status === key) {
        allQuotes.push(...quotes[key]);
      }
    });

    // Apply search filter
    if (!searchTerm) return allQuotes;

    return allQuotes.filter(quote => 
      quote.id.toLowerCase().includes(searchTerm) ||
      quote.service_order_id?.toLowerCase().includes(searchTerm)
    );
  }, [quotes, query, status]);

  return {
    query,
    setQuery,
    status,
    setStatus,
    filteredQuotes,
  };
}
```

#### `modules/admin/partner-overview/application/hooks/useQuoteActions.ts`
```typescript
import { useState, useCallback } from 'react';
import { QuoteApi } from '../../infrastructure/api/quoteApi';
import type { QuoteWithItems, ReviewAction, ReviewData } from '../../domain/types/Quote.types';

interface UseQuoteActionsReturn {
  detailsOpen: boolean;
  quoteDetails: QuoteWithItems | null;
  reviewModalOpen: boolean;
  selectedQuote: QuoteWithItems | null;
  openDetails: (quoteId: string) => Promise<void>;
  closeDetails: () => void;
  openReview: (quoteId: string) => Promise<void>;
  closeReview: () => void;
  submitReview: (action: ReviewAction, data: ReviewData) => Promise<void>;
}

export function useQuoteActions(): UseQuoteActionsReturn {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [quoteDetails, setQuoteDetails] = useState<QuoteWithItems | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteWithItems | null>(null);

  const openDetails = useCallback(async (quoteId: string) => {
    try {
      const data = await QuoteApi.fetchDetails(quoteId);
      setQuoteDetails(data);
      setDetailsOpen(true);
    } catch (error) {
      console.error('Error opening quote details:', error);
    }
  }, []);

  const closeDetails = useCallback(() => {
    setDetailsOpen(false);
    setQuoteDetails(null);
  }, []);

  const openReview = useCallback(async (quoteId: string) => {
    try {
      const data = await QuoteApi.fetchDetails(quoteId);
      setSelectedQuote(data);
      setReviewModalOpen(true);
    } catch (error) {
      console.error('Error opening review modal:', error);
    }
  }, []);

  const closeReview = useCallback(() => {
    setReviewModalOpen(false);
    setSelectedQuote(null);
  }, []);

  const submitReview = useCallback(
    async (action: ReviewAction, data: ReviewData) => {
      if (!selectedQuote) return;

      try {
        await QuoteApi.submitReview(selectedQuote.quote.id, action, data);
        closeReview();
        // Trigger refetch through a callback or event
      } catch (error) {
        console.error('Error submitting review:', error);
        throw error;
      }
    },
    [selectedQuote, closeReview]
  );

  return {
    detailsOpen,
    quoteDetails,
    reviewModalOpen,
    selectedQuote,
    openDetails,
    closeDetails,
    openReview,
    closeReview,
    submitReview,
  };
}
```

---

### 4. Presentation Layer - Componentes

#### `modules/admin/partner-overview/presentation/components/PartnerHeader/PartnerHeader.tsx`
```typescript
import React from 'react';
import type { Partner } from '../../../domain/types/Partner.types';
import * as S from './PartnerHeader.styles';

interface PartnerHeaderProps {
  partner: Partner;
}

export const PartnerHeader: React.FC<PartnerHeaderProps> = ({ partner }) => {
  return (
    <S.Container>
      <S.Title>{partner.company_name}</S.Title>
      <S.PartnerId>Parceiro ID: {partner.id}</S.PartnerId>
      <S.StatusBadge $active={partner.is_active}>
        {partner.is_active ? 'Ativo' : 'Inativo'}
      </S.StatusBadge>
    </S.Container>
  );
};
```

#### `modules/admin/partner-overview/presentation/components/PartnerHeader/PartnerHeader.styles.ts`
```typescript
import styled from 'styled-components';

export const Container = styled.div`
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

export const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  color: #072e4c;
`;

export const PartnerId = styled.div`
  margin-top: 8px;
  color: #555;
`;

export const StatusBadge = styled.div<{ $active: boolean }>`
  margin-top: 4px;
  color: ${props => (props.$active ? '#16a34a' : '#9ca3af')};
  font-weight: 500;
`;
```

#### `modules/admin/partner-overview/presentation/components/PartnerMetrics/PartnerMetrics.tsx`
```typescript
import React from 'react';
import type { PartnerMetrics } from '../../../domain/types/Partner.types';
import { MetricCard } from './MetricCard';
import * as S from './PartnerMetrics.styles';

interface PartnerMetricsProps {
  metrics: PartnerMetrics;
}

export const PartnerMetrics: React.FC<PartnerMetricsProps> = ({ metrics }) => {
  return (
    <S.Grid>
      <MetricCard
        label="Serviços Cadastrados"
        value={metrics.services_count}
        color="default"
      />
      <MetricCard
        label="Orçamentos Pendentes"
        value={metrics.pending_budgets}
        color="warning"
      />
      <MetricCard
        label="Em Execução"
        value={metrics.executing_budgets}
        color="success"
      />
      <MetricCard
        label="Para Aprovação"
        value={metrics.approval_budgets}
        color="danger"
      />
    </S.Grid>
  );
};
```

#### `modules/admin/partner-overview/presentation/PartnerOverviewContainer.tsx`
```typescript
'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import { Loading } from '@/modules/common/components/Loading/Loading';
import { usePartnerOverview } from '../application/hooks/usePartnerOverview';
import { useQuoteFilters } from '../application/hooks/useQuoteFilters';
import { useQuoteActions } from '../application/hooks/useQuoteActions';
import { PartnerHeader } from './components/PartnerHeader/PartnerHeader';
import { PartnerMetrics } from './components/PartnerMetrics/PartnerMetrics';
import { QuotesSection } from './components/QuotesSection/QuotesSection';
import { ServicesSection } from './components/ServicesSection/ServicesSection';
import { QuoteDetailsModal } from './components/QuoteDetailsModal/QuoteDetailsModal';
import * as S from './PartnerOverviewContainer.styles';

export default function PartnerOverviewContainer() {
  const params = useSearchParams();
  const partnerId = params.get('partnerId') || '';

  const { loading, error, partner, quotes, services } = usePartnerOverview(partnerId);
  const quoteFilters = useQuoteFilters(quotes);
  const quoteActions = useQuoteActions();

  if (loading) {
    return (
      <S.PageContainer>
        <Header />
        <S.LoadingContainer>
          <Loading />
        </S.LoadingContainer>
      </S.PageContainer>
    );
  }

  if (error) {
    return (
      <S.PageContainer>
        <Header />
        <S.ErrorContainer>{error}</S.ErrorContainer>
      </S.PageContainer>
    );
  }

  if (!partner) return null;

  return (
    <S.PageContainer>
      <Header />
      <S.Container>
        <S.BackLink href="/dashboard">&larr; Voltar</S.BackLink>
        
        <PartnerHeader partner={partner} />
        <PartnerMetrics metrics={partner} />
        
        <QuotesSection
          quotes={quoteFilters.filteredQuotes}
          filters={quoteFilters}
          onOpenDetails={quoteActions.openDetails}
          onOpenReview={quoteActions.openReview}
        />
        
        <ServicesSection services={services} />
      </S.Container>

      <QuoteDetailsModal
        isOpen={quoteActions.detailsOpen}
        quoteDetails={quoteActions.quoteDetails}
        onClose={quoteActions.closeDetails}
        onOpenReview={quoteActions.openReview}
      />
    </S.PageContainer>
  );
}
```

---

## 🎯 Comparação: Antes vs Depois

### Antes (899 linhas, 1 arquivo)
```typescript
// ❌ Tudo misturado em um único arquivo
export default function PartnerOverviewPage() {
  // 13 estados diferentes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ... 11 more states

  // Lógica de API misturada
  useEffect(() => {
    const fetchData = async () => {
      // 50+ linhas de lógica de fetch
    };
  }, [partnerId]);

  // Filtros inline
  const filteredQuotes = useMemo(() => {
    // 30+ linhas de lógica de filtro
  }, [quotes, quoteQuery, quoteStatus]);

  // Componentes inline
  return (
    <div>
      {/* 600+ linhas de JSX */}
    </div>
  );
}
```

### Depois (150 linhas container + componentes modulares)
```typescript
// ✅ Container limpo e focado
export default function PartnerOverviewContainer() {
  const partnerId = usePartnerId();
  const { loading, error, partner, quotes, services } = usePartnerOverview(partnerId);
  const quoteFilters = useQuoteFilters(quotes);
  const quoteActions = useQuoteActions();

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;
  if (!partner) return null;

  return (
    <PageLayout>
      <PartnerHeader partner={partner} />
      <PartnerMetrics metrics={partner} />
      <QuotesSection quotes={quoteFilters.filteredQuotes} {...quoteFilters} />
      <ServicesSection services={services} />
      <QuoteDetailsModal {...quoteActions} />
    </PageLayout>
  );
}
```

---

## ✅ Checklist de Validação

Cada componente/hook deve passar por:

- [ ] **SRP**: Tem apenas uma responsabilidade?
- [ ] **Type Safety**: Zero tipos `any`?
- [ ] **Tamanho**: Menos de 150 linhas?
- [ ] **Testável**: Fácil de testar isoladamente?
- [ ] **Reusável**: Pode ser usado em outros contextos?
- [ ] **Documentado**: JSDoc para props/retornos?
- [ ] **Performático**: Memoização adequada?
- [ ] **Acessível**: ARIA labels quando necessário?
