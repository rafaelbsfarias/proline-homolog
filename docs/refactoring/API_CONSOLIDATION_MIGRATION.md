# Migração: Consolidação de APIs de Checklist

## 🎯 Objetivo
Consolidar 2 APIs duplicadas de carregamento de checklist em uma única API moderna, seguindo princípios DRY e SOLID.

---

## 📊 Status da Migração

### ✅ Concluído
- [x] API legada deprecada com warnings e headers
- [x] Migrado: `app/dashboard/partner/approved/page.tsx`
- [x] Migrado: `app/dashboard/admin/partner-overview/page.tsx`
- [x] Documentação criada

### 🔜 Próximos Passos
- [ ] Remover API legada `/api/partner-checklist/route.ts`
- [ ] Remover controller `partnerChecklistController.ts`
- [ ] Remover hook legado `usePartnerChecklist.ts` (módulo vehicles)
- [ ] Atualizar testes

---

## 🔄 Comparação: Antes vs Depois

### ❌ **ANTES (API Legada)**

**Endpoint:**
```
GET /api/partner-checklist?vehicleId={uuid}
```

**Uso em código:**
```typescript
// Hook antigo
import { usePartnerChecklist } from '@/modules/vehicles/hooks/usePartnerChecklist';

const { data, loading, error } = usePartnerChecklist(vehicleId);

// Ou fetch direto
const res = await fetch(`/api/partner-checklist?vehicleId=${vehicleId}`);
```

**Problemas:**
- ❌ Método GET com query string
- ❌ Usa `withAnyAuth` (menos seguro)
- ❌ Sem validação Zod
- ❌ Controller intermediário desnecessário
- ❌ Sem suporte nativo para `quoteId`

---

### ✅ **DEPOIS (API Nova)**

**Endpoint:**
```
POST /api/partner/checklist/load
```

**Uso em código:**
```typescript
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

const { authenticatedFetch } = useAuthenticatedFetch();

// Com quoteId
const response = await authenticatedFetch('/api/partner/checklist/load', {
  method: 'POST',
  body: JSON.stringify({ quoteId: vehicleId }),
});

// Ou com inspectionId (legacy support)
const response = await authenticatedFetch('/api/partner/checklist/load', {
  method: 'POST',
  body: JSON.stringify({ inspectionId: inspectionId }),
});
```

**Vantagens:**
- ✅ Método POST com validação de corpo
- ✅ Usa `withPartnerAuth` (mais seguro)
- ✅ Validação com Zod schema
- ✅ Sem controller intermediário (camadas reduzidas)
- ✅ Suporte a `quoteId` E `inspectionId`
- ✅ Logging estruturado

---

## 📝 Arquivos Migrados

### 1. **app/dashboard/partner/approved/page.tsx**

**Antes:**
```typescript
const res = await fetch(`/api/partner-checklist?vehicleId=${vehicleId}`, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
});
```

**Depois:**
```typescript
const res = await authenticatedFetch('/api/partner/checklist/load', {
  method: 'POST',
  body: JSON.stringify({ quoteId: vehicleId }),
});
```

---

### 2. **app/dashboard/admin/partner-overview/page.tsx**

**Antes:**
```typescript
import { usePartnerChecklist } from '@/modules/vehicles/hooks/usePartnerChecklist';

const { data: checklistData, loading: checklistLoading } = usePartnerChecklist(
  vehicleIdForChecklist || undefined
);
```

**Depois:**
```typescript
const [checklistData, setChecklistData] = useState<PartnerChecklistData | null>(null);
const [checklistLoading, setChecklistLoading] = useState(false);

const handleOpenChecklist = useCallback(
  async (vehicleId: string) => {
    setChecklistLoading(true);
    
    const response = await authenticatedFetch('/api/partner/checklist/load', {
      method: 'POST',
      body: JSON.stringify({ quoteId: vehicleId }),
    });
    
    if (response.ok && response.data) {
      setChecklistData(response.data as PartnerChecklistData);
    }
    
    setChecklistLoading(false);
  },
  [authenticatedFetch]
);
```

---

## 🗑️ Arquivos para Remoção (Próxima Sprint)

### API Legada
```
📁 app/api/partner-checklist/
└── route.ts  [DEPRECADO - REMOVER]
```

### Controller Duplicado
```
📁 modules/partner/checklist/controller/
└── partnerChecklistController.ts  [REMOVER]
```

### Hook Legado
```
📁 modules/vehicles/hooks/
└── usePartnerChecklist.ts  [REMOVER - após confirmar nenhum uso]
```

---

## 🧪 Como Testar

### 1. Testar Approved Page
```bash
# 1. Login como parceiro
# 2. Navegar para /dashboard/partner/approved
# 3. Clicar em "Carregar detalhes" de um orçamento
# 4. Verificar que checklist é carregado corretamente
```

### 2. Testar Admin Partner Overview
```bash
# 1. Login como admin
# 2. Navegar para /dashboard/admin/partner-overview?partnerId=xxx
# 3. Clicar em "Ver checklist" de um veículo
# 4. Verificar que modal abre com dados
```

### 3. Verificar Logs
```bash
# Verificar que API legada não está sendo chamada:
grep "deprecated_api_usage" logs/application.log

# Se houver chamadas, investigar de onde vêm
```

---

## 📊 Métricas de Impacto

### Antes
- **2 APIs** fazendo a mesma coisa
- **8 camadas** (API → Controller → Service → ...)
- **Sem validação** de entrada
- **2 métodos** de autenticação diferentes

### Depois
- **1 API** consolidada ✅
- **4 camadas** (API → Service → Repository → DB) ✅
- **Validação Zod** em todas entradas ✅
- **1 método** de autenticação consistente ✅

### Código Removido (Futuro)
- `-120 linhas` (route.ts + controller.ts + hook.ts)
- `-1 arquivo` de controller
- `-1 hook` duplicado

---

## 🚨 Avisos Importantes

### ⚠️ API Legada Ainda Está Ativa
A API legada foi **deprecada mas não removida** para permitir rollback se necessário.

**Headers de Deprecação:**
```http
X-API-Deprecated: true
X-API-Deprecation-Info: Use POST /api/partner/checklist/load
```

**Logs de Uso:**
Toda chamada à API legada gera um log de warning:
```json
{
  "level": "warn",
  "message": "deprecated_api_usage",
  "url": "/api/partner-checklist?vehicleId=xxx",
  "user": "user-id"
}
```

### 🔍 Verificar Outros Usos
Antes de remover completamente, verificar se há outros lugares chamando a API:

```bash
# Buscar por uso da API legada
grep -r "/api/partner-checklist" app/ modules/ --include="*.ts" --include="*.tsx"

# Buscar por import do hook legado
grep -r "usePartnerChecklist" app/ modules/ --include="*.ts" --include="*.tsx"
```

---

## 🎓 Lições Aprendidas

1. **DRY**: Ter 2 APIs fazendo a mesma coisa aumenta complexidade e risco de bugs
2. **Validação**: Zod schemas previnem erros e documentam contratos
3. **Auth**: Usar middleware específico (`withPartnerAuth`) é mais seguro que genérico (`withAnyAuth`)
4. **Camadas**: Menos camadas = menos bugs e mais fácil manutenção
5. **Migração**: Deprecar antes de remover permite rollback seguro

---

## 📅 Timeline

| Data | Ação |
|------|------|
| 14 Out 2025 | ✅ Migração de arquivos concluída |
| 14 Out 2025 | ✅ API legada deprecada com warnings |
| 21 Out 2025 | 🔜 Verificar logs (1 semana) |
| 21 Out 2025 | 🔜 Remover API legada se sem uso |
| 21 Out 2025 | 🔜 Remover controller e hook legado |

---

## 🔗 Referências

- **Issue Original**: [EVIDENCE_CODE_CLEANUP_ANALYSIS.md](./EVIDENCE_CODE_CLEANUP_ANALYSIS.md)
- **API Nova**: `app/api/partner/checklist/load/route.ts`
- **Service**: `modules/partner/services/ChecklistService.ts`

---

**Status**: 🟢 Migração Completa (Fase 1)  
**Próxima Fase**: Remover código legado após período de observação  
**Responsável**: Sistema de Refatoração  
**Data**: 14 de Outubro de 2025
