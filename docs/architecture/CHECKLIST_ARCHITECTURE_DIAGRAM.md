# 🏗️ Arquitetura Visual: Partner Checklist

**Data:** 14 de Outubro de 2025

---

## 📊 Visão Geral: 3 Implementações Coexistindo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       PARTNER CHECKLIST SYSTEM                          │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │   CHECKLIST V1   │  │ DYNAMIC-CHECKLIST│  │   CHECKLIST V2   │     │
│  │  (Hard-coded)    │  │   (Anomalies)    │  │   (Templates)    │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│         ↓                      ↓                       ↓                │
│   Mecânica Only          Outras Categorias        Todas Categorias     │
│   ✅ PRODUÇÃO            ✅ PRODUÇÃO              ⚠️  BETA              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🗺️ Fluxo do Usuário

### Cenário 1: Parceiro MECÂNICA

```
┌──────────┐     ┌─────────────────┐     ┌──────────────────┐
│ Partner  │────▶│PartnerDashboard │────▶│ /checklist       │
│ Login    │     │ (linha 264)     │     │ (hard-coded)     │
└──────────┘     └─────────────────┘     └──────────────────┘
                          │
                          │ category === 'Mecânica'
                          │
                          ▼
              Link: /dashboard/partner/checklist?quoteId=XXX
```

### Cenário 2: Parceiro NÃO-MECÂNICA (Funilaria, Lavagem, etc)

```
┌──────────┐     ┌─────────────────┐     ┌──────────────────────┐
│ Partner  │────▶│PartnerDashboard │────▶│ /dynamic-checklist   │
│ Login    │     │ (linha 265)     │     │ (anomalies)          │
└──────────┘     └─────────────────┘     └──────────────────────┘
                          │
                          │ category !== 'Mecânica'
                          │
                          ▼
          Link: /dashboard/partner/dynamic-checklist?quoteId=XXX
```

### Cenário 3: FUTURO (checklist-v2)

```
┌──────────┐     ┌─────────────────┐     ┌──────────────────┐
│ Partner  │────▶│PartnerDashboard │────▶│ /checklist-v2    │
│ Login    │     │ (modificado)    │     │ (templates)      │
└──────────┘     └─────────────────┘     └──────────────────┘
                          │
                          │ TODAS as categorias
                          │
                          ▼
              Link: /dashboard/partner/checklist-v2?vehicleId=XXX&quoteId=YYY
```

---

## 📂 Estrutura de Arquivos (Simplificada)

```
proline-homolog/
│
├── app/
│   ├── api/partner/checklist/
│   │   ├── init/route.ts              ✅ Usado por V1 e V2
│   │   ├── load/route.ts              ✅ Usado por V1 e V2
│   │   ├── submit/route.ts            ✅ CRITICAL (salva dados)
│   │   ├── upload-evidence/route.ts   ✅ Upload de imagens
│   │   ├── exists/route.ts            ✅ Cache (useChecklistCache)
│   │   ├── save-anomalies/route.ts    ✅ Usado por dynamic-checklist
│   │   ├── load-anomalies/route.ts    ✅ Usado por dynamic-checklist
│   │   └── templates/
│   │       ├── route.ts               ✅ Usado por V2
│   │       └── [category]/route.ts    ✅ Usado por V2
│   │
│   └── dashboard/partner/
│       ├── checklist/                 ✅ V1 (Mecânica)
│       │   └── page.tsx               
│       ├── dynamic-checklist/         ✅ Outras categorias
│       │   ├── page.tsx
│       │   ├── components/
│       │   │   ├── PartRequestModal.tsx    ← Compartilhado!
│       │   │   └── PartRequestCard.tsx     ← Compartilhado!
│       │   ├── hooks/
│       │   │   └── usePartRequestModal.ts  ← Compartilhado!
│       │   └── types/
│       │       └── index.ts                ← Compartilhado!
│       └── checklist-v2/              ⚠️  Beta
│           └── page.tsx
│
├── modules/
│   ├── partner/
│   │   ├── hooks/
│   │   │   ├── checklist/
│   │   │   │   ├── useChecklistOrchestrator.ts  ✅ Usado por V1
│   │   │   │   ├── useChecklistForm.ts
│   │   │   │   ├── useChecklistData.ts
│   │   │   │   ├── useChecklistSubmit.ts
│   │   │   │   └── useAnomalies.ts
│   │   │   ├── usePartnerChecklist.ts       ⚠️  Wrapper (usado por dynamic)
│   │   │   ├── useChecklistCache.ts         ✅ Sistema de cache
│   │   │   └── useChecklistTemplate.ts      ✅ Usado por V2
│   │   │
│   │   ├── components/
│   │   │   └── checklist/
│   │   │       ├── PartnerChecklistGroups.tsx  ✅ Usado por V1
│   │   │       └── DynamicChecklistForm.tsx    ✅ Usado por V2
│   │   │
│   │   └── checklist/
│   │       ├── controller/
│   │       │   └── partnerChecklistController.ts  ✅ Orquestra tudo
│   │       ├── services/
│   │       │   ├── mechanicsChecklistService.ts
│   │       │   └── anomaliesService.ts
│   │       ├── repositories/
│   │       │   ├── MechanicsChecklistRepository.ts
│   │       │   └── AnomaliesRepository.ts
│   │       ├── mappers/
│   │       │   └── ChecklistMappers.ts
│   │       ├── utils/
│   │       │   ├── signedUrlService.ts
│   │       │   └── groupByCategory.ts
│   │       ├── schemas.ts
│   │       └── errors.ts
│   │
│   └── vehicles/
│       └── hooks/
│           └── usePartnerChecklist.ts       ⚠️  NOME DUPLICADO!
│                                             (usado para VIEWER, não editor)
│
└── supabase/
    └── migrations/
        ├── 20251014214504_consolidate_mechanics_checklist_evidence_tables.sql
        ├── 20251014180312_fix_mechanics_checklist_unique_constraint.sql
        └── 20251014190405_add_category_to_mechanics_checklist.sql
```

---

## 🔄 Dependências entre Componentes

### V1: /checklist (Mecânica Hard-coded)

```
page.tsx
  ├─▶ useChecklistOrchestrator
  │     ├─▶ useChecklistForm
  │     ├─▶ useChecklistData
  │     ├─▶ useChecklistSubmit
  │     └─▶ useAnomalies
  │
  ├─▶ PartnerChecklistGroups
  │     └─▶ PartRequestCard (de dynamic-checklist!) ⚠️
  │
  └─▶ PartRequestModal (de dynamic-checklist!) ⚠️
        └─▶ usePartRequestModal (de dynamic-checklist!) ⚠️
```

### V2: /dynamic-checklist (Outras Categorias)

```
page.tsx
  ├─▶ usePartnerChecklist (wrapper)
  │     └─▶ useChecklistOrchestrator
  │           ├─▶ useChecklistForm
  │           ├─▶ useChecklistData
  │           ├─▶ useChecklistSubmit
  │           └─▶ useAnomalies
  │
  └─▶ Componentes locais:
        ├─▶ PartRequestModal
        ├─▶ PartRequestCard
        └─▶ usePartRequestModal
```

### V3: /checklist-v2 (Templates - Beta)

```
page.tsx
  ├─▶ useChecklistTemplate
  │     └─▶ /api/partner/checklist/init
  │
  └─▶ DynamicChecklistForm
        └─▶ Renderiza campos baseado em template JSON
```

---

## 🔀 Fluxo de Dados (Submit)

### Caminho dos Dados ao Salvar Checklist:

```
┌─────────────┐
│  Frontend   │
│  page.tsx   │
└──────┬──────┘
       │ onClick(save)
       ▼
┌─────────────────────┐
│ useChecklistSubmit  │
│ (hook)              │
└──────┬──────────────┘
       │ POST /api/partner/checklist/submit
       ▼
┌──────────────────────────┐
│ submit/route.ts          │
│ (API Route)              │
└──────┬───────────────────┘
       │ Chama controller
       ▼
┌──────────────────────────────┐
│ partnerChecklistController   │
│ (orquestrador)               │
└──────┬───────────────────────┘
       │
       ├─▶ mechanicsChecklistService
       │     └─▶ MechanicsChecklistRepository
       │           └─▶ INSERT/UPDATE no Supabase
       │
       └─▶ anomaliesService
             └─▶ AnomaliesRepository
                   └─▶ INSERT no Supabase
```

### Tabelas Afetadas:

```
┌────────────────────────┐
│ mechanics_checklist    │  ← Cabeçalho do checklist
└────────────────────────┘
           │
           ├─▶ ┌────────────────────────────┐
           │   │ mechanics_checklist_items  │  ← Items (status, notes)
           │   └────────────────────────────┘
           │
           └─▶ ┌─────────────────────────────────┐
               │ mechanics_checklist_evidences   │  ← Imagens (media_url)
               └─────────────────────────────────┘
```

---

## 🚨 Problema: Importações Cruzadas

### Dependência Problemática:

```
/checklist/page.tsx
    │
    ├─ IMPORTA
    │
    ▼
/dynamic-checklist/components/PartRequestModal.tsx
```

**Por que é ruim:**
- `/checklist` depende de `/dynamic-checklist`
- Se deletarmos `/dynamic-checklist` no futuro, `/checklist` quebra
- Dificulta refatoração

**Solução:**
```
Mover componentes compartilhados para local neutro:

/dynamic-checklist/components/PartRequestModal.tsx
                ↓
modules/partner/components/PartRequestModal.tsx
```

---

## 🎯 Estado Ideal (Após Consolidação)

### Arquitetura Desejada:

```
┌─────────────────────────────────────────────────────────────┐
│                 PARTNER CHECKLIST (UNIFICADO)               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  /dashboard/partner/checklist                      │    │
│  │  (baseado em templates, suporta TODAS categorias)  │    │
│  └────────────────────────────────────────────────────┘    │
│                           ↓                                  │
│          useChecklistOrchestrator (único)                   │
│                           ↓                                  │
│   ┌─────────────────┬─────────────────┬──────────────┐    │
│   │  Services       │  Repositories   │  Mappers     │    │
│   │  (lógica)       │  (DB access)    │  (transform) │    │
│   └─────────────────┴─────────────────┴──────────────┘    │
│                           ↓                                  │
│              ┌────────────────────────┐                     │
│              │ Supabase (PostgreSQL)  │                     │
│              └────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Benefícios:

✅ **1 página** em vez de 3  
✅ **1 hook** em vez de múltiplos wrappers  
✅ **Componentes centralizados** em `modules/`  
✅ **Templates no DB** (fácil modificar sem código)  
✅ **66% menos código** (~3000 → ~1000 linhas)

---

## 📊 Comparação: Antes vs Depois

### ANTES (Atual):

```
┌──────────┐   ┌──────────┐   ┌──────────┐
│ Checklist│   │ Dynamic  │   │Checklist │
│    V1    │   │Checklist │   │    V2    │
└──────────┘   └──────────┘   └──────────┘
     ↓              ↓              ↓
  Mecânica     Outros         Todos
  Hard-coded   Anomalies    Templates
  ✅ PROD      ✅ PROD       ⚠️  BETA
```

**Problemas:**
- ❌ 3 implementações
- ❌ Código duplicado
- ❌ Bugs em 3 lugares
- ❌ Features em 3 lugares

### DEPOIS (Ideal):

```
        ┌──────────────┐
        │  Checklist   │
        │  (Unificado) │
        └──────────────┘
               ↓
          Templates
          (todas categorias)
          ✅ PROD
```

**Benefícios:**
- ✅ 1 implementação
- ✅ Sem duplicação
- ✅ Bugs em 1 lugar
- ✅ Features em 1 lugar

---

## 🛠️ Roadmap de Migração

### Fase 1: Validação (1-2 semanas)
```
┌────────────────────────────────┐
│ Testar V2 para TODAS categorias│
│ ✓ Mecânica                     │
│ ✓ Funilaria                    │
│ ✓ Lavagem                      │
│ ✓ Pneus                        │
│ ✓ Loja                         │
│ ✓ Pátio                        │
└────────────────────────────────┘
```

### Fase 2: Migração Mecânica (1 semana)
```
/checklist (V1) ──────▶ /checklist-v2
                         (com templates)
```

### Fase 3: Migração Outras Categorias (1 semana)
```
/dynamic-checklist ──────▶ /checklist-v2
                           (com templates)
```

### Fase 4: Consolidação (1 semana)
```
/checklist-v2 ──────▶ /checklist
                      (renomear)

Deletar:
  ❌ /checklist (antigo V1)
  ❌ /dynamic-checklist
```

### Fase 5: Limpeza (ongoing)
```
✓ Extrair componentes compartilhados
✓ Renomear hooks duplicados
✓ Adicionar testes E2E
✓ Documentar arquitetura final
```

---

**Referências:**
- Documentação Completa: `docs/CHECKLIST_ENDPOINT_AUDIT.md`
- Resumo Executivo: `docs/CHECKLIST_EXECUTIVE_SUMMARY.md`
- Índice Geral: `docs/CHECKLIST_DOCUMENTATION_INDEX.md`
