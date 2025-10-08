# 🔍 Análise Comparativa: Especialista vs Parceiro - Timeline de Veículos

**Data:** 2025-01-09  
**Contexto:** Investigação do bug onde timeline não mostra "Fase Orçamentária Iniciada" quando parceiro inicia checklist

---

## 📋 **SUMÁRIO EXECUTIVO**

### **Problema Reportado:**
- Status do orçamento está sendo modificado, mas veículo não recebe o estado "Fase Orçamentária Iniciada" na timeline

### **Causa Raiz Identificada:**
1. **Trigger automático existe mas pode estar com comportamento inconsistente**
2. **Inconsistência de formatos entre código TypeScript e migrations SQL**
3. **Parceiro insere manualmente na `vehicle_history`, especialista depende do trigger**

### **Impacto:**
- ⚠️ Timeline incompleta para usuários finais
- ⚠️ Auditoria comprometida (falta rastreabilidade)
- ⚠️ Inconsistência arquitetural (dois padrões diferentes)

---

## 🏗️ **ARQUITETURA ATUAL**

### **Sistema de Timeline:**
```
┌─────────────────────────────────────────────────────────────┐
│                     Tabela: vehicles                         │
│  - id, plate, status, estimated_arrival_date, etc.          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ TRIGGER: vehicle_history_trigger
                   │ (AFTER INSERT OR UPDATE)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  Tabela: vehicle_history                     │
│  - id, vehicle_id, status, prevision_date, end_date         │
│  - Registro IMUTÁVEL de todas as mudanças de status         │
└─────────────────────────────────────────────────────────────┘
```

### **Migration Relevante:**
```sql
-- 20250929130000_create_vehicle_history_trigger.sql
CREATE OR REPLACE FUNCTION public.log_vehicle_history()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.vehicle_history (vehicle_id, status)
        VALUES (NEW.id, NEW.status);
    ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
        -- Insere novo registro de histórico
        INSERT INTO public.vehicle_history (...)
        VALUES (...);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔬 **ANÁLISE DETALHADA: ESPECIALISTA**

### **1. Start Analysis (Início da Análise)**

**Arquivo:** `/app/api/specialist/start-analysis/route.ts`

```typescript
export const POST = createVehicleActionHandler(async ({ vehicleId, supabase }) => {
  // 1. Valida status atual
  const { data: veh } = await supabase
    .from('vehicles')
    .select('status')
    .eq('id', vehicleId)
    .single();

  const current = String(veh.status || '').toUpperCase();
  const allowedPrev =
    current === VehicleStatus.CHEGADA_CONFIRMADA || 
    current === VehicleStatus.EM_ANALISE;

  if (!allowedPrev) {
    return { json: { error: 'Início de análise permitido apenas após Chegada Confirmada' }, status: 400 };
  }

  // 2. Atualiza SOMENTE a tabela vehicles
  const { error: updErr } = await supabase
    .from('vehicles')
    .update({ status: VehicleStatus.EM_ANALISE })  // 'EM ANÁLISE'
    .eq('id', vehicleId);

  // ❌ NÃO INSERE MANUALMENTE na vehicle_history
  // ✅ DEPENDE DO TRIGGER AUTOMÁTICO

  if (updErr) {
    return { json: { error: 'Erro ao iniciar análise' }, status: 500 };
  }

  return { json: { success: true }, status: 200 };
});
```

**Status Setado:**
- `VehicleStatus.EM_ANALISE` = `'EM ANÁLISE'`

**Como Timeline é Atualizada:**
- ✅ **Automático via Trigger** `vehicle_history_trigger`
- ⚠️ **Depende do trigger estar ativo e funcionando corretamente**

---

### **2. Finalize Checklist (Finalização da Análise)**

**Arquivo:** `/app/api/specialist/finalize-checklist/route.ts`

```typescript
export const POST = createVehicleActionHandler(async ({ vehicleId, supabase }) => {
  // 1. Finaliza a inspeção
  const { data: inspection } = await supabase
    .from('inspections')
    .update({ finalized: true })
    .eq('vehicle_id', vehicleId)
    .eq('finalized', false)
    .select('*')
    .single();

  // 2. Atualiza status do veículo
  await supabase
    .from('vehicles')
    .update({ status: VehicleStatus.ANALISE_FINALIZADA })  // 'ANALISE FINALIZADA'
    .eq('id', vehicleId);

  // 3. Cria service_orders e quotes (uma para cada categoria)
  // ... lógica de criação de ordens de serviço

  // ❌ NÃO INSERE MANUALMENTE na vehicle_history
  // ✅ DEPENDE DO TRIGGER AUTOMÁTICO

  return { json: { success: true }, status: 200 };
});
```

**Status Setado:**
- `VehicleStatus.ANALISE_FINALIZADA` = `'ANALISE FINALIZADA'`

**Como Timeline é Atualizada:**
- ✅ **Automático via Trigger** `vehicle_history_trigger`

---

### **📊 Resumo Especialista:**

| Endpoint | Status Setado | Timeline Atualizada? | Método |
|----------|---------------|----------------------|--------|
| `/specialist/start-analysis` | `'EM ANÁLISE'` | ✅ Via Trigger | Automático |
| `/specialist/finalize-checklist` | `'ANALISE FINALIZADA'` | ✅ Via Trigger | Automático |

**❌ PROBLEMA:** Se trigger não disparar ou formato estiver errado, timeline não é atualizada!

---

## 🔬 **ANÁLISE DETALHADA: PARCEIRO**

### **1. Checklist Init (Início da Fase Orçamentária)**

**Arquivo:** `/app/api/partner/checklist/init/route.ts`

```typescript
async function initChecklistHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  const { vehicleId } = await req.json();

  // 1. Busca categoria do parceiro
  const { data: categoryData } = await supabase
    .rpc('get_partner_categories', { partner_uuid: req.userId })
    .single();

  const timelineStatus = categoryData?.tipo === 'mecanica' 
    ? 'EM ORÇAMENTAÇÃO - MECÂNICA' 
    : 'EM ORÇAMENTAÇÃO - FUNILARIA/PINTURA';

  // 2. Verifica se já existe registro na timeline
  const { data: existingHistory } = await supabase
    .from('vehicle_history')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('status', timelineStatus)
    .maybeSingle();

  // 3. INSERE MANUALMENTE na vehicle_history (SE NÃO EXISTIR)
  if (!existingHistory) {
    const { error: historyError } = await supabase
      .from('vehicle_history')
      .insert({
        vehicle_id: vehicleId,
        status: timelineStatus,  // Status ESPECÍFICO do parceiro
        prevision_date: null,
        end_date: null,
        created_at: new Date().toISOString(),
      });

    if (historyError) {
      logger.error('history_insert_error', { error: historyError.message });
      // ⚠️ Não falha a request, apenas loga o erro
    }
  }

  // 4. Atualiza status do veículo (SE necessário)
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('status')
    .eq('id', vehicleId)
    .single();

  const currentStatus = vehicle?.status;
  const shouldUpdate = ['Em Análise', 'Análise Finalizada', 'Aguardando Análise'].includes(currentStatus);

  if (shouldUpdate) {
    await supabase
      .from('vehicles')
      .update({ status: 'EM ORÇAMENTAÇÃO' })
      .eq('id', vehicleId);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
```

**Status na Timeline:**
- `'EM ORÇAMENTAÇÃO - MECÂNICA'` ou
- `'EM ORÇAMENTAÇÃO - FUNILARIA/PINTURA'`

**Como Timeline é Atualizada:**
- ✅ **Manual via INSERT direto na `vehicle_history`**
- ✅ **Idempotente** (verifica se já existe antes de inserir)
- ⚠️ **NÃO depende do trigger**

---

### **2. Save Vehicle Checklist (Salvar Checklist do Parceiro)**

**Arquivo:** `/app/api/partner/save-vehicle-checklist/route.ts`

```typescript
async function saveVehicleChecklistHandler(req: AuthenticatedRequest) {
  // 1. Valida status do veículo
  const validStatuses = [
    VehicleStatus.EM_ANALISE,          // 'EM ANÁLISE'
    VehicleStatus.ANALISE_FINALIZADA,  // 'ANALISE FINALIZADA'
    'EM ORÇAMENTAÇÃO'
  ];

  if (!validStatuses.includes(vehicle.status)) {
    return NextResponse.json(
      { error: 'Status do veículo não permite checklist neste momento' },
      { status: 400 }
    );
  }

  // 2. Atualiza dados do veículo
  if (!body.isDraft) {
    await supabase
      .from('vehicles')
      .update({
        current_odometer: body.odometer,
        fuel_level: body.fuelLevel,
        status: VehicleStatus.EM_ANALISE,  // 'EM ANÁLISE'
      })
      .eq('id', vehicleId);
  }

  // ❌ NÃO INSERE na vehicle_history
  // ✅ DEPENDE DO TRIGGER AUTOMÁTICO (se atualizar status)

  return NextResponse.json({ success: true, inspectionId }, { status: 200 });
}
```

**Status Setado:**
- `VehicleStatus.EM_ANALISE` = `'EM ANÁLISE'`

**Como Timeline é Atualizada:**
- ✅ **Automático via Trigger** (se status mudar)
- ⚠️ Apenas quando `!body.isDraft` (não é rascunho)

---

### **📊 Resumo Parceiro:**

| Endpoint | Status Setado | Timeline Atualizada? | Método |
|----------|---------------|----------------------|--------|
| `/partner/checklist/init` | `'EM ORÇAMENTAÇÃO - MECÂNICA'` ou `'EM ORÇAMENTAÇÃO - FUNILARIA/PINTURA'` | ✅ Manual (INSERT direto) | Manual + Idempotente |
| `/partner/save-vehicle-checklist` | `'EM ANÁLISE'` | ✅ Via Trigger | Automático |

**✅ VANTAGEM:** Insert manual garante que timeline SEMPRE é atualizada, mesmo se trigger falhar!

---

## ⚖️ **COMPARAÇÃO: ESPECIALISTA vs PARCEIRO**

### **Abordagem de Timeline:**

| Aspecto | Especialista | Parceiro |
|---------|--------------|----------|
| **Método** | Trigger automático | INSERT manual + Trigger |
| **Confiabilidade** | ⚠️ Depende 100% do trigger | ✅ Garantido por INSERT explícito |
| **Idempotência** | ✅ Trigger previne duplicatas | ✅ Verifica antes de inserir |
| **Status Específicos** | Status genéricos | Status específicos por categoria |
| **Tratamento de Erro** | ❌ Não trata (trigger silencioso) | ✅ Loga erros (mas não falha request) |
| **Arquitetura** | Declarativa (via DB) | Imperativa (via código) |

---

## 🚨 **INCONSISTÊNCIAS IDENTIFICADAS**

### **1. PROBLEMA CRÍTICO: Formato de Status Inconsistente**

#### **No Código TypeScript:**
```typescript
// /modules/vehicles/constants/vehicleStatus.ts
export const VehicleStatus = {
  EM_ANALISE: 'EM ANÁLISE',              // ✅ Com acento
  ANALISE_FINALIZADA: 'ANALISE FINALIZADA',  // ❌ SEM acento
  // ...
};
```

#### **Na Migration de Padronização:**
```sql
-- /supabase/migrations/20250902200000_standardize_vehicle_status.sql
UPDATE vehicles
SET status = 'Análise Finalizada'  -- ✅ COM acento
WHERE status = 'ANALISE_FINALIZADA';  -- Era sem acento
```

#### **No Trigger:**
```sql
-- /supabase/migrations/20250929130000_create_vehicle_history_trigger.sql
IF v_prevision_date IS NULL AND NEW.status NOT IN ('EM ANÁLISE', 'ANALISE FINALIZADA') THEN
    v_prevision_date := v_previous_prevision_date;
END IF;
```

**📌 CONSEQUÊNCIA:**
- Código seta `'ANALISE FINALIZADA'` (sem acento)
- Migration tenta converter para `'Análise Finalizada'` (com acento)
- Trigger espera `'ANALISE FINALIZADA'` (sem acento)
- **RESULTADO:** Possível mismatch que impede trigger de funcionar corretamente!

---

### **2. PROBLEMA: Dois Padrões Arquiteturais Diferentes**

#### **Padrão 1: Trigger Automático (Especialista)**
```typescript
// Atualiza vehicles → Trigger cria vehicle_history automaticamente
await supabase
  .from('vehicles')
  .update({ status: newStatus })
  .eq('id', vehicleId);
```

**Vantagens:**
- ✅ Menos código para manter
- ✅ Lógica centralizada no banco
- ✅ Garantia de consistência (se trigger funcionar)

**Desvantagens:**
- ❌ Difícil debugar (trigger é "invisível")
- ❌ Sem tratamento de erros no código
- ❌ Depende 100% do trigger estar ativo

#### **Padrão 2: INSERT Manual (Parceiro)**
```typescript
// Primeiro: Insere manualmente na vehicle_history
await supabase.from('vehicle_history').insert({
  vehicle_id: vehicleId,
  status: timelineStatus,
  // ...
});

// Depois: Atualiza vehicles
await supabase
  .from('vehicles')
  .update({ status: newStatus })
  .eq('id', vehicleId);
```

**Vantagens:**
- ✅ Explícito e fácil de debugar
- ✅ Tratamento de erros no código
- ✅ Não depende do trigger
- ✅ Permite status específicos (não genéricos)

**Desvantagens:**
- ❌ Mais código para manter
- ❌ Risco de esquecer de atualizar timeline em novos endpoints
- ❌ Lógica duplicada (se trigger também disparar)

---

### **3. PROBLEMA: Status Não Padronizados**

#### **Status Definidos em `vehicleStatus.ts`:**
```typescript
AGUARDANDO_COLETA: 'AGUARDANDO COLETA'
AGUARDANDO_CHEGADA: 'AGUARDANDO CHEGADA DO VEÍCULO'
CHEGADA_CONFIRMADA: 'CHEGADA CONFIRMADA'
EM_ANALISE: 'EM ANÁLISE'
ANALISE_FINALIZADA: 'ANALISE FINALIZADA'  // ❌ SEM acento
ORCAMENTO_APROVADO: 'Orçamento Aprovado'  // ❌ Formato diferente (Title Case)
FASE_EXECUCAO_INICIADA: 'FASE DE EXECUÇÃO INICIADA'
```

#### **Status Usados no Código mas NÃO Definidos:**
- `'EM ORÇAMENTAÇÃO'` (parceiro)
- `'EM ORÇAMENTAÇÃO - MECÂNICA'` (timeline parceiro)
- `'EM ORÇAMENTAÇÃO - FUNILARIA/PINTURA'` (timeline parceiro)
- `'PONTO DE COLETA SELECIONADO'` (admin)
- `'AGUARDANDO APROVAÇÃO DO ORÇAMENTO'` (contadores admin)

**📌 CONSEQUÊNCIA:**
- ⚠️ Impossível validar status com TypeScript
- ⚠️ Risco de typos não detectados
- ⚠️ Dificulta manutenção e refactoring

---

## 🔍 **VIOLAÇÕES DAS DEVELOPMENT_INSTRUCTIONS**

### **1. Violação do Princípio DRY (Don't Repeat Yourself)**

#### **Lógica de Atualização de Status Duplicada:**
```typescript
// Especialista: start-analysis/route.ts
await supabase
  .from('vehicles')
  .update({ status: VehicleStatus.EM_ANALISE })
  .eq('id', vehicleId);

// Especialista: finalize-checklist/route.ts
await supabase
  .from('vehicles')
  .update({ status: VehicleStatus.ANALISE_FINALIZADA })
  .eq('id', vehicleId);

// Parceiro: save-vehicle-checklist/route.ts
await supabase
  .from('vehicles')
  .update({
    current_odometer: body.odometer,
    fuel_level: body.fuelLevel,
    status: VehicleStatus.EM_ANALISE,
  })
  .eq('id', vehicleId);

// Parceiro: checklist/init/route.ts
await supabase
  .from('vehicles')
  .update({ status: 'EM ORÇAMENTAÇÃO' })
  .eq('id', vehicleId);
```

**❌ PROBLEMA:** Lógica de atualização de status espalhada por múltiplos arquivos sem abstração comum.

**✅ SOLUÇÃO:** Criar serviço centralizado:
```typescript
// /modules/vehicles/services/vehicleStatusService.ts
export async function updateVehicleStatus(
  supabase: SupabaseClient,
  vehicleId: string,
  newStatus: VehicleStatus,
  timelineNote?: string
) {
  // 1. Valida transição de status
  // 2. Atualiza vehicles
  // 3. Insere em vehicle_history (se necessário)
  // 4. Retorna resultado
}
```

---

### **2. Violação do Princípio SOLID (Single Responsibility)**

#### **Endpoint com Múltiplas Responsabilidades:**
```typescript
// /app/api/specialist/finalize-checklist/route.ts
export const POST = createVehicleActionHandler(async ({ vehicleId, supabase }) => {
  // Responsabilidade 1: Finalizar inspeção
  await supabase.from('inspections').update({ finalized: true })...

  // Responsabilidade 2: Atualizar status do veículo
  await supabase.from('vehicles').update({ status: VehicleStatus.ANALISE_FINALIZADA })...

  // Responsabilidade 3: Criar service_orders
  const categoriesNeeded = [...];
  for (const cat of categoriesNeeded) {
    await supabase.from('service_orders').insert({...});
    
    // Responsabilidade 4: Criar quotes
    await supabase.from('quotes').insert({...});
  }

  return { json: { success: true }, status: 200 };
});
```

**❌ PROBLEMA:** Um único endpoint faz:
1. Finaliza inspeção
2. Atualiza status do veículo
3. Cria service_orders
4. Cria quotes

**✅ SOLUÇÃO:** Separar em serviços:
```typescript
// /modules/inspections/services/inspectionService.ts
export async function finalizeInspection(inspectionId: string) { ... }

// /modules/vehicles/services/vehicleStatusService.ts
export async function updateVehicleStatus(vehicleId: string, newStatus: VehicleStatus) { ... }

// /modules/service-orders/services/serviceOrderService.ts
export async function createServiceOrdersFromInspection(inspectionId: string) { ... }
```

---

### **3. Violação do Princípio Object Calisthenics (Complexidade)**

#### **Código com Múltiplos Níveis de Indentação:**
```typescript
// /app/api/partner/checklist/init/route.ts (linhas 40-90)
async function initChecklistHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const { vehicleId } = await req.json();
    
    if (!vehicleId) {
      logger.warn('missing_vehicle_id', { requestId });
      return NextResponse.json({ error: 'vehicleId é obrigatório' }, { status: 400 });
    }

    const { data: categoryData } = await supabase.rpc('get_partner_categories', {...});

    if (categoryError || !categoryData) {
      logger.error('category_fetch_error', { error: categoryError });
      return NextResponse.json({ error: 'Erro ao buscar categoria do parceiro' }, { status: 500 });
    }

    const timelineStatus = categoryData?.tipo === 'mecanica' 
      ? 'EM ORÇAMENTAÇÃO - MECÂNICA' 
      : 'EM ORÇAMENTAÇÃO - FUNILARIA/PINTURA';

    const { data: existingHistory } = await supabase.from('vehicle_history').select('*')...;

    if (!existingHistory) {
      const { error: historyError } = await supabase.from('vehicle_history').insert({...});

      if (historyError) {
        logger.error('history_insert_error', { error: historyError.message });
      } else {
        logger.info('history_created', {...});
      }
    } else {
      logger.info('history_already_exists', {...});
    }

    const { data: vehicle } = await supabase.from('vehicles').select('status')...;

    if (vehicle) {
      const currentStatus = vehicle.status;
      const shouldUpdate = ['Em Análise', 'Análise Finalizada', 'Aguardando Análise'].includes(currentStatus);

      if (shouldUpdate) {
        const { error: updateError } = await supabase.from('vehicles').update({...});

        if (updateError) {
          logger.error('vehicle_status_update_error', {...});
        } else {
          logger.info('vehicle_status_updated', {...});
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // ...
  }
}
```

**❌ PROBLEMA:** 
- 5+ níveis de indentação
- Função com 50+ linhas
- Múltiplas responsabilidades misturadas

**✅ SOLUÇÃO:** Quebrar em funções menores:
```typescript
async function getPartnerCategory(supabase, partnerId) { ... }
async function ensureTimelineEntry(supabase, vehicleId, status) { ... }
async function updateVehicleStatusIfNeeded(supabase, vehicleId, allowedStatuses) { ... }

async function initChecklistHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  const { vehicleId } = await req.json();
  
  const category = await getPartnerCategory(supabase, req.userId);
  const timelineStatus = getTimelineStatus(category);
  
  await ensureTimelineEntry(supabase, vehicleId, timelineStatus);
  await updateVehicleStatusIfNeeded(supabase, vehicleId, ALLOWED_STATUSES);

  return NextResponse.json({ success: true }, { status: 200 });
}
```

---

### **4. Violação da Arquitetura Modular**

#### **Mistura de Responsabilidades entre Módulos:**
```
/app/api/
  ├── specialist/
  │   ├── start-analysis/route.ts       # Atualiza vehicles diretamente
  │   └── finalize-checklist/route.ts   # Cria service_orders e quotes diretamente
  └── partner/
      ├── checklist/init/route.ts       # Insere em vehicle_history diretamente
      └── save-vehicle-checklist/route.ts  # Atualiza vehicles diretamente
```

**❌ PROBLEMA:** 
- Lógica de domínio (vehicles, history) misturada com camada de API
- Sem camada de serviços clara
- Dificulta testes unitários

**✅ SOLUÇÃO:** Estrutura modular:
```
/modules/
  ├── vehicles/
  │   ├── services/
  │   │   ├── vehicleService.ts       # CRUD de vehicles
  │   │   └── vehicleStatusService.ts # Lógica de transições
  │   ├── repositories/
  │   │   └── vehicleRepository.ts    # Acesso ao banco
  │   └── constants/
  │       └── vehicleStatus.ts
  ├── vehicle-history/
  │   ├── services/
  │   │   └── vehicleHistoryService.ts
  │   └── repositories/
  │       └── vehicleHistoryRepository.ts
  └── inspections/
      ├── services/
      │   └── inspectionService.ts
      └── repositories/
          └── inspectionRepository.ts

/app/api/
  ├── specialist/
  │   ├── start-analysis/route.ts     # Chama vehicleStatusService
  │   └── finalize-checklist/route.ts # Chama inspectionService
  └── partner/
      └── checklist/init/route.ts     # Chama vehicleHistoryService
```

---

## 🛠️ **ANÁLISE DE COMPLEXIDADE**

### **Arquivos com Complexidade Desnecessária:**

#### **1. `/app/api/partner/checklist/init/route.ts`**
- **Linhas:** ~110
- **Complexidade Ciclomática:** Alta (6+ paths)
- **Problemas:**
  - ❌ Lógica de negócio misturada com tratamento de request
  - ❌ Múltiplas validações inline
  - ❌ Sem abstração de serviços

#### **2. `/app/api/specialist/finalize-checklist/route.ts`**
- **Linhas:** ~100
- **Complexidade Ciclomática:** Muito Alta (10+ paths)
- **Problemas:**
  - ❌ Cria service_orders E quotes no mesmo endpoint
  - ❌ Loop com múltiplas chamadas ao banco
  - ❌ Lógica de categorias hardcoded

#### **3. `/app/api/partner/save-vehicle-checklist/route.ts`**
- **Linhas:** ~260
- **Complexidade Ciclomática:** Extremamente Alta (15+ paths)
- **Problemas:**
  - ❌ Gerencia inspection, vehicle, checklist_history, images tudo junto
  - ❌ Lógica de draft vs final misturada
  - ❌ Validações complexas inline
  - ❌ Sem separação de concerns

---

## 📊 **MÉTRICAS DE CÓDIGO**

| Arquivo | LOC | Complexidade | Responsabilidades | Recomendação |
|---------|-----|--------------|-------------------|--------------|
| `partner/checklist/init/route.ts` | 110 | Alta (6+) | 4 | 🔴 Refatorar |
| `specialist/finalize-checklist/route.ts` | 100 | Muito Alta (10+) | 5 | 🔴 Refatorar |
| `partner/save-vehicle-checklist/route.ts` | 260 | Extrema (15+) | 7+ | 🔴 **URGENTE** |
| `specialist/start-analysis/route.ts` | 30 | Baixa (2) | 2 | 🟢 OK |

---

## 🎯 **RECOMENDAÇÕES**

### **1. CURTO PRAZO (Hotfix):**

#### **a) Padronizar Formato de Status**
```typescript
// modules/vehicles/constants/vehicleStatus.ts
export const VehicleStatus = {
  EM_ANALISE: 'EM ANÁLISE',              // ✅ Já está correto
  ANALISE_FINALIZADA: 'ANÁLISE FINALIZADA',  // ✅ Adicionar acento
  // ...
};
```

#### **b) Atualizar Migration SQL**
```sql
-- nova migration: 20250109_fix_status_format.sql
UPDATE vehicles
SET status = 'ANÁLISE FINALIZADA'  -- Com acento
WHERE status = 'ANALISE FINALIZADA';  -- Sem acento

UPDATE vehicle_history
SET status = 'ANÁLISE FINALIZADA'
WHERE status = 'ANALISE FINALIZADA';
```

#### **c) Verificar Trigger**
```sql
-- Script de diagnóstico
SELECT 
  trigger_name, 
  event_object_table, 
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'vehicle_history_trigger';
```

---

### **2. MÉDIO PRAZO (Refactoring):**

#### **a) Criar Serviço de Status de Veículo**
```typescript
// /modules/vehicles/services/vehicleStatusService.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { VehicleStatus } from '../constants/vehicleStatus';
import { logger } from '@/modules/logger';

interface StatusTransition {
  from: VehicleStatus | VehicleStatus[];
  to: VehicleStatus;
  allowedRoles: string[];
}

const STATUS_TRANSITIONS: StatusTransition[] = [
  {
    from: [VehicleStatus.CHEGADA_CONFIRMADA, VehicleStatus.EM_ANALISE],
    to: VehicleStatus.EM_ANALISE,
    allowedRoles: ['specialist'],
  },
  {
    from: VehicleStatus.EM_ANALISE,
    to: VehicleStatus.ANALISE_FINALIZADA,
    allowedRoles: ['specialist'],
  },
  // ...
];

export async function updateVehicleStatus(
  supabase: SupabaseClient,
  vehicleId: string,
  newStatus: VehicleStatus,
  userId: string,
  userRole: string,
  options?: {
    skipValidation?: boolean;
    createHistoryEntry?: boolean;
    historyNote?: string;
  }
) {
  try {
    // 1. Busca status atual
    const { data: vehicle, error: fetchError } = await supabase
      .from('vehicles')
      .select('status')
      .eq('id', vehicleId)
      .single();

    if (fetchError || !vehicle) {
      throw new Error('Veículo não encontrado');
    }

    const currentStatus = vehicle.status as VehicleStatus;

    // 2. Valida transição (se não pulou validação)
    if (!options?.skipValidation) {
      const transition = STATUS_TRANSITIONS.find(
        (t) => t.to === newStatus && t.allowedRoles.includes(userRole)
      );

      if (!transition) {
        throw new Error(`Transição para ${newStatus} não permitida para role ${userRole}`);
      }

      const fromStatuses = Array.isArray(transition.from) ? transition.from : [transition.from];
      if (!fromStatuses.includes(currentStatus)) {
        throw new Error(
          `Transição de ${currentStatus} para ${newStatus} não permitida`
        );
      }
    }

    // 3. Atualiza status do veículo
    const { error: updateError } = await supabase
      .from('vehicles')
      .update({ status: newStatus })
      .eq('id', vehicleId);

    if (updateError) {
      throw new Error(`Erro ao atualizar status: ${updateError.message}`);
    }

    // 4. Cria entrada na timeline (se solicitado E trigger não estiver ativo)
    if (options?.createHistoryEntry) {
      await createVehicleHistoryEntry(supabase, vehicleId, newStatus, options.historyNote);
    }

    logger.info('vehicle_status_updated', {
      vehicleId: vehicleId.slice(0, 8),
      from: currentStatus,
      to: newStatus,
      userId: userId.slice(0, 8),
      userRole,
    });

    return { success: true, previousStatus: currentStatus, newStatus };
  } catch (error) {
    logger.error('vehicle_status_update_failed', {
      vehicleId: vehicleId.slice(0, 8),
      newStatus,
      error: (error as Error).message,
    });
    throw error;
  }
}

async function createVehicleHistoryEntry(
  supabase: SupabaseClient,
  vehicleId: string,
  status: VehicleStatus,
  note?: string
) {
  const { error } = await supabase.from('vehicle_history').insert({
    vehicle_id: vehicleId,
    status,
    note,
    created_at: new Date().toISOString(),
  });

  if (error) {
    logger.error('vehicle_history_insert_failed', { error: error.message });
    // Não falha a operação principal
  }
}
```

#### **b) Refatorar Endpoints para Usar Serviço**
```typescript
// /app/api/specialist/start-analysis/route.ts
import { updateVehicleStatus } from '@/modules/vehicles/services/vehicleStatusService';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';

export const POST = createVehicleActionHandler(async ({ vehicleId, supabase, req }) => {
  try {
    await updateVehicleStatus(
      supabase,
      vehicleId,
      VehicleStatus.EM_ANALISE,
      req.userId,
      'specialist'
    );

    return { json: { success: true }, status: 200 };
  } catch (error) {
    return {
      json: { error: (error as Error).message },
      status: 400,
    };
  }
});
```

---

### **3. LONGO PRAZO (Arquitetura):**

#### **a) Implementar Event Sourcing para Timeline**
```typescript
// /modules/vehicle-events/services/vehicleEventService.ts
import { EventType, VehicleEvent } from '../types';

export async function emitVehicleEvent(
  supabase: SupabaseClient,
  event: VehicleEvent
) {
  // 1. Insere evento na tabela de eventos
  const { data: eventData, error: eventError } = await supabase
    .from('vehicle_events')
    .insert({
      vehicle_id: event.vehicleId,
      event_type: event.type,
      event_data: event.data,
      user_id: event.userId,
      user_role: event.userRole,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (eventError) {
    throw new Error(`Erro ao emitir evento: ${eventError.message}`);
  }

  // 2. Processa evento (atualiza vehicle, vehicle_history, etc.)
  await processVehicleEvent(supabase, eventData);

  return eventData;
}

async function processVehicleEvent(supabase: SupabaseClient, event: any) {
  switch (event.event_type) {
    case EventType.STATUS_CHANGED:
      await handleStatusChange(supabase, event);
      break;
    case EventType.INSPECTION_FINALIZED:
      await handleInspectionFinalized(supabase, event);
      break;
    // ...
  }
}
```

#### **b) Criar Camada de Repository**
```typescript
// /modules/vehicles/repositories/vehicleRepository.ts
export class VehicleRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(vehicleId: string) {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateStatus(vehicleId: string, status: VehicleStatus) {
    const { error } = await this.supabase
      .from('vehicles')
      .update({ status })
      .eq('id', vehicleId);

    if (error) throw new Error(error.message);
  }

  // ...
}
```

---

## 📝 **CHECKLIST DE CORREÇÕES**

### **Imediato (Hotfix):**
- [ ] Padronizar formato de status (`'ANÁLISE FINALIZADA'` com acento)
- [ ] Criar migration para corrigir dados existentes
- [ ] Atualizar trigger SQL para usar formatos corretos
- [ ] Testar trigger manualmente no banco

### **Curto Prazo (1-2 sprints):**
- [ ] Criar `vehicleStatusService.ts`
- [ ] Refatorar `/specialist/start-analysis` para usar serviço
- [ ] Refatorar `/specialist/finalize-checklist` para usar serviço
- [ ] Refatorar `/partner/checklist/init` para usar serviço
- [ ] Adicionar testes unitários para serviço de status

### **Médio Prazo (2-4 sprints):**
- [ ] Separar responsabilidades de `/specialist/finalize-checklist`
- [ ] Criar `inspectionService.ts`
- [ ] Criar `serviceOrderService.ts`
- [ ] Refatorar `/partner/save-vehicle-checklist` (260 linhas → ~80 linhas)
- [ ] Implementar camada de repository

### **Longo Prazo (Backlog):**
- [ ] Implementar Event Sourcing para vehicle events
- [ ] Criar máquina de estados para transições de status
- [ ] Implementar webhooks para notificações de mudança de status
- [ ] Dashboard de auditoria completo

---

## 🎯 **CONCLUSÃO**

### **Estado Atual:**
- ⚠️ **Trigger existe mas pode estar falhando** devido a inconsistência de formatos
- ⚠️ **Dois padrões arquiteturais diferentes** (trigger vs insert manual)
- ⚠️ **Violações de DRY, SOLID e Object Calisthenics**
- ⚠️ **Complexidade desnecessária** em vários endpoints

### **Causa Raiz do Bug Reportado:**
1. **Ordem de chamadas errada** no hook `usePartnerChecklist` (✅ JÁ CORRIGIDO)
2. **Formato de status inconsistente** entre código e migrations (⚠️ PRECISA CORREÇÃO)
3. **Trigger pode não estar disparando** para alguns casos (⚠️ PRECISA INVESTIGAÇÃO)

### **Próximos Passos:**
1. ✅ **Padronizar formatos de status** (hotfix urgente)
2. ✅ **Verificar trigger no banco de produção** (diagnóstico)
3. ✅ **Criar serviço centralizado** (refactoring médio prazo)
4. ✅ **Reduzir complexidade** dos endpoints (refactoring médio prazo)

---

**Documento criado em:** 2025-01-09  
**Próxima revisão:** Após implementação do hotfix
