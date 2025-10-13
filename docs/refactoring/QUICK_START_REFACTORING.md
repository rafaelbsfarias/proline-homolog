# Quick Start: Refatoração Partner Overview

## 🚀 Começar AGORA - Passos Imediatos

### Opção 1: Refatoração Completa (Recomendado)
**Tempo:** 15-22 horas | **Impacto:** Alto | **Qualidade:** ⭐⭐⭐⭐⭐

```bash
# 1. Criar branch
git checkout -b refactor/partner-overview-ddd

# 2. Criar estrutura de pastas
mkdir -p modules/admin/partner-overview/{domain/{types,models},application/{hooks,services},infrastructure/api,presentation/components}

# 3. Seguir o plano completo em:
# - docs/refactoring/PARTNER_OVERVIEW_REFACTORING_PLAN.md
# - docs/refactoring/PARTNER_OVERVIEW_IMPLEMENTATION_EXAMPLES.md
```

### Opção 2: Refatoração Incremental (Pragmático)
**Tempo:** 8-12 horas | **Impacto:** Médio | **Qualidade:** ⭐⭐⭐⭐

Refatorar apenas o essencial para reduzir o arquivo para ~300 linhas.

---

## 📋 Plano Incremental (Começar Hoje)

### ⚠️ PRINCÍPIOS DE CONSISTÊNCIA COM O PROJETO

Antes de começar, garanta que você está seguindo os padrões existentes:

#### 1. **Estilos: CSS Modules (NÃO styled-components)**
```typescript
// ✅ CORRETO - Usar CSS Modules
import styles from './Component.module.css';
<div className={styles.container}>...</div>

// ❌ ERRADO - NÃO usar styled-components
import styled from 'styled-components';
const Container = styled.div`...`;
```

#### 2. **Fetch: useAuthenticatedFetch (NÃO criar helpers novos)**
```typescript
// ✅ CORRETO - Reutilizar hook existente
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
const { fetchWithAuth } = useAuthenticatedFetch();

// ❌ ERRADO - NÃO criar getSession/createHeaders duplicados
import { supabase } from '@/modules/common/services/supabaseClient';
const { data: { session } } = await supabase.auth.getSession();
```

#### 3. **Errors: ErrorHandlerService (NÃO console.error)**
```typescript
// ✅ CORRETO - Usar serviço centralizado
import { ErrorHandlerService } from '@/modules/common/services/ErrorHandlerService';
ErrorHandlerService.handle(error, 'Contexto do erro');

// ❌ ERRADO - NÃO usar console direto
console.error('Error:', error);
```

#### 4. **Tipos: Redução Progressiva (NÃO "zero any" imediato)**
```typescript
// ✅ CORRETO - Priorizar tipos críticos primeiro
1. Partner, Quote, Service (tipos de domínio)
2. Props de componentes
3. Retornos de hooks
4. Tipos auxiliares

// ⏳ PROGRESSIVO - Aceitar `any` temporário em:
- Código legado não refatorado ainda
- Integrações complexas (migrar depois)
```

#### 5. **Componentes: Integração com Existentes**
```typescript
// ✅ MANTER - Componentes já integrados
import { ChecklistViewer } from '@/modules/vehicles/components/ChecklistViewer';
import QuoteReviewModal from '@/modules/admin/components/QuoteReviewModal';
import { Loading } from '@/modules/common/components/Loading/Loading';

// Não recriar, apenas compor com novos componentes
```

---

### Fase 1: Extrair Tipos (30 min)
```bash
# Criar estrutura básica (sem DDD completo ainda)
mkdir -p modules/admin/partner-overview
touch modules/admin/partner-overview/types.ts
```

**⚠️ IMPORTANTE:** Começamos SEM a estrutura DDD completa. Apenas:
- `types.ts` - Tipos TypeScript
- `hooks/` - Lógica de dados (quando necessário)
- `components/` - UI (quando necessário)

**Mover para `types.ts`:**
- Interface `PartnerSummary` (remover `any[]`)
- Tipos de Quote (com status bem definidos)
- Tipos de Service
- Tipos de filtros

**Progressão de tipos (prioridade):**
1. ✅ Partner e PartnerMetrics
2. ✅ Quote e QuotesByStatus
3. ✅ Service
4. ⏳ Tipos auxiliares (filtros, actions)

### Fase 2: Extrair Hooks (1-2h)

#### 2.1 Hook de Partner Data
```typescript
// modules/admin/partner-overview/hooks/usePartnerData.ts
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { ErrorHandlerService } from '@/modules/common/services/ErrorHandlerService';

export function usePartnerData(partnerId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [quotes, setQuotes] = useState<QuotesByStatus | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  // ✅ Reutilizar useAuthenticatedFetch existente
  const { fetchWithAuth } = useAuthenticatedFetch();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewData, servicesData] = await Promise.all([
        fetchWithAuth(`/api/admin/partners/${partnerId}/overview`),
        fetchWithAuth(`/api/admin/partners/${partnerId}/services`),
      ]);
      // ... processar dados
    } catch (err) {
      ErrorHandlerService.handle(err, 'Erro ao carregar parceiro');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [partnerId, fetchWithAuth]);
  
  return { loading, error, partner, quotes, services, refetch: loadData };
}
```

**⚠️ IMPORTANTE:**
- ✅ Usar `useAuthenticatedFetch` existente (não criar novo helper)
- ✅ Usar `ErrorHandlerService` para tratamento consistente
- ✅ Manter padrão de async/await do projeto

#### 2.2 Hook de Filtros
```typescript
// modules/admin/partner-overview/hooks/useQuoteFilters.ts
export function useQuoteFilters(quotes: QuotesByStatus | null) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<QuoteFilterStatus>('pending_admin_approval');
  
  const filteredQuotes = useMemo(() => {
    // Lógica de filtro...
  }, [quotes, query, status]);

  return { query, setQuery, status, setStatus, filteredQuotes };
}
```

### Fase 3: Extrair Componentes Principais (2-3h)

#### 3.1 PartnerHeader
```typescript
// modules/admin/partner-overview/components/PartnerHeader.tsx
import styles from './PartnerHeader.module.css';

interface Props {
  partner: Partner;
}

export const PartnerHeader: React.FC<Props> = ({ partner }) => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{partner.company_name}</h1>
      <div className={styles.partnerId}>Parceiro ID: {partner.id}</div>
      <div className={partner.is_active ? styles.statusActive : styles.statusInactive}>
        {partner.is_active ? 'Ativo' : 'Inativo'}
      </div>
    </div>
  );
};
```

```css
/* modules/admin/partner-overview/components/PartnerHeader.module.css */
.container {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.title {
  margin: 0;
  font-size: 1.5rem;
  color: #072e4c;
}

.partnerId {
  margin-top: 8px;
  color: #555;
}

.statusActive {
  margin-top: 4px;
  color: #16a34a;
  font-weight: 500;
}

.statusInactive {
  margin-top: 4px;
  color: #9ca3af;
  font-weight: 500;
}
```

**⚠️ IMPORTANTE:**
- ✅ Usar CSS Modules (padrão do projeto)
- ❌ NÃO usar styled-components
- ✅ Classes CSS semânticas

#### 3.2 PartnerMetrics
```typescript
// modules/admin/partner-overview/components/PartnerMetrics.tsx
interface Props {
  metrics: {
    services_count: number;
    pending_budgets: number;
    executing_budgets: number;
    approval_budgets: number;
  };
}

export const PartnerMetrics: React.FC<Props> = ({ metrics }) => {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Cards de métricas */}
    </div>
  );
};
```

#### 3.3 QuotesTable
```typescript
// modules/admin/partner-overview/components/QuotesTable.tsx
interface Props {
  quotes: Quote[];
  filters: {
    query: string;
    setQuery: (q: string) => void;
    status: QuoteFilterStatus;
    setStatus: (s: QuoteFilterStatus) => void;
  };
  onOpenDetails: (id: string) => void;
  onOpenReview: (id: string) => void;
}

export const QuotesTable: React.FC<Props> = ({
  quotes,
  filters,
  onOpenDetails,
  onOpenReview,
}) => {
  return (
    <div>
      {/* Filtros */}
      {/* Tabela */}
    </div>
  );
};
```

#### 3.4 ServicesTable
```typescript
// modules/admin/partner-overview/components/ServicesTable.tsx
interface Props {
  services: Service[];
  filters: {
    query: string;
    setQuery: (q: string) => void;
    status: ServiceFilterStatus;
    setStatus: (s: ServiceFilterStatus) => void;
  };
  onToggle: (id: string, active: boolean) => void;
}

export const ServicesTable: React.FC<Props> = ({
  services,
  filters,
  onToggle,
}) => {
  return (
    <div>
      {/* Filtros */}
      {/* Tabela */}
    </div>
  );
};
```

### Fase 4: Refatorar Page (1h)

```typescript
// app/dashboard/admin/partner-overview/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import { Loading } from '@/modules/common/components/Loading/Loading';
import { usePartnerData } from '@/modules/admin/partner-overview/hooks/usePartnerData';
import { useQuoteFilters } from '@/modules/admin/partner-overview/hooks/useQuoteFilters';
import { useServiceFilters } from '@/modules/admin/partner-overview/hooks/useServiceFilters';
import { PartnerHeader } from '@/modules/admin/partner-overview/components/PartnerHeader';
import { PartnerMetrics } from '@/modules/admin/partner-overview/components/PartnerMetrics';
import { QuotesTable } from '@/modules/admin/partner-overview/components/QuotesTable';
import { ServicesTable } from '@/modules/admin/partner-overview/components/ServicesTable';

export default function PartnerOverviewPage() {
  const params = useSearchParams();
  const partnerId = params.get('partnerId') || '';

  const { loading, error, partner, quotes, services } = usePartnerData(partnerId);
  const quoteFilters = useQuoteFilters(quotes);
  const serviceFilters = useServiceFilters(services);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;
  if (!partner) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
        <BackLink />
        <PartnerHeader partner={partner} />
        <PartnerMetrics metrics={partner} />
        <QuotesTable 
          quotes={quoteFilters.filteredQuotes}
          filters={quoteFilters}
          onOpenDetails={handleOpenDetails}
          onOpenReview={handleOpenReview}
        />
        <ServicesTable
          services={serviceFilters.filteredServices}
          filters={serviceFilters}
          onToggle={handleToggleService}
        />
      </main>
      {/* Modais */}
    </div>
  );
}
```

---

## 📊 Resultado Esperado da Refatoração Incremental

### Estrutura de Arquivos
```
modules/admin/partner-overview/
├── types.ts                          # 80 linhas
├── hooks/
│   ├── usePartnerData.ts            # 120 linhas
│   ├── useQuoteFilters.ts           # 50 linhas
│   └── useServiceFilters.ts         # 50 linhas
└── components/
    ├── PartnerHeader.tsx            # 40 linhas
    ├── PartnerMetrics.tsx           # 60 linhas
    ├── QuotesTable.tsx              # 120 linhas
    └── ServicesTable.tsx            # 100 linhas

app/dashboard/admin/partner-overview/
└── page.tsx                         # 180 linhas ✅

Total: ~800 linhas distribuídas em 9 arquivos
Maior arquivo: 180 linhas ✅
```

### Comparação

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Arquivos | 1 | 9 | +800% |
| Maior arquivo | 899 linhas | 180 linhas | -80% ✅ |
| Responsabilidades por arquivo | 8+ | 1-2 | -75% ✅ |
| Testabilidade | Baixa | Média | +300% ✅ |
| Reusabilidade | 0% | 60% | +∞ ✅ |

---

## ✅ Checklist de Validação

### Critérios de Aceitação (Todos devem passar)

#### Funcionalidades Core
- [ ] **Carregamento de dados:**
  - [ ] Métricas do parceiro carregam e exibem corretamente
  - [ ] Lista de quotes carrega por status
  - [ ] Lista de serviços carrega com status ativo/inativo
  
- [ ] **Filtros:**
  - [ ] Filtro de quotes por query (ID/OS) funciona
  - [ ] Filtro de quotes por status funciona
  - [ ] Filtro de serviços por nome funciona
  - [ ] Filtro de serviços por status funciona

- [ ] **Ações:**
  - [ ] Botão "Detalhes" abre modal de quote
  - [ ] Botão "Revisar" abre modal de review
  - [ ] Botão "Ver Checklist Completo" abre checklist (quando vehicle_id existe)
  - [ ] Toggle de serviço (aprovar/reprovar) funciona
  - [ ] Submit de review (aprovar/rejeitar) funciona

- [ ] **Modais:**
  - [ ] QuoteDetailsModal exibe informações corretas
  - [ ] QuoteReviewModal permite review parcial/completo
  - [ ] ChecklistViewer exibe checklist e evidências
  - [ ] Todos os modais fecham corretamente

#### Qualidade de Código
- [ ] **Tipos:**
  - [ ] Zero novos `any` introduzidos
  - [ ] Props de componentes tipadas
  - [ ] Retornos de hooks tipados
  
- [ ] **Performance:**
  - [ ] Filtros usam `useMemo` apropriadamente
  - [ ] Componentes não re-renderizam desnecessariamente
  - [ ] Listas usam keys estáveis

- [ ] **Consistência:**
  - [ ] CSS Modules em todos os novos componentes
  - [ ] `useAuthenticatedFetch` para todas as chamadas API
  - [ ] `ErrorHandlerService` para tratamento de erros
  - [ ] Componentes existentes (Loading, Modal) reutilizados

#### Regressão (Zero bugs novos)
- [ ] **Visual:**
  - [ ] Estilos mantidos (cores, espaçamentos, fontes)
  - [ ] Layout responsivo funciona
  - [ ] Loading states exibem corretamente

- [ ] **Navegação:**
  - [ ] Link "Voltar" funciona
  - [ ] Navegação por URL (partnerId param) funciona
  - [ ] Estados de loading/error/empty tratados

### Rollback Plan

Se algo der errado durante a refatoração:

```bash
# 1. Manter backup do original
cp app/dashboard/admin/partner-overview/page.tsx \
   app/dashboard/admin/partner-overview/page.tsx.backup

# 2. Se precisar reverter
mv app/dashboard/admin/partner-overview/page.tsx.backup \
   app/dashboard/admin/partner-overview/page.tsx

# 3. Remover arquivos da refatoração
rm -rf modules/admin/partner-overview

# 4. Commit de rollback
git add .
git commit -m "Revert: rollback partner-overview refactoring"
```

### Validação Pós-Deploy

Depois de fazer merge para main:

- [ ] Deploy em staging sem erros
- [ ] Testes manuais em staging aprovados
- [ ] Métricas de performance mantidas ou melhoradas
- [ ] Nenhum erro no Sentry/logs
- [ ] Aprovação do time antes de produção

---

## ✅ Checklist de Execução

### Hoje (4-6 horas)
- [ ] Criar branch `refactor/partner-overview-incremental`
- [ ] Criar `modules/admin/partner-overview/types.ts`
- [ ] Extrair tipos do arquivo principal (redução progressiva de `any`)
- [ ] Criar `usePartnerData.ts` hook (usar `useAuthenticatedFetch`)
- [ ] Criar `useQuoteFilters.ts` hook
- [ ] Criar `useServiceFilters.ts` hook
- [ ] **Testar que tudo ainda funciona** ✅
- [ ] **Validar critérios de aceitação:**
  - [ ] Página carrega dados do parceiro corretamente
  - [ ] Filtros de quotes funcionam
  - [ ] Filtros de serviços funcionam
  - [ ] Sem regressão visual ou funcional

### Amanhã (4-6 horas)
- [ ] Criar componente `PartnerHeader` (com CSS Module)
- [ ] Criar componente `PartnerMetrics` (com CSS Module)
- [ ] Criar componente `QuotesTable` (com CSS Module)
- [ ] Criar componente `ServicesTable` (com CSS Module)
- [ ] Refatorar `page.tsx` para usar novos componentes
- [ ] **Testar todas as funcionalidades:**
  - [ ] Modais abrem e fecham corretamente
  - [ ] Ações de review funcionam
  - [ ] Toggle de serviços funciona
  - [ ] ChecklistViewer integrado funciona
  - [ ] QuoteReviewModal integrado funciona
- [ ] **Rollback plan:** Manter `page.tsx.backup` até validação completa
- [ ] Fazer commit e push

### Próxima Sprint (Opcional - Refatoração Completa)
- [ ] Migrar para estrutura DDD completa
- [ ] Criar camada de Infrastructure (API)
- [ ] Criar camada de Application (Services)
- [ ] Adicionar testes unitários
- [ ] Adicionar testes de integração

---

## 🎯 Prioridade de Ação

### 🔴 CRÍTICO (Fazer AGORA)
1. **Extrair tipos** - Remove `any`, melhora type safety
2. **Extrair `usePartnerData`** - Isola lógica de fetch
3. **Extrair componentes de tabela** - Reduz complexidade visual

### 🟡 IMPORTANTE (Fazer Esta Semana)
4. **Extrair componentes de header/metrics** - Melhora reusabilidade
5. **Extrair hooks de filtros** - Simplifica lógica

### 🟢 DESEJÁVEL (Fazer Próxima Sprint)
6. **Migração completa para DDD** - Qualidade máxima
7. **Testes automatizados** - Confiabilidade
8. **Documentação completa** - Manutenibilidade

---

## 💡 Dicas Práticas

### 1. Começe pelos Tipos
- Elimina `any`
- Melhora IntelliSense
- Base sólida para refatoração

### 2. Extraia Hooks Primeiro
- Isola lógica de estado
- Fácil de testar
- Reduz complexidade do componente

### 3. Componentes por Último
- Já tem tipos e hooks prontos
- Processo mais rápido
- Menor risco de quebrar

### 4. Teste Após Cada Extração
- Garanta que nada quebrou
- Commit incremental
- Rollback fácil se necessário

---

## 🚨 Riscos e Mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Quebrar funcionalidade | Média | Alto | Testar após cada mudança |
| Perder contexto | Baixa | Médio | Commits frequentes |
| Overhead de tempo | Média | Médio | Fazer incrementalmente |
| Regressão de bugs | Baixa | Alto | Manter testes manuais |

---

## 📞 Próximo Passo

**Você decide:**

1. ✅ **SIM, vamos refatorar agora** → Começar com Fase 1 (Tipos)
2. ⏰ **Mais tarde esta semana** → Adicionar na sprint
3. 📋 **Apenas documentar** → Manter como dívida técnica

**Qual opção você prefere?**
