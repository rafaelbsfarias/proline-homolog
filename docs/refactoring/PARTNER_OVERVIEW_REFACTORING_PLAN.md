# Plano de Refatoração: Partner Overview Page

## 📊 Análise do Problema

**Arquivo atual:** `app/dashboard/admin/partner-overview/page.tsx`
- **Linhas:** 899 (❌ CRÍTICO - limite recomendado: 250 linhas)
- **Responsabilidades:** 8+ (❌ Viola Single Responsibility)
- **Estados locais:** 13 (❌ Complexidade excessiva)
- **Tipos any:** Múltiplos (❌ Falta type safety)
- **Acoplamento:** Alto (❌ Lógica de API, UI e estado no mesmo arquivo)

## 🎯 Objetivos da Refatoração

1. ✅ Aplicar **DDD (Domain-Driven Design)**
2. ✅ Seguir **SOLID** principles
3. ✅ Aplicar **KISS (Keep It Simple, Stupid)**
4. ✅ Seguir **Object Calisthenics**
5. ✅ Melhorar **type safety** (eliminar `any`)
6. ✅ Aumentar **testabilidade**
7. ✅ Reduzir **complexidade ciclomática**

## 📁 Nova Estrutura de Arquivos (DDD)

```
modules/
└── admin/
    └── partner-overview/
        ├── domain/
        │   ├── types/
        │   │   ├── Partner.types.ts          # Tipos de domínio
        │   │   ├── Quote.types.ts
        │   │   └── Service.types.ts
        │   └── models/
        │       └── PartnerOverview.model.ts  # Modelos de domínio
        │
        ├── application/
        │   ├── hooks/
        │   │   ├── usePartnerOverview.ts     # Hook principal
        │   │   ├── useQuoteFilters.ts        # Filtros de quotes
        │   │   ├── useServiceFilters.ts      # Filtros de serviços
        │   │   └── useQuoteActions.ts        # Ações de quotes
        │   └── services/
        │       ├── PartnerService.ts         # Serviço de parceiros
        │       ├── QuoteService.ts           # Serviço de quotes
        │       └── ServiceToggleService.ts   # Serviço de ativação
        │
        ├── infrastructure/
        │   └── api/
        │       ├── partnerApi.ts             # API calls parceiro
        │       ├── quoteApi.ts               # API calls quotes
        │       └── serviceApi.ts             # API calls serviços
        │
        └── presentation/
            ├── components/
            │   ├── PartnerHeader/
            │   │   ├── PartnerHeader.tsx
            │   │   └── PartnerHeader.styles.ts
            │   ├── PartnerMetrics/
            │   │   ├── PartnerMetrics.tsx
            │   │   └── MetricCard.tsx
            │   ├── QuotesTable/
            │   │   ├── QuotesTable.tsx
            │   │   ├── QuoteRow.tsx
            │   │   └── QuotesFilters.tsx
            │   ├── ServicesTable/
            │   │   ├── ServicesTable.tsx
            │   │   ├── ServiceRow.tsx
            │   │   └── ServicesFilters.tsx
            │   ├── QuoteDetailsModal/
            │   │   ├── QuoteDetailsModal.tsx
            │   │   └── QuoteItemsTable.tsx
            │   └── ChecklistModal/
            │       └── ChecklistModalContainer.tsx
            │
            └── PartnerOverviewContainer.tsx  # Container principal
```

## 🔧 Decomposição dos Componentes

### 1. **Domain Layer** (Tipos e Modelos)

#### `Partner.types.ts`
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
```

#### `Quote.types.ts`
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
```

#### `Service.types.ts`
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

export type ServiceStatus = 'all' | 'active' | 'inactive';
```

### 2. **Application Layer** (Hooks e Serviços)

#### `usePartnerOverview.ts` (Hook Principal)
```typescript
export const usePartnerOverview = (partnerId: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [quotes, setQuotes] = useState<QuotesByStatus | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    loadPartnerData(partnerId);
  }, [partnerId]);

  return { loading, error, partner, quotes, services, refetch };
};
```

#### `useQuoteFilters.ts`
```typescript
export const useQuoteFilters = (quotes: QuotesByStatus | null) => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<QuoteStatus | 'all'>('pending_admin_approval');
  
  const filteredQuotes = useMemo(() => {
    return filterQuotes(quotes, query, status);
  }, [quotes, query, status]);

  return { query, setQuery, status, setStatus, filteredQuotes };
};
```

#### `useQuoteActions.ts`
```typescript
export const useQuoteActions = () => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [quoteDetails, setQuoteDetails] = useState<QuoteWithItems | null>(null);
  
  const openDetails = async (quoteId: string) => {
    const data = await fetchQuoteDetails(quoteId);
    setQuoteDetails(data);
    setDetailsOpen(true);
  };

  return { detailsOpen, quoteDetails, openDetails, closeDetails };
};
```

### 3. **Infrastructure Layer** (API)

#### `partnerApi.ts`
```typescript
export class PartnerApi {
  static async fetchOverview(partnerId: string): Promise<PartnerOverviewResponse> {
    const session = await getSession();
    const response = await fetch(`/api/admin/partners/${partnerId}/overview`, {
      headers: createHeaders(session),
    });
    return handleApiResponse(response);
  }

  static async fetchServices(partnerId: string): Promise<Service[]> {
    const session = await getSession();
    const response = await fetch(`/api/admin/partners/${partnerId}/services`, {
      headers: createHeaders(session),
    });
    const data = await handleApiResponse(response);
    return data.services;
  }
}
```

#### `quoteApi.ts`
```typescript
export class QuoteApi {
  static async fetchDetails(quoteId: string): Promise<QuoteWithItems> {
    const session = await getSession();
    const response = await fetch(`/api/admin/quotes/${quoteId}`, {
      headers: createHeaders(session),
    });
    return handleApiResponse(response);
  }

  static async submitReview(
    quoteId: string,
    action: ReviewAction,
    data: ReviewData
  ): Promise<void> {
    const session = await getSession();
    const response = await fetch(`/api/admin/quotes/${quoteId}/review`, {
      method: 'POST',
      headers: createHeaders(session),
      body: JSON.stringify({ action, ...data }),
    });
    return handleApiResponse(response);
  }
}
```

### 4. **Presentation Layer** (Componentes)

#### `PartnerHeader.tsx` (~30 linhas)
```typescript
interface PartnerHeaderProps {
  partner: Partner;
}

export const PartnerHeader: React.FC<PartnerHeaderProps> = ({ partner }) => {
  return (
    <HeaderCard>
      <Title>{partner.company_name}</Title>
      <PartnerId>Parceiro ID: {partner.id}</PartnerId>
      <StatusBadge active={partner.is_active}>
        {partner.is_active ? 'Ativo' : 'Inativo'}
      </StatusBadge>
    </HeaderCard>
  );
};
```

#### `PartnerMetrics.tsx` (~40 linhas)
```typescript
interface PartnerMetricsProps {
  metrics: PartnerMetrics;
}

export const PartnerMetrics: React.FC<PartnerMetricsProps> = ({ metrics }) => {
  return (
    <MetricsGrid>
      <MetricCard
        label="Serviços Cadastrados"
        value={metrics.services_count}
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
    </MetricsGrid>
  );
};
```

#### `QuotesTable.tsx` (~80 linhas)
```typescript
interface QuotesTableProps {
  quotes: Quote[];
  onOpenDetails: (quoteId: string) => void;
  onOpenReview: (quoteId: string) => void;
}

export const QuotesTable: React.FC<QuotesTableProps> = ({
  quotes,
  onOpenDetails,
  onOpenReview,
}) => {
  if (quotes.length === 0) {
    return <EmptyState message="Nenhum orçamento encontrado." />;
  }

  return (
    <TableContainer>
      <Table>
        <TableHeader />
        <tbody>
          {quotes.map(quote => (
            <QuoteRow
              key={quote.id}
              quote={quote}
              onOpenDetails={onOpenDetails}
              onOpenReview={onOpenReview}
            />
          ))}
        </tbody>
      </Table>
    </TableContainer>
  );
};
```

#### `QuoteDetailsModal.tsx` (~100 linhas)
```typescript
interface QuoteDetailsModalProps {
  isOpen: boolean;
  quoteDetails: QuoteWithItems | null;
  onClose: () => void;
  onOpenChecklist: (vehicleId: string) => void;
  onOpenReview: (quoteId: string) => void;
}

export const QuoteDetailsModal: React.FC<QuoteDetailsModalProps> = ({
  isOpen,
  quoteDetails,
  onClose,
  onOpenChecklist,
  onOpenReview,
}) => {
  if (!quoteDetails) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Orçamento">
      <QuoteInfo quote={quoteDetails.quote} />
      <QuoteItemsTable items={quoteDetails.items} />
      <ModalActions
        quote={quoteDetails.quote}
        onOpenChecklist={onOpenChecklist}
        onOpenReview={onOpenReview}
        onClose={onClose}
      />
    </Modal>
  );
};
```

#### `PartnerOverviewContainer.tsx` (~150 linhas)
```typescript
export default function PartnerOverviewContainer() {
  const params = useSearchParams();
  const partnerId = params.get('partnerId') || '';

  // Hooks customizados
  const { loading, error, partner, quotes, services } = usePartnerOverview(partnerId);
  const quoteFilters = useQuoteFilters(quotes);
  const serviceFilters = useServiceFilters(services);
  const quoteActions = useQuoteActions();
  const checklistActions = useChecklistModal();
  
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;
  if (!partner) return null;

  return (
    <PageLayout>
      <Header />
      <Container>
        <BackLink href="/dashboard" />
        
        <PartnerHeader partner={partner} />
        <PartnerMetrics metrics={partner} />
        
        <QuotesSection
          quotes={quoteFilters.filteredQuotes}
          filters={quoteFilters}
          onOpenDetails={quoteActions.openDetails}
          onOpenReview={quoteActions.openReview}
        />
        
        <ServicesSection
          services={serviceFilters.filteredServices}
          filters={serviceFilters}
          onToggleService={handleToggleService}
        />
      </Container>

      <QuoteDetailsModal
        isOpen={quoteActions.detailsOpen}
        quoteDetails={quoteActions.quoteDetails}
        onClose={quoteActions.closeDetails}
        onOpenChecklist={checklistActions.open}
        onOpenReview={quoteActions.openReview}
      />

      <ChecklistModal {...checklistActions} />
    </PageLayout>
  );
}
```

## 📊 Métricas de Melhoria

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Linhas por arquivo | 899 | ~150 (container) | ✅ -83% |
| Componentes | 1 | 15+ | ✅ +1400% |
| Responsabilidades | 8+ | 1 por arquivo | ✅ 100% |
| Type Safety (`any`) | Alto | Zero | ✅ 100% |
| Testabilidade | Baixa | Alta | ✅ +500% |
| Complexidade | 45+ | <10 | ✅ -78% |
| Reusabilidade | 0% | 80%+ | ✅ +∞ |

## 🚀 Plano de Implementação

### Fase 1: Preparação (1-2h)
1. ✅ Criar estrutura de pastas
2. ✅ Definir tipos de domínio
3. ✅ Criar interfaces e contratos
4. ✅ Configurar barrel exports

### Fase 2: Infrastructure Layer (2-3h)
1. ✅ Implementar `partnerApi.ts`
2. ✅ Implementar `quoteApi.ts`
3. ✅ Implementar `serviceApi.ts`
4. ✅ Criar helpers de API

### Fase 3: Application Layer (3-4h)
1. ✅ Implementar hooks customizados
2. ✅ Implementar serviços de domínio
3. ✅ Criar lógica de filtros
4. ✅ Implementar gerenciamento de estado

### Fase 4: Presentation Layer (4-6h)
1. ✅ Criar componentes de UI
2. ✅ Implementar styled components
3. ✅ Criar componentes compostos
4. ✅ Implementar container principal

### Fase 5: Migração (2-3h)
1. ✅ Substituir página antiga
2. ✅ Atualizar imports
3. ✅ Testar funcionalidades
4. ✅ Remover código antigo

### Fase 6: Testes (3-4h)
1. ✅ Testes unitários (hooks)
2. ✅ Testes de integração (API)
3. ✅ Testes de componentes
4. ✅ Testes E2E

## 🎯 Benefícios Esperados

### Técnicos
- ✅ **Manutenibilidade**: Código mais fácil de entender e modificar
- ✅ **Testabilidade**: Componentes e lógica isolados
- ✅ **Reusabilidade**: Componentes reutilizáveis em outras páginas
- ✅ **Type Safety**: Zero tipos `any`, melhor IntelliSense
- ✅ **Performance**: Memoização adequada, menos re-renders

### Negócio
- ✅ **Velocidade de desenvolvimento**: Novos recursos mais rápidos
- ✅ **Redução de bugs**: Menos complexidade = menos bugs
- ✅ **Onboarding**: Novos devs entendem código rapidamente
- ✅ **Escalabilidade**: Fácil adicionar novas features

## 📋 Checklist de Qualidade

- [ ] Nenhum arquivo com mais de 250 linhas
- [ ] Zero tipos `any`
- [ ] Todos os componentes com responsabilidade única
- [ ] Hooks customizados para lógica complexa
- [ ] Separação clara de camadas (DDD)
- [ ] Componentes puros quando possível
- [ ] Props interfaces bem definidas
- [ ] Testes com cobertura >80%
- [ ] Documentação inline (JSDoc)
- [ ] Acessibilidade (ARIA labels)

## 🔄 Próximos Passos

1. **Aprovação do plano**: Validar estrutura proposta
2. **Criação de branch**: `refactor/partner-overview-ddd`
3. **Implementação incremental**: Fase por fase
4. **Code Review**: Validação por pares
5. **Merge e Deploy**: Após testes completos

---

**Estimativa Total**: 15-22 horas de desenvolvimento
**Complexidade**: Média-Alta
**Prioridade**: Alta (código crítico, muitas violações)
**Impacto**: Alto (melhoria significativa na qualidade do código)
