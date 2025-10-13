# ⚠️ AVISOS IMPORTANTES: Partner Overview Refactoring

> **LEIA ANTES DE COMEÇAR** - Evite over-engineering e mantenha consistência com o projeto.

---

## 🎯 Abordagem RECOMENDADA

### ✅ Refatoração Incremental (COMEÇAR AQUI)

```
Fase 1: Tipos            (30 min)  → Valor imediato
Fase 2: Hooks            (2-3h)    → Reduz complexidade
Fase 3: Componentes      (3-4h)    → Melhora reusabilidade
Fase 4: Container        (1h)      → Arquivo reduzido a ~180 linhas

Total: 8-12 horas | Risco: BAIXO | Valor: ALTO
```

### ⏳ DDD Completo (APENAS SE NECESSÁRIO)

NÃO introduzir estrutura DDD completa (domain/application/infrastructure/presentation) **a menos que**:

- ✅ Houver lógica de domínio complexa (hoje não há)
- ✅ Múltiplos bounded contexts (hoje é 1 página)
- ✅ Necessidade de domain services (hoje não precisa)

**Regra:** Comece simples. Evolua quando necessário.

---

## 🚨 OBRIGATÓRIO: Padrões do Projeto

### 1. CSS Modules (NÃO styled-components)

```typescript
// ✅ CORRETO
import styles from './Component.module.css';
<div className={styles.container}>...</div>

// ❌ ERRADO - NÃO FAZER
import styled from 'styled-components';
const Container = styled.div`...`;
```

**Por quê:** Projeto já usa CSS Modules. Mixing de padrões cria inconsistência.

---

### 2. useAuthenticatedFetch (NÃO criar helpers novos)

```typescript
// ✅ CORRETO - Reutilizar existente
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

const { fetchWithAuth } = useAuthenticatedFetch();
const data = await fetchWithAuth('/api/admin/partners/123/overview');

// ❌ ERRADO - NÃO criar helpers paralelos
export async function getSession() { ... }
export function createHeaders(session) { ... }
export async function handleApiResponse(response) { ... }
```

**Por quê:** 
- `useAuthenticatedFetch` já existe e gerencia tokens
- Criar helpers duplicados aumenta manutenção
- RLS e autenticação já estão implementados

---

### 3. ErrorHandlerService (NÃO console.error)

```typescript
// ✅ CORRETO
import { ErrorHandlerService } from '@/modules/common/services/ErrorHandlerService';

try {
  // ... código
} catch (error) {
  ErrorHandlerService.handle(error, 'Erro ao carregar parceiro');
}

// ❌ ERRADO
console.error('Error loading partner:', error);
throw new Error('Failed to load');
```

**Por quê:** 
- Tratamento centralizado e consistente
- Integração com logging/monitoring
- UX melhor (mensagens padronizadas)

---

### 4. Redução Progressiva de `any` (NÃO "zero any" imediato)

```typescript
// ✅ ABORDAGEM CORRETA - Priorização

// Prioridade ALTA (fazer primeiro)
1. Tipos de domínio (Partner, Quote, Service)
2. Props de componentes novos
3. Retornos de hooks novos

// Prioridade MÉDIA (fazer depois)
4. Helpers e utils
5. Tipos auxiliares

// Prioridade BAIXA (aceitar temporariamente)
6. Código legado não refatorado ainda
7. Integrações complexas (migrar depois)

// ❌ ERRADO - Tentar eliminar todos os `any` de uma vez
// Isso bloqueia progresso e cria frustração
```

**Por quê:**
- "Zero any" é aspiração, não requisito bloqueante
- Redução progressiva é mais realista
- Foco em valor incremental

---

### 5. Componentes Existentes (NÃO recriar)

```typescript
// ✅ CORRETO - Reutilizar
import { ChecklistViewer } from '@/modules/vehicles/components/ChecklistViewer';
import QuoteReviewModal from '@/modules/admin/components/QuoteReviewModal';
import { Loading } from '@/modules/common/components/Loading/Loading';
import Modal from '@/modules/common/components/Modal/Modal';

// ❌ ERRADO - Recriar do zero
export const MyChecklistViewer = () => { ... }
export const MyQuoteModal = () => { ... }
```

**Por quê:**
- Componentes já testados e integrados
- Evita duplicação e inconsistência
- Economiza tempo

---

## 📋 Critérios de Aceitação Realistas

### Funcionalidades (Obrigatório ✅)

- [ ] Página carrega dados do parceiro
- [ ] Métricas exibem valores corretos
- [ ] Filtros de quotes funcionam
- [ ] Filtros de serviços funcionam
- [ ] Modal de detalhes abre corretamente
- [ ] Modal de review funciona
- [ ] Checklist viewer integrado funciona
- [ ] Toggle de serviços funciona
- [ ] Sem regressão visual ou funcional

### Qualidade (Progressivo ⏳)

- [ ] Arquivo principal < 200 linhas (não forçar <150)
- [ ] Novos componentes < 150 linhas cada
- [ ] Redução de `any` em 50%+ (não 100%)
- [ ] Hooks isolados e testáveis
- [ ] CSS Modules em novos componentes

### Não Bloqueante (Desejável 💡)

- [ ] Cobertura de testes >60% (não 80%)
- [ ] Documentação JSDoc (importante, mas não bloqueia merge)
- [ ] Performance otimizada (se não regredir, OK)

---

## 🔄 Rollback Plan OBRIGATÓRIO

Antes de começar:

```bash
# 1. SEMPRE fazer backup
cp app/dashboard/admin/partner-overview/page.tsx \
   app/dashboard/admin/partner-overview/page.tsx.backup

# 2. Se algo der errado, reverter
mv app/dashboard/admin/partner-overview/page.tsx.backup \
   app/dashboard/admin/partner-overview/page.tsx

# 3. Limpar arquivos da refatoração
rm -rf modules/admin/partner-overview

# 4. Commit de rollback
git add .
git commit -m "revert: rollback partner-overview refactoring"
git push
```

**⚠️ Manter backup até:**
- Todos os testes passarem
- Validação manual completa
- Deploy em staging OK
- Aprovação do time

---

## 🚫 O QUE NÃO FAZER

### ❌ Over-Engineering

```typescript
// ❌ NÃO criar camadas vazias
// Se não tem lógica de domínio, não criar domain/services
modules/admin/partner-overview/
├── domain/
│   └── services/      ← Vazio ou com 1 função simples
└── application/
    └── services/      ← Vazio ou com 1 função simples

// ✅ Começar simples
modules/admin/partner-overview/
├── types.ts           ← Tipos
├── hooks/             ← Lógica de dados
└── components/        ← UI
```

### ❌ Mixing de Padrões

```typescript
// ❌ NÃO misturar estilos
import styled from 'styled-components';  // Projeto usa CSS Modules
import styles from './Component.module.css';

// ❌ NÃO criar fetch duplicado
const myFetch = async () => { ... }     // Já existe useAuthenticatedFetch

// ❌ NÃO criar error handling novo
const handleError = () => { ... }        // Já existe ErrorHandlerService
```

### ❌ Perfeição Prematura

```typescript
// ❌ NÃO tentar eliminar todos os `any` de uma vez
// ❌ NÃO forçar 100% de cobertura de testes
// ❌ NÃO refatorar tudo em 1 PR gigante
// ❌ NÃO adicionar abstrações "por via das dúvidas"

// ✅ Incremental, pragmático, funcional
```

---

## 📊 Validação de Endpoints

Antes de criar tipos, **valide os endpoints reais**:

### 1. Partner Overview
```bash
# Endpoint: GET /api/admin/partners/{id}/overview
# Verificar estrutura real da resposta
curl -H "Authorization: Bearer $TOKEN" \
  https://sua-api.com/api/admin/partners/123/overview

# Criar tipos baseados na resposta REAL, não em suposições
```

### 2. Partner Services
```bash
# Endpoint: GET /api/admin/partners/{id}/services
curl -H "Authorization: Bearer $TOKEN" \
  https://sua-api.com/api/admin/partners/123/services
```

### 3. Quote Details
```bash
# Endpoint: GET /api/admin/quotes/{id}
curl -H "Authorization: Bearer $TOKEN" \
  https://sua-api.com/api/admin/quotes/456
```

### 4. Quote Review
```bash
# Endpoint: POST /api/admin/quotes/{id}/review
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "approve_full"}' \
  https://sua-api.com/api/admin/quotes/456/review
```

**⚠️ Importante:** Alinhe interfaces TypeScript com respostas reais para evitar refatoração futura.

---

## 🎯 Sucesso da Refatoração

### ✅ BOM: Incremental e Pragmático

```
Semana 1: Tipos + Hooks → Valor imediato
Semana 2: Componentes → Reusabilidade
Semana 3+: Testes + Otimizações → Qualidade
```

Resultado:
- ✅ Arquivo reduzido a ~180 linhas
- ✅ Componentes reutilizáveis
- ✅ Código mais testável
- ✅ Sem regressões
- ✅ Time confiante

### ❌ RUIM: Big Bang e Over-Engineered

```
Sprint 1-2: Criar estrutura DDD completa
Sprint 3-4: Migrar tudo de uma vez
Sprint 5: Descobrir bugs e reverter
```

Resultado:
- ❌ Muito tempo investido
- ❌ Bugs inesperados
- ❌ Time frustrado
- ❌ Rollback custoso
- ❌ Medo de refatorar no futuro

---

## 💡 Lembrete Final

> **"Faça o simples funcionar antes de fazer o complexo."**

1. ✅ Comece incremental
2. ✅ Siga padrões do projeto
3. ✅ Valide após cada fase
4. ✅ Mantenha rollback disponível
5. ✅ Evolua quando necessário

**BOA SORTE! 🚀**
