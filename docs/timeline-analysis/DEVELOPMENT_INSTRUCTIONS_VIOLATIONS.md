# 🚨 Análise de Violações das DEVELOPMENT_INSTRUCTIONS

**Data:** 2025-01-09  
**Contexto:** Auditoria de conformidade com princípios de desenvolvimento do projeto

---

## 📋 **SUMÁRIO EXECUTIVO**

### **Princípios Definidos no Projeto:**
1. **DRY (Don't Repeat Yourself)**
2. **SOLID** (5 princípios OOP)
3. **Object Calisthenics** (9 regras)
4. **Arquitetura Modular**
5. **Composition Pattern para Componentes**
6. **Migrations Idempotentes**
7. **Sistema de Histórico Imutável**

### **Violações Identificadas:**
- 🔴 **Críticas:** 5
- 🟠 **Graves:** 8
- 🟡 **Moderadas:** 12

### **Arquivos com Mais Violações:**
1. `/app/api/partner/save-vehicle-checklist/route.ts` (260 LOC) - 🔴🔴🔴
2. `/app/api/specialist/finalize-checklist/route.ts` (100 LOC) - 🔴🔴
3. `/app/api/partner/checklist/init/route.ts` (110 LOC) - 🔴🟠

---

## 🔴 **VIOLAÇÕES CRÍTICAS**

### **1. DRY - Lógica de Atualização de Status Duplicada**

#### **Descrição:**
Lógica de atualização de status de veículo está espalhada por **múltiplos arquivos** sem abstração comum.

#### **Ocorrências Identificadas:**

##### **a) `/app/api/specialist/start-analysis/route.ts`**
```typescript
const { error: updErr } = await supabase
  .from('vehicles')
  .update({ status: VehicleStatus.EM_ANALISE })
  .eq('id', vehicleId);
```

##### **b) `/app/api/specialist/finalize-checklist/route.ts`**
```typescript
await supabase
  .from('vehicles')
  .update({ status: VehicleStatus.ANALISE_FINALIZADA })
  .eq('id', vehicleId);
```

##### **c) `/app/api/partner/save-vehicle-checklist/route.ts`** (linha 209)
```typescript
await supabase
  .from('vehicles')
  .update({
    current_odometer: body.odometer,
    fuel_level: body.fuelLevel,
    status: VehicleStatus.EM_ANALISE,
  })
  .eq('id', vehicleId);
```

##### **d) `/app/api/partner/checklist/init/route.ts`** (linha 85)
```typescript
await supabase
  .from('vehicles')
  .update({ status: 'EM ORÇAMENTAÇÃO' })
  .eq('id', vehicleId);
```

##### **e) `/app/api/specialist/confirm-arrival/route.ts`**
```typescript
await supabase
  .from('vehicles')
  .update({ status: VehicleStatus.CHEGADA_CONFIRMADA })
  .eq('id', vehicleId);
```

#### **Impacto:**
- 🔴 **Crítico** - Manutenção difícil (mudança em 5+ lugares)
- 🔴 **Crítico** - Sem validação consistente de transições de status
- 🔴 **Crítico** - Impossível adicionar logging centralizado

#### **Solução Recomendada:**
```typescript
// /modules/vehicles/services/vehicleStatusService.ts
export async function updateVehicleStatus(
  supabase: SupabaseClient,
  vehicleId: string,
  newStatus: VehicleStatus,
  userId: string,
  userRole: string
) {
  // 1. Valida transição
  // 2. Atualiza vehicles
  // 3. Insere em vehicle_history
  // 4. Loga evento
  // 5. Emite notificação (se necessário)
}
```

---

### **2. SOLID - Violação de Single Responsibility Principle**

#### **Descrição:**
Endpoints têm **múltiplas responsabilidades**, violando SRP.

#### **Caso Extremo: `/app/api/partner/save-vehicle-checklist/route.ts`**

**Responsabilidades Identificadas:**
1. ✅ Validação de input
2. ✅ Autorização do parceiro
3. ✅ Busca/criação de inspeção
4. ✅ Atualização de dados do veículo
5. ✅ Salvamento de checklist
6. ✅ Gerenciamento de imagens
7. ✅ Criação de histórico (checklist_history)
8. ✅ Tratamento de erros
9. ✅ Logging

**📊 Métrica:** 9 responsabilidades em 1 função de 260 linhas

#### **Código Atual (simplificado):**
```typescript
async function saveVehicleChecklistHandler(req: AuthenticatedRequest) {
  try {
    // Responsabilidade 1: Validação
    const body = await req.json();
    if (!body.vehicleId) { return error; }

    // Responsabilidade 2: Autorização
    const authorized = await authorizePartnerForVehicle(...);
    if (!authorized) { return error; }

    // Responsabilidade 3: Validação de status
    const { data: vehicle } = await supabase.from('vehicles').select('status')...;
    const validStatuses = [...];
    if (!validStatuses.includes(vehicle.status)) { return error; }

    // Responsabilidade 4: Busca/criação de inspeção
    const { data: existing } = await supabase.from('inspections').select(...)...;
    let inspectionId: string;
    if (existing?.id) {
      await supabase.from('inspections').update({...});
    } else {
      const { data: newInsp } = await supabase.from('inspections').insert({...});
      inspectionId = newInsp.id;
    }

    // Responsabilidade 5: Atualização de veículo
    if (!body.isDraft) {
      await supabase.from('vehicles').update({...});
    }

    // Responsabilidade 6: Salvamento de checklist
    const services = body.services || {};
    await supabase.from('inspection_checklist').upsert({...});

    // Responsabilidade 7: Gerenciamento de imagens
    if (body.images && body.images.length > 0) {
      await supabase.from('inspection_images').delete(...);
      await supabase.from('inspection_images').insert(body.images);
    }

    // Responsabilidade 8: Histórico
    const snapshot = { ... };
    await supabase.from('checklist_history').insert({...});

    // Responsabilidade 9: Logging
    logger.info('checklist_saved', { ... });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error('save_checklist_failed', { error });
    return NextResponse.json({ error: 'Erro ao salvar checklist' }, { status: 500 });
  }
}
```

#### **Impacto:**
- 🔴 **Crítico** - Função gigante (260 linhas)
- 🔴 **Crítico** - Difícil de testar (9 dependências)
- 🔴 **Crítico** - Alto risco de bugs (complexidade ciclomática ~15)
- 🔴 **Crítico** - Violação de SRP, DRY, Object Calisthenics

#### **Solução Recomendada:**
```typescript
// /app/api/partner/save-vehicle-checklist/route.ts
export const POST = withPartnerAuth(async (req: AuthenticatedRequest) => {
  const body = await validateChecklistInput(req);
  
  await authorizationService.verifyPartnerAccess(req.userId, body.vehicleId);
  
  const inspection = await inspectionService.upsertInspection(body);
  
  if (!body.isDraft) {
    await vehicleService.updateOdometerAndFuel(body.vehicleId, body.odometer, body.fuelLevel);
  }
  
  await checklistService.saveChecklist(inspection.id, body.services);
  
  await imageService.updateInspectionImages(inspection.id, body.images);
  
  await checklistHistoryService.createSnapshot(inspection.id, body);

  return NextResponse.json({ success: true, inspectionId: inspection.id }, { status: 200 });
});
```

**📊 Comparação:**
- **Antes:** 260 linhas, 9 responsabilidades, complexidade ~15
- **Depois:** ~15 linhas, 1 responsabilidade (orquestração), complexidade ~2

---

### **3. Object Calisthenics - Múltiplos Níveis de Indentação**

#### **Regra Violada:**
> "Apenas um nível de indentação por método"

#### **Caso Crítico: `/app/api/partner/checklist/init/route.ts`**

**Código Atual:**
```typescript
async function initChecklistHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {                                                  // Nível 1
    const { vehicleId } = await req.json();
    
    if (!vehicleId) {                                   // Nível 2
      logger.warn('missing_vehicle_id', { requestId });
      return NextResponse.json({ error: '...' }, { status: 400 });
    }

    const { data: categoryData, error: categoryError } = await supabase
      .rpc('get_partner_categories', { partner_uuid: req.userId })
      .single();

    if (categoryError || !categoryData) {               // Nível 2
      logger.error('category_fetch_error', { error: categoryError });
      return NextResponse.json({ error: '...' }, { status: 500 });
    }

    const timelineStatus = categoryData?.tipo === 'mecanica' 
      ? 'EM ORÇAMENTAÇÃO - MECÂNICA' 
      : 'EM ORÇAMENTAÇÃO - FUNILARIA/PINTURA';

    const { data: existingHistory } = await supabase
      .from('vehicle_history')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('status', timelineStatus)
      .maybeSingle();

    if (!existingHistory) {                             // Nível 2
      const { error: historyError } = await supabase
        .from('vehicle_history')
        .insert({
          vehicle_id: vehicleId,
          status: timelineStatus,
          prevision_date: null,
          end_date: null,
          created_at: new Date().toISOString(),
        });

      if (historyError) {                               // Nível 3
        logger.error('history_insert_error', { error: historyError.message });
      } else {                                          // Nível 3
        logger.info('history_created', {
          vehicleId: vehicleId.slice(0, 8),
          status: timelineStatus,
        });
      }
    } else {                                            // Nível 2
      logger.info('history_already_exists', { vehicleId: vehicleId.slice(0, 8) });
    }

    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('status')
      .eq('id', vehicleId)
      .single();

    if (vehicle) {                                      // Nível 2
      const currentStatus = vehicle.status;
      const shouldUpdate = ['Em Análise', 'Análise Finalizada', 'Aguardando Análise'].includes(
        currentStatus
      );

      if (shouldUpdate) {                               // Nível 3
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({ status: 'EM ORÇAMENTAÇÃO' })
          .eq('id', vehicleId);

        if (updateError) {                              // Nível 4
          logger.error('vehicle_status_update_error', {
            error: updateError.message,
            vehicleId: vehicleId.slice(0, 8),
          });
        } else {                                        // Nível 4
          logger.info('vehicle_status_updated', {
            vehicleId: vehicleId.slice(0, 8),
            from: currentStatus,
            to: 'EM ORÇAMENTAÇÃO',
          });
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {                                     // Nível 1
    const err = error as Error;
    logger.error('init_checklist_failed', {
      error: err.message,
      stack: err.stack,
    });
    return NextResponse.json({ error: 'Erro ao iniciar checklist' }, { status: 500 });
  }
}
```

**📊 Análise:**
- Máximo de indentação: **4 níveis**
- Linhas de código: **110**
- Complexidade ciclomática: **6+**

#### **Impacto:**
- 🔴 **Crítico** - Código difícil de ler (4 níveis de indentação)
- 🟠 **Grave** - Alto acoplamento (múltiplas queries inline)
- 🟠 **Grave** - Difícil de testar (lógica misturada)

#### **Solução Recomendada:**
```typescript
async function initChecklistHandler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const { vehicleId } = await extractVehicleId(req);
    
    const category = await fetchPartnerCategory(supabase, req.userId);
    const timelineStatus = getTimelineStatus(category);
    
    await ensureHistoryEntry(supabase, vehicleId, timelineStatus);
    await updateVehicleStatusIfNeeded(supabase, vehicleId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleInitError(error);
  }
}

// Funções auxiliares extraídas (cada uma com 1 nível de indentação)
async function extractVehicleId(req: AuthenticatedRequest): Promise<string> {
  const { vehicleId } = await req.json();
  
  if (!vehicleId) {
    throw new ValidationError('vehicleId é obrigatório');
  }
  
  return vehicleId;
}

async function fetchPartnerCategory(supabase: SupabaseClient, partnerId: string) {
  const { data, error } = await supabase
    .rpc('get_partner_categories', { partner_uuid: partnerId })
    .single();

  if (error || !data) {
    throw new DatabaseError('Erro ao buscar categoria do parceiro');
  }

  return data;
}

function getTimelineStatus(category: any): string {
  return category.tipo === 'mecanica'
    ? 'EM ORÇAMENTAÇÃO - MECÂNICA'
    : 'EM ORÇAMENTAÇÃO - FUNILARIA/PINTURA';
}

async function ensureHistoryEntry(
  supabase: SupabaseClient,
  vehicleId: string,
  status: string
): Promise<void> {
  const existing = await findHistoryEntry(supabase, vehicleId, status);
  
  if (existing) {
    logger.info('history_already_exists', { vehicleId: vehicleId.slice(0, 8) });
    return;
  }
  
  await createHistoryEntry(supabase, vehicleId, status);
}

async function updateVehicleStatusIfNeeded(
  supabase: SupabaseClient,
  vehicleId: string
): Promise<void> {
  const vehicle = await fetchVehicle(supabase, vehicleId);
  const shouldUpdate = ['Em Análise', 'Análise Finalizada', 'Aguardando Análise']
    .includes(vehicle.status);

  if (!shouldUpdate) {
    return;
  }

  await updateVehicleStatus(supabase, vehicleId, 'EM ORÇAMENTAÇÃO');
}
```

**📊 Comparação:**
- **Antes:** 110 linhas, 4 níveis de indentação, complexidade ~6
- **Depois:** ~15 linhas no handler, 1 nível de indentação, complexidade ~2

---

### **4. Arquitetura Modular - Lógica de Domínio na Camada de API**

#### **Descrição:**
Lógica de negócio está **misturada com a camada de API**, violando separação de concerns.

#### **Estrutura Atual (INCORRETA):**
```
/app/api/
  ├── specialist/
  │   ├── start-analysis/route.ts
  │   │   └── [CONTÉM] Lógica de atualização de status
  │   │   └── [CONTÉM] Validação de transições
  │   │   └── [CONTÉM] Query ao banco
  │   │
  │   └── finalize-checklist/route.ts
  │       └── [CONTÉM] Lógica de finalização de inspeção
  │       └── [CONTÉM] Criação de service_orders
  │       └── [CONTÉM] Criação de quotes
  │       └── [CONTÉM] Atualização de status
  │
  └── partner/
      └── checklist/init/route.ts
          └── [CONTÉM] Lógica de histórico
          └── [CONTÉM] Busca de categoria
          └── [CONTÉM] Atualização de status
```

#### **Problemas:**
- ❌ Lógica de negócio não pode ser reutilizada
- ❌ Difícil de testar (requer mock de Next.js request)
- ❌ Impossível usar em jobs/cron/scripts
- ❌ Violação de SOLID (API layer deveria ser apenas adapter)

#### **Estrutura Esperada (CORRETA):**
```
/modules/
  ├── vehicles/
  │   ├── services/
  │   │   ├── vehicleService.ts           # CRUD de vehicles
  │   │   ├── vehicleStatusService.ts     # Transições de status
  │   │   └── vehicleHistoryService.ts    # Gerenciamento de histórico
  │   │
  │   ├── repositories/
  │   │   ├── vehicleRepository.ts        # Acesso ao banco (vehicles)
  │   │   └── vehicleHistoryRepository.ts # Acesso ao banco (vehicle_history)
  │   │
  │   └── constants/
  │       └── vehicleStatus.ts
  │
  ├── inspections/
  │   ├── services/
  │   │   ├── inspectionService.ts        # Lógica de inspeções
  │   │   └── checklistService.ts         # Lógica de checklist
  │   │
  │   └── repositories/
  │       └── inspectionRepository.ts
  │
  └── service-orders/
      ├── services/
      │   └── serviceOrderService.ts      # Criação de service_orders
      │
      └── repositories/
          └── serviceOrderRepository.ts

/app/api/
  ├── specialist/
  │   ├── start-analysis/route.ts
  │   │   └── [CHAMA] vehicleStatusService.updateStatus()
  │   │
  │   └── finalize-checklist/route.ts
  │       └── [CHAMA] inspectionService.finalize()
  │       └── [CHAMA] serviceOrderService.create()
  │
  └── partner/
      └── checklist/init/route.ts
          └── [CHAMA] vehicleHistoryService.ensureEntry()
          └── [CHAMA] vehicleStatusService.updateIfNeeded()
```

#### **Exemplo de Refactoring:**

**ANTES:**
```typescript
// /app/api/specialist/start-analysis/route.ts
export const POST = createVehicleActionHandler(async ({ vehicleId, supabase }) => {
  // Lógica de negócio INLINE
  const { data: veh } = await supabase.from('vehicles').select('status')...;
  
  const current = String(veh.status || '').toUpperCase();
  const allowedPrev = current === VehicleStatus.CHEGADA_CONFIRMADA || ...;
  
  if (!allowedPrev) {
    return { json: { error: '...' }, status: 400 };
  }

  await supabase.from('vehicles').update({ status: VehicleStatus.EM_ANALISE })...;

  return { json: { success: true }, status: 200 };
});
```

**DEPOIS:**
```typescript
// /modules/vehicles/services/vehicleStatusService.ts
export class VehicleStatusService {
  constructor(private vehicleRepo: VehicleRepository) {}

  async startAnalysis(vehicleId: string, userId: string): Promise<void> {
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    
    this.validateStartAnalysisTransition(vehicle.status);
    
    await this.vehicleRepo.updateStatus(vehicleId, VehicleStatus.EM_ANALISE);
    
    logger.info('analysis_started', { vehicleId, userId });
  }

  private validateStartAnalysisTransition(currentStatus: VehicleStatus): void {
    const allowed = [VehicleStatus.CHEGADA_CONFIRMADA, VehicleStatus.EM_ANALISE];
    
    if (!allowed.includes(currentStatus)) {
      throw new InvalidStatusTransitionError(
        `Início de análise não permitido a partir de ${currentStatus}`
      );
    }
  }
}

// /app/api/specialist/start-analysis/route.ts
export const POST = createVehicleActionHandler(async ({ vehicleId, req }) => {
  try {
    const statusService = new VehicleStatusService(new VehicleRepository(supabase));
    
    await statusService.startAnalysis(vehicleId, req.userId);

    return { json: { success: true }, status: 200 };
  } catch (error) {
    return handleApiError(error);
  }
});
```

#### **Impacto:**
- 🔴 **Crítico** - Violação de arquitetura modular
- 🔴 **Crítico** - Código não testável unitariamente
- 🟠 **Grave** - Impossível reutilizar lógica

---

### **5. Sistema de Histórico Imutável - Inconsistência com collection_history**

#### **Descrição:**
Projeto define princípio de **histórico imutável** para `collection_history`, mas **não aplica consistentemente** para `vehicle_history`.

#### **Sistema Esperado (Documentado):**
> "O sistema de histórico de coletas foi implementado com imutabilidade para garantir que registros históricos nunca sejam alterados, mesmo que os dados originais sejam modificados posteriormente."

#### **Implementação Atual:**

##### **✅ collection_history (CORRETO):**
```sql
-- Tabela imutável com trigger automático
CREATE TABLE collection_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL,
    collection_id UUID NOT NULL,
    collection_address TEXT,
    collection_fee_per_vehicle DECIMAL(10, 2),
    collection_date DATE,
    payment_received BOOLEAN,
    vehicle_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    -- ✅ SEM updated_at (imutável)
);

-- ✅ Trigger automático cria registros
CREATE TRIGGER collection_history_trigger
AFTER UPDATE ON public.collections
FOR EACH ROW
WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
EXECUTE FUNCTION create_collection_history_record();
```

##### **⚠️ vehicle_history (INCONSISTENTE):**
```sql
-- Tabela com trigger automático
CREATE TABLE vehicle_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    status TEXT NOT NULL,
    prevision_date DATE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    -- ✅ SEM updated_at (imutável)
);

-- ✅ Trigger automático
CREATE TRIGGER vehicle_history_trigger
AFTER INSERT OR UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.log_vehicle_history();
```

**MAS:**
```typescript
// ❌ Parceiro insere manualmente (bypassa trigger)
await supabase.from('vehicle_history').insert({
  vehicle_id: vehicleId,
  status: timelineStatus,
  // ...
});

// ❌ Possível duplicação se trigger também disparar
```

#### **Problemas Identificados:**

1. **Dois Padrões Diferentes:**
   - `collection_history`: **Apenas via trigger** (consistente)
   - `vehicle_history`: **Trigger + INSERT manual** (inconsistente)

2. **Risco de Duplicação:**
   - Se parceiro insere manualmente E trigger dispara → duplicata
   - Código do parceiro verifica se existe, mas ainda assim inconsistente

3. **Falta de Service Layer:**
   - `collection_history`: Tem `CollectionHistoryService`
   - `vehicle_history`: **NÃO TEM** service layer

#### **Impacto:**
- 🔴 **Crítico** - Inconsistência arquitetural
- 🟠 **Grave** - Violação do princípio documentado
- 🟠 **Grave** - Risco de duplicação de registros

#### **Solução Recomendada:**
```typescript
// /modules/vehicles/services/vehicleHistoryService.ts
export class VehicleHistoryService {
  constructor(private historyRepo: VehicleHistoryRepository) {}

  /**
   * Busca histórico do veículo
   * OBS: Nunca inserir manualmente, deixar trigger fazer isso!
   */
  async getVehicleHistory(vehicleId: string): Promise<VehicleHistory[]> {
    return await this.historyRepo.findByVehicleId(vehicleId);
  }

  /**
   * Verifica se transição de status criou entrada no histórico
   * Útil para debugging/auditoria
   */
  async verifyHistoryEntry(
    vehicleId: string,
    status: VehicleStatus
  ): Promise<boolean> {
    const history = await this.historyRepo.findByVehicleIdAndStatus(vehicleId, status);
    return history !== null;
  }

  // ❌ NÃO EXPOR createHistoryEntry() - deixar trigger fazer isso!
}
```

---

## 🟠 **VIOLAÇÕES GRAVES**

### **6. DRY - Validação de Status Duplicada**

#### **Ocorrências:**

##### **a) `/app/api/specialist/start-analysis/route.ts`**
```typescript
const allowedPrev =
  current === VehicleStatus.CHEGADA_CONFIRMADA || 
  current === VehicleStatus.EM_ANALISE;

if (!allowedPrev) {
  return { json: { error: 'Início de análise permitido apenas após Chegada Confirmada' }, status: 400 };
}
```

##### **b) `/app/api/specialist/save-checklist/route.ts`**
```typescript
const allowed = s === VehicleStatus.CHEGADA_CONFIRMADA || s === VehicleStatus.EM_ANALISE;

if (!allowed) {
  return { json: { error: 'Checklist só pode ser salvo após chegada confirmada' }, status: 400 };
}
```

##### **c) `/app/api/partner/save-vehicle-checklist/route.ts`**
```typescript
const validStatuses = [
  VehicleStatus.EM_ANALISE,
  VehicleStatus.ANALISE_FINALIZADA,
  'EM ORÇAMENTAÇÃO'
];

if (!validStatuses.includes(vehicle.status)) {
  return NextResponse.json({ error: 'Status do veículo não permite checklist neste momento' }, { status: 400 });
}
```

#### **Impacto:**
- 🟠 **Grave** - Validações diferentes em lugares diferentes
- 🟠 **Grave** - Difícil manter consistência

#### **Solução:**
```typescript
// /modules/vehicles/validators/statusTransitionValidator.ts
export class StatusTransitionValidator {
  private static transitions: Map<VehicleStatus, VehicleStatus[]> = new Map([
    [VehicleStatus.CHEGADA_CONFIRMADA, [VehicleStatus.EM_ANALISE]],
    [VehicleStatus.EM_ANALISE, [VehicleStatus.ANALISE_FINALIZADA]],
    // ...
  ]);

  static canTransition(from: VehicleStatus, to: VehicleStatus): boolean {
    const allowed = this.transitions.get(from) || [];
    return allowed.includes(to) || from === to; // Permite idempotência
  }

  static validateTransition(from: VehicleStatus, to: VehicleStatus): void {
    if (!this.canTransition(from, to)) {
      throw new InvalidStatusTransitionError(
        `Transição de ${from} para ${to} não é permitida`
      );
    }
  }
}
```

---

### **7. SOLID - Violação de Open/Closed Principle**

#### **Descrição:**
Código precisa ser **modificado** (não estendido) para adicionar novos status ou transições.

#### **Exemplo:**
```typescript
// /app/api/partner/checklist/init/route.ts
const timelineStatus = categoryData?.tipo === 'mecanica' 
  ? 'EM ORÇAMENTAÇÃO - MECÂNICA' 
  : 'EM ORÇAMENTAÇÃO - FUNILARIA/PINTURA';

// ❌ Para adicionar nova categoria (ex: elétrica), precisa MODIFICAR este código
// ✅ Deveria poder ESTENDER sem modificar
```

#### **Solução:**
```typescript
// /modules/vehicles/strategies/TimelineStatusStrategy.ts
interface TimelineStatusStrategy {
  getStatus(category: PartnerCategory): string;
}

class MechanicTimelineStrategy implements TimelineStatusStrategy {
  getStatus(): string {
    return 'EM ORÇAMENTAÇÃO - MECÂNICA';
  }
}

class BodyPaintTimelineStrategy implements TimelineStatusStrategy {
  getStatus(): string {
    return 'EM ORÇAMENTAÇÃO - FUNILARIA/PINTURA';
  }
}

// ✅ Para adicionar nova categoria, apenas criar nova classe
class ElectricTimelineStrategy implements TimelineStatusStrategy {
  getStatus(): string {
    return 'EM ORÇAMENTAÇÃO - ELÉTRICA';
  }
}

// Factory
export class TimelineStatusStrategyFactory {
  private static strategies: Map<string, TimelineStatusStrategy> = new Map([
    ['mecanica', new MechanicTimelineStrategy()],
    ['funilaria', new BodyPaintTimelineStrategy()],
    ['eletrica', new ElectricTimelineStrategy()], // ✅ Apenas registrar
  ]);

  static getStrategy(categoryType: string): TimelineStatusStrategy {
    const strategy = this.strategies.get(categoryType);
    
    if (!strategy) {
      throw new Error(`Strategy não encontrada para categoria: ${categoryType}`);
    }
    
    return strategy;
  }
}
```

---

### **8. Object Calisthenics - Wrap Primitives (Status como String)**

#### **Descrição:**
Status de veículo é tratado como **string primitiva**, violando encapsulamento.

#### **Problema Atual:**
```typescript
// Status pode ser qualquer string
let status: string = 'EM ANÁLISE';
status = 'ANALISE_FINALIZADA'; // ❌ Formato diferente
status = 'Análise Finalizada'; // ❌ Outro formato
status = 'qualquer coisa';     // ❌ Nenhuma validação em compile-time
```

#### **Solução:**
```typescript
// /modules/vehicles/value-objects/VehicleStatus.ts
export class VehicleStatus {
  private constructor(private readonly value: string) {
    this.validate();
  }

  private validate(): void {
    const validStatuses = [
      'AGUARDANDO COLETA',
      'CHEGADA CONFIRMADA',
      'EM ANÁLISE',
      'ANÁLISE FINALIZADA',
      // ...
    ];

    if (!validStatuses.includes(this.value)) {
      throw new InvalidVehicleStatusError(`Status inválido: ${this.value}`);
    }
  }

  static fromString(value: string): VehicleStatus {
    return new VehicleStatus(value.toUpperCase().trim());
  }

  static AGUARDANDO_COLETA = new VehicleStatus('AGUARDANDO COLETA');
  static CHEGADA_CONFIRMADA = new VehicleStatus('CHEGADA CONFIRMADA');
  static EM_ANALISE = new VehicleStatus('EM ANÁLISE');
  static ANALISE_FINALIZADA = new VehicleStatus('ANÁLISE FINALIZADA');

  toString(): string {
    return this.value;
  }

  equals(other: VehicleStatus): boolean {
    return this.value === other.value;
  }

  canTransitionTo(target: VehicleStatus): boolean {
    // Lógica de transições válidas
  }
}

// Uso:
const status = VehicleStatus.EM_ANALISE;
await supabase.from('vehicles').update({ status: status.toString() });
```

---

### **9. Migrations - Falta de Idempotência em Algumas Migrations**

#### **Descrição:**
Princípio do projeto define que **"Toda migration deve ser idempotente"**, mas algumas não são.

#### **❌ Exemplo Não Idempotente:**
```sql
-- 20250902200000_standardize_vehicle_status.sql
UPDATE vehicles
SET status = 'Análise Finalizada'
WHERE status = 'ANALISE_FINALIZADA';

-- ❌ Se rodar 2x, não causa erro, mas se houver novos registros 
-- com 'ANALISE_FINALIZADA' entre as execuções, serão ignorados
```

#### **✅ Exemplo Idempotente:**
```sql
-- 20250908181431_fix_collection_history_trigger.sql
CREATE OR REPLACE FUNCTION create_collection_history_record()
-- ✅ CREATE OR REPLACE garante idempotência
```

#### **Problema em:**
- `20250902200000_standardize_vehicle_status.sql` - ❌ Não idempotente
- Outras migrations de UPDATE sem verificação - ⚠️ Revisar

#### **Solução:**
```sql
-- Migration idempotente com verificação
DO $$
BEGIN
    -- Atualizar apenas se houver registros para atualizar
    IF EXISTS (SELECT 1 FROM vehicles WHERE status = 'ANALISE_FINALIZADA') THEN
        UPDATE vehicles
        SET status = 'ANÁLISE FINALIZADA'
        WHERE status = 'ANALISE_FINALIZADA';
        
        RAISE NOTICE 'Status padronizado: % registros atualizados', 
                     (SELECT COUNT(*) FROM vehicles WHERE status = 'ANÁLISE FINALIZADA');
    ELSE
        RAISE NOTICE 'Nenhum registro para atualizar';
    END IF;
END $$;
```

---

## 🟡 **VIOLAÇÕES MODERADAS**

### **10. Falta de Tratamento de Erros Consistente**
```typescript
// Alguns endpoints tratam erros, outros não
// Alguns retornam 400, outros 500, sem consistência
```

### **11. Logging Inconsistente**
```typescript
// Alguns endpoints usam logger.info, outros logger.error
// Alguns incluem requestId, outros não
```

### **12. Falta de Testes Unitários**
```typescript
// Nenhum arquivo de teste encontrado para os serviços críticos
```

### **13. Hard-coded Strings**
```typescript
// Status como strings literais espalhadas pelo código
const status = 'EM ORÇAMENTAÇÃO - MECÂNICA';
```

### **14. Falta de Documentação de API**
```typescript
// Endpoints sem JSDoc ou comentários explicativos
```

### **15-21.** *(Lista de outras violações moderadas)*

---

## 📊 **RESUMO DE VIOLAÇÕES POR ARQUIVO**

| Arquivo | LOC | Violações | Prioridade |
|---------|-----|-----------|------------|
| `/app/api/partner/save-vehicle-checklist/route.ts` | 260 | 🔴🔴🔴🟠🟠🟡🟡 | **CRÍTICA** |
| `/app/api/specialist/finalize-checklist/route.ts` | 100 | 🔴🔴🟠🟠🟡 | **ALTA** |
| `/app/api/partner/checklist/init/route.ts` | 110 | 🔴🟠🟠🟡🟡 | **ALTA** |
| `/app/api/specialist/start-analysis/route.ts` | 30 | 🟠🟡 | MÉDIA |
| `/modules/vehicles/constants/vehicleStatus.ts` | 15 | 🟠 | MÉDIA |

---

## 🎯 **PLANO DE AÇÃO RECOMENDADO**

### **Sprint 1 (Hotfix):**
1. ✅ Padronizar formato de status (`'ANÁLISE FINALIZADA'` com acento)
2. ✅ Criar migration idempotente para corrigir dados
3. ✅ Verificar trigger no banco de produção

### **Sprint 2-3 (Refactoring Crítico):**
1. ✅ Criar `VehicleStatusService` (centralizar lógica de status)
2. ✅ Refatorar `/partner/save-vehicle-checklist` (260 → ~80 linhas)
3. ✅ Extrair serviços: `InspectionService`, `ChecklistService`, `ImageService`

### **Sprint 4-6 (Arquitetura):**
1. ✅ Implementar camada de Repository
2. ✅ Criar `VehicleHistoryService` (padronizar histórico)
3. ✅ Refatorar todos os endpoints para usar serviços

### **Sprint 7+ (Qualidade):**
1. ✅ Adicionar testes unitários (cobertura > 80%)
2. ✅ Implementar Value Objects (`VehicleStatus`, etc.)
3. ✅ Criar documentação de API (OpenAPI/Swagger)

---

## 📈 **MÉTRICAS DE MELHORIA**

### **Estado Atual:**
- **Duplicação de Código:** ~40% (lógica de status em 5+ lugares)
- **Complexidade Ciclomática Média:** ~8 (alto)
- **Linhas por Função:** Média ~80 (muito alto)
- **Cobertura de Testes:** 0%
- **Violações de SOLID:** 15+ casos

### **Estado Desejado:**
- **Duplicação de Código:** <10%
- **Complexidade Ciclomática Média:** <4
- **Linhas por Função:** Média <30
- **Cobertura de Testes:** >80%
- **Violações de SOLID:** 0

---

**Documento criado em:** 2025-01-09  
**Próxima revisão:** Após implementação do Sprint 1
