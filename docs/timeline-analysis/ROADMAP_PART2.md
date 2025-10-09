# 🗺️ Roadmap de Melhorias Graduais - PARTE 2

**Continuação de:** `ROADMAP.md`  
**Fases cobertas:** Fase 3, 4 e 5

---

# FASE 3: REFACTORING MODULAR

**Objetivo:** Extrair serviços e reduzir complexidade dos endpoints  
**Duração:** 2 semanas  
**Risco:** 🟡 Médio (mudanças estruturais incrementais)

---

## ETAPA 3.1: Criar VehicleStatusService

### **📝 Descrição**
Centralizar toda lógica de mudança de status de veículo em um serviço dedicado.

### **🎯 Objetivo**
- Eliminar duplicação de lógica de status (DRY)
- Garantir consistência nas mudanças de status
- Facilitar adição de regras de negócio

### **📂 Arquivos Afetados**
1. ✅ `/modules/vehicles/services/VehicleStatusService.ts` (NOVO)
2. ✅ `/modules/vehicles/services/index.ts` (NOVO - barrel export)

### **🔧 Implementação**

```typescript
// /modules/vehicles/services/VehicleStatusService.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { VehicleStatus, VehicleStatusType } from '../constants/vehicleStatus';
import { canTransition } from '../types/vehicleStatus.types';
import { ApiError } from '@/modules/common/errors/ApiError';
import { logger } from '@/modules/logger';

export interface UpdateStatusOptions {
  vehicleId: string;
  newStatus: VehicleStatusType;
  checkTransition?: boolean; // Padrão: true
  reason?: string;
}

export interface StatusUpdateResult {
  success: boolean;
  previousStatus: VehicleStatusType;
  newStatus: VehicleStatusType;
  historyCreated: boolean;
}

/**
 * Serviço centralizado para gerenciamento de status de veículos
 * 
 * Responsabilidades:
 * - Validar transições de status
 * - Atualizar tabela vehicles
 * - Garantir que vehicle_history é criado (via trigger ou manual)
 * - Logging consistente
 */
export class VehicleStatusService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Atualiza status do veículo com validação de transição
   */
  async updateStatus(options: UpdateStatusOptions): Promise<StatusUpdateResult> {
    const { vehicleId, newStatus, checkTransition = true, reason } = options;

    const startTime = Date.now();
    logger.info('status_update_started', {
      vehicleId: vehicleId.slice(0, 8),
      newStatus,
      checkTransition,
    });

    try {
      // 1. Buscar veículo atual
      const { data: vehicle, error: fetchError } = await this.supabase
        .from('vehicles')
        .select('id, status')
        .eq('id', vehicleId)
        .single();

      if (fetchError || !vehicle) {
        throw ApiError.notFound('Veículo não encontrado');
      }

      const previousStatus = vehicle.status as VehicleStatusType;

      // 2. Validar transição (se solicitado)
      if (checkTransition && previousStatus !== newStatus) {
        if (!canTransition(previousStatus, newStatus)) {
          throw ApiError.badRequest(
            `Transição de "${previousStatus}" para "${newStatus}" não é permitida`,
            'INVALID_STATUS_TRANSITION'
          );
        }
      }

      // 3. Atualizar status
      const { error: updateError } = await this.supabase
        .from('vehicles')
        .update({ status: newStatus })
        .eq('id', vehicleId);

      if (updateError) {
        logger.error('status_update_failed', {
          vehicleId: vehicleId.slice(0, 8),
          error: updateError.message,
        });
        throw ApiError.internal('Erro ao atualizar status do veículo');
      }

      // 4. Verificar se histórico foi criado (trigger deve ter disparado)
      const historyCreated = await this.verifyHistoryCreated(vehicleId, newStatus);

      if (!historyCreated) {
        logger.warn('history_not_created_by_trigger', {
          vehicleId: vehicleId.slice(0, 8),
          newStatus,
        });
      }

      logger.info('status_update_completed', {
        vehicleId: vehicleId.slice(0, 8),
        previousStatus,
        newStatus,
        historyCreated,
        duration: Date.now() - startTime,
      });

      return {
        success: true,
        previousStatus,
        newStatus,
        historyCreated,
      };
    } catch (error) {
      logger.error('status_update_error', {
        vehicleId: vehicleId.slice(0, 8),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Verifica se registro foi criado no vehicle_history
   * (usado para detectar se trigger funcionou)
   */
  private async verifyHistoryCreated(
    vehicleId: string,
    expectedStatus: VehicleStatusType
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('vehicle_history')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('status', expectedStatus)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      logger.error('history_verification_failed', {
        vehicleId: vehicleId.slice(0, 8),
        error: error.message,
      });
      return false;
    }

    return data && data.length > 0;
  }

  /**
   * Cria entrada manual no vehicle_history
   * (fallback caso trigger não funcione)
   */
  async createHistoryEntry(
    vehicleId: string,
    status: VehicleStatusType,
    notes?: string
  ): Promise<void> {
    logger.info('manual_history_entry_creating', {
      vehicleId: vehicleId.slice(0, 8),
      status,
    });

    const { error } = await this.supabase
      .from('vehicle_history')
      .insert({
        vehicle_id: vehicleId,
        status: status,
        notes: notes || null,
      });

    if (error) {
      logger.error('manual_history_entry_failed', {
        vehicleId: vehicleId.slice(0, 8),
        error: error.message,
      });
      throw ApiError.internal('Erro ao criar registro de histórico');
    }

    logger.info('manual_history_entry_created', {
      vehicleId: vehicleId.slice(0, 8),
      status,
    });
  }

  /**
   * Busca histórico completo de um veículo
   */
  async getVehicleHistory(vehicleId: string) {
    const { data, error } = await this.supabase
      .from('vehicle_history')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (error) {
      throw ApiError.internal('Erro ao buscar histórico do veículo');
    }

    return data || [];
  }

  /**
   * Retorna status atual do veículo
   */
  async getCurrentStatus(vehicleId: string): Promise<VehicleStatusType> {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select('status')
      .eq('id', vehicleId)
      .single();

    if (error || !data) {
      throw ApiError.notFound('Veículo não encontrado');
    }

    return data.status as VehicleStatusType;
  }
}
```

```typescript
// /modules/vehicles/services/index.ts
export { VehicleStatusService } from './VehicleStatusService';
export type { UpdateStatusOptions, StatusUpdateResult } from './VehicleStatusService';
```

### **⚠️ Riscos**
- 🟡 **Médio:** Novo padrão que precisa ser adotado gradualmente

### **✅ Validação Manual**

**Teste Unitário (criar depois na Fase 5):**
```typescript
// Para agora, teste manual:
import { VehicleStatusService } from '@/modules/vehicles/services';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import { createClient } from '@/lib/supabase/server';

// Em um endpoint de teste:
const supabase = createClient();
const service = new VehicleStatusService(supabase);

// Teste 1: Atualizar status válido
const result = await service.updateStatus({
  vehicleId: 'id-de-teste',
  newStatus: VehicleStatus.EM_ANALISE,
});
console.log('Teste 1:', result.success); // Deve ser true

// Teste 2: Transição inválida (deve lançar erro)
try {
  await service.updateStatus({
    vehicleId: 'id-de-teste',
    newStatus: VehicleStatus.FASE_EXECUCAO_INICIADA, // Pular etapas
  });
  console.log('Teste 2: FALHOU - deveria ter lançado erro');
} catch (error) {
  console.log('Teste 2: PASSOU - erro esperado:', error.message);
}
```

### **🔄 Rollback**
```bash
# Fácil: apenas remover arquivo novo
git revert <commit-hash>
# Endpoints antigos continuam funcionando
```

### **⏱️ Tempo Estimado:** 4 horas

### **📊 Status:** ⏳ PENDENTE

---

## ETAPA 3.2: Refatorar /api/specialist/start-analysis

### **📝 Descrição**
Migrar endpoint para usar VehicleStatusService criado na etapa anterior.

### **🎯 Objetivo**
- Reduzir duplicação de código
- Usar serviço centralizado
- Melhorar testabilidade

### **📂 Arquivos Afetados**
1. ✅ `/app/api/specialist/start-analysis/route.ts` (MODIFICAR)

### **🔧 Implementação**

**ANTES (complexo):**
```typescript
export const POST = createVehicleActionHandler(async ({ vehicleId, supabase }) => {
  const { data: veh, error: vehErr } = await supabase
    .from('vehicles')
    .select('status')
    .eq('id', vehicleId)
    .single();

  if (vehErr || !veh) {
    return { json: { error: 'Veículo não encontrado' }, status: 404 };
  }

  if (veh.status !== 'CHEGADA CONFIRMADA' && veh.status !== 'EM ANÁLISE') {
    return {
      json: {
        error: `Status inválido. Esperado: CHEGADA CONFIRMADA, atual: ${veh.status}`,
      },
      status: 400,
    };
  }

  const { error: updErr } = await supabase
    .from('vehicles')
    .update({ status: VehicleStatus.EM_ANALISE })
    .eq('id', vehicleId);

  if (updErr) {
    return { json: { error: 'Erro ao atualizar status' }, status: 500 };
  }

  return { json: { success: true }, status: 200 };
});
```

**DEPOIS (simples):**
```typescript
import { VehicleStatusService } from '@/modules/vehicles/services';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import { handleApiError } from '@/modules/common/middleware/errorHandler';

export const POST = createVehicleActionHandler(async ({ vehicleId, supabase }) => {
  try {
    const statusService = new VehicleStatusService(supabase);

    // Service já valida transição e cria histórico
    const result = await statusService.updateStatus({
      vehicleId,
      newStatus: VehicleStatus.EM_ANALISE,
      checkTransition: true, // Valida que status atual permite essa mudança
    });

    return {
      json: {
        success: true,
        previousStatus: result.previousStatus,
        newStatus: result.newStatus,
      },
      status: 200,
    };
  } catch (error) {
    return handleApiError(error, { operation: 'start_analysis', vehicleId });
  }
});
```

**Benefícios:**
- ✅ 30 linhas → 15 linhas (50% redução)
- ✅ Validação centralizada
- ✅ Logging consistente
- ✅ Error handling padronizado

### **⚠️ Riscos**
- 🟡 **Médio:** Mudança de comportamento do endpoint

### **✅ Validação Manual**

**Checklist de Testes:**
1. [ ] **Cenário 1:** Especialista inicia análise com status "CHEGADA CONFIRMADA"
   - Resultado esperado: Sucesso, status muda para "EM ANÁLISE"
   - Histórico criado: Sim

2. [ ] **Cenário 2:** Especialista tenta iniciar análise com status inválido (ex: "AGUARDANDO COLETA")
   - Resultado esperado: Erro 400, mensagem clara
   - Status não muda

3. [ ] **Cenário 3:** Especialista reinicia análise já em andamento (status "EM ANÁLISE")
   - Resultado esperado: Sucesso (transição válida para mesmo status)
   - Novo registro no histórico

4. [ ] **Cenário 4:** Veículo não existe
   - Resultado esperado: Erro 404
   - Mensagem: "Veículo não encontrado"

### **🔄 Rollback**
```bash
git revert <commit-hash>
# Comportamento volta ao anterior
```

### **⏱️ Tempo Estimado:** 2 horas

### **📊 Status:** ⏳ PENDENTE

---

## ETAPA 3.3: Refatorar /api/specialist/finalize-checklist

### **📝 Descrição**
Refatorar endpoint que finaliza checklist do especialista para usar VehicleStatusService.

### **🎯 Objetivo**
- Reduzir complexidade (atualmente ~100 linhas)
- Separar responsabilidades (status, checklist, service_order, quote)
- Usar serviço centralizado

### **📂 Arquivos Afetados**
1. ✅ `/app/api/specialist/finalize-checklist/route.ts` (MODIFICAR - simplificar)

### **🔧 Implementação (Simplificada)**

**ANTES (100 linhas, 5 responsabilidades):**
```typescript
// 1. Validação
// 2. Buscar veículo
// 3. Atualizar checklist
// 4. Criar service_order
// 5. Criar quote
// 6. Atualizar status veículo
```

**DEPOIS (30-40 linhas, delegando para serviços):**
```typescript
import { VehicleStatusService } from '@/modules/vehicles/services';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import { handleApiError } from '@/modules/common/middleware/errorHandler';
import { ApiError } from '@/modules/common/errors/ApiError';

export const POST = createVehicleActionHandler(async ({ vehicleId, supabase, body }) => {
  try {
    const { checklistData, quoteData } = body;

    // Validações
    if (!checklistData || !quoteData) {
      throw ApiError.badRequest('Dados incompletos');
    }

    // 1. Atualizar checklist
    const { error: checklistError } = await supabase
      .from('vehicle_checklists')
      .update({
        checklist_data: checklistData,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('vehicle_id', vehicleId);

    if (checklistError) {
      throw ApiError.internal('Erro ao atualizar checklist');
    }

    // 2. Criar service order (extrair para serviço depois)
    const { data: serviceOrder, error: serviceOrderError } = await supabase
      .from('service_orders')
      .insert({
        vehicle_id: vehicleId,
        created_by: body.userId,
      })
      .select()
      .single();

    if (serviceOrderError || !serviceOrder) {
      throw ApiError.internal('Erro ao criar ordem de serviço');
    }

    // 3. Criar quote inicial (extrair para serviço depois)
    const { error: quoteError } = await supabase
      .from('quotes')
      .insert({
        service_order_id: serviceOrder.id,
        quote_data: quoteData,
        status: 'draft',
      });

    if (quoteError) {
      throw ApiError.internal('Erro ao criar orçamento');
    }

    // 4. Atualizar status do veículo (usando serviço)
    const statusService = new VehicleStatusService(supabase);
    await statusService.updateStatus({
      vehicleId,
      newStatus: VehicleStatus.ANALISE_FINALIZADA,
      checkTransition: true,
    });

    return {
      json: {
        success: true,
        serviceOrderId: serviceOrder.id,
      },
      status: 200,
    };
  } catch (error) {
    return handleApiError(error, { operation: 'finalize_checklist', vehicleId });
  }
});
```

**Melhoria Incremental:**
- ✅ Primeira versão: Apenas usa VehicleStatusService
- 🔜 Próxima iteração (opcional): Extrair ServiceOrderService, QuoteService

### **⚠️ Riscos**
- 🟡 **Médio:** Endpoint complexo, testa múltiplos fluxos

### **✅ Validação Manual**

**Checklist de Testes:**
1. [ ] **Cenário 1:** Finalizar checklist com sucesso
   - Checklist atualizado
   - Service order criado
   - Quote criado
   - Status muda para "ANÁLISE FINALIZADA"
   - Histórico criado

2. [ ] **Cenário 2:** Finalizar sem dados completos
   - Erro 400
   - Nada é criado (rollback implícito)

3. [ ] **Cenário 3:** Erro ao criar service order
   - Erro 500
   - Checklist pode ter sido atualizado (verificar)

### **🔄 Rollback**
```bash
git revert <commit-hash>
```

### **⏱️ Tempo Estimado:** 3 horas

### **📊 Status:** ⏳ PENDENTE

---

## ETAPA 3.4: Refatorar /api/partner/checklist/init

### **📝 Descrição**
Refatorar endpoint de inicialização de checklist do parceiro para usar VehicleStatusService.

### **🎯 Objetivo**
- Usar serviço centralizado para mudança de status
- Remover insert manual em vehicle_history (deixar trigger fazer)
- Reduzir indentação (atualmente 4 níveis)

### **📂 Arquivos Afetados**
1. ✅ `/app/api/partner/checklist/init/route.ts` (MODIFICAR)

### **🔧 Implementação**

**ANTES (manual insert no history):**
```typescript
// ... código de atualização de status ...

// Insert manual no vehicle_history
const { error: historyError } = await supabase
  .from('vehicle_history')
  .insert({
    vehicle_id: vehicleData.id,
    status: VehicleStatus.FASE_ORCAMENTARIA_INICIADA,
  });

if (historyError) {
  return { json: { error: 'Erro ao registrar histórico' }, status: 500 };
}
```

**DEPOIS (usa serviço, trigger cria history):**
```typescript
import { VehicleStatusService } from '@/modules/vehicles/services';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import { handleApiError } from '@/modules/common/middleware/errorHandler';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { vehicleData } = body;

    // ... validações ...

    const statusService = new VehicleStatusService(supabase);

    // Criar checklist
    const { data: checklist, error: checklistError } = await supabase
      .from('vehicle_checklists')
      .insert({
        vehicle_id: vehicleData.id,
        type: 'partner',
        status: 'in_progress',
      })
      .select()
      .single();

    if (checklistError || !checklist) {
      throw ApiError.internal('Erro ao criar checklist');
    }

    // Atualizar status (trigger cria history automaticamente)
    await statusService.updateStatus({
      vehicleId: vehicleData.id,
      newStatus: VehicleStatus.FASE_ORCAMENTARIA_INICIADA,
      checkTransition: true,
    });

    return NextResponse.json({
      success: true,
      checklistId: checklist.id,
      vehicleId: vehicleData.id,
    });
  } catch (error) {
    return handleApiError(error, { operation: 'partner_checklist_init' });
  }
}
```

**Benefícios:**
- ✅ Remove insert manual (deixa trigger fazer)
- ✅ Consistência com fluxo especialista
- ✅ Reduz complexidade e indentação

### **⚠️ Riscos**
- 🟡 **Médio:** Muda comportamento (deixa de fazer insert manual)
- ⚠️ **Atenção:** Depende que trigger esteja funcionando (validado na Fase 1)

### **✅ Validação Manual**

**Checklist de Testes:**
1. [ ] **Cenário 1:** Parceiro inicia checklist
   - Checklist criado
   - Status muda para "FASE ORÇAMENTÁRIA INICIADA"
   - Histórico criado **pelo trigger** (verificar vehicle_history)

2. [ ] **Cenário 2:** Verificar que trigger criou registro
   ```sql
   SELECT * FROM vehicle_history 
   WHERE vehicle_id = '<id>' 
   AND status = 'FASE ORÇAMENTÁRIA INICIADA'
   ORDER BY created_at DESC LIMIT 1;
   -- Deve existir registro criado pelo trigger
   ```

### **🔄 Rollback**
```bash
git revert <commit-hash>
# Volta a fazer insert manual
```

### **⏱️ Tempo Estimado:** 2 horas

### **📊 Status:** ⏳ PENDENTE

---

## ETAPA 3.5: Refatorar /api/partner/save-vehicle-checklist

### **📝 Descrição**
Refatorar o endpoint mais complexo do sistema (260 linhas, 9 responsabilidades).

### **🎯 Objetivo**
- Reduzir de 260 para ~100 linhas
- Extrair responsabilidades para funções auxiliares
- Usar VehicleStatusService
- Reduzir complexidade ciclomática

### **📂 Arquivos Afetados**
1. ✅ `/app/api/partner/save-vehicle-checklist/route.ts` (REFATORAR GRANDE)
2. ✅ `/modules/partner/services/ChecklistService.ts` (NOVO - opcional)

### **🔧 Implementação (Estratégia Incremental)**

**Fase 3.5.1: Extrair Funções Auxiliares (sem mudar estrutura)**
```typescript
// Extrair validações
function validateChecklistData(body: any): ChecklistValidationResult {
  if (!body.inspectionData) throw ApiError.badRequest('Dados de inspeção obrigatórios');
  if (!body.vehicleId) throw ApiError.badRequest('vehicleId obrigatório');
  // ... mais validações
  return { valid: true, data: body };
}

// Extrair lógica de imagens
async function processChecklistImages(
  vehicleId: string,
  images: any[],
  supabase: SupabaseClient
): Promise<string[]> {
  const uploadedUrls: string[] = [];
  
  for (const image of images) {
    const { data, error } = await supabase.storage
      .from('checklist-images')
      .upload(`${vehicleId}/${image.name}`, image.file);
    
    if (!error && data) {
      uploadedUrls.push(data.path);
    }
  }
  
  return uploadedUrls;
}

// Extrair atualização de checklist
async function updateChecklistData(
  checklistId: string,
  inspectionData: any,
  imageUrls: string[],
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase
    .from('vehicle_checklists')
    .update({
      checklist_data: inspectionData,
      images: imageUrls,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', checklistId);

  if (error) {
    throw ApiError.internal('Erro ao atualizar checklist');
  }
}
```

**Fase 3.5.2: Usar Funções no Endpoint**
```typescript
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    // 1. Validar (função extraída)
    const validated = validateChecklistData(body);

    // 2. Processar imagens (função extraída)
    const imageUrls = await processChecklistImages(
      validated.data.vehicleId,
      validated.data.images || [],
      supabase
    );

    // 3. Atualizar checklist (função extraída)
    await updateChecklistData(
      validated.data.checklistId,
      validated.data.inspectionData,
      imageUrls,
      supabase
    );

    // 4. Atualizar status do veículo (usa serviço)
    const statusService = new VehicleStatusService(supabase);
    await statusService.updateStatus({
      vehicleId: validated.data.vehicleId,
      newStatus: VehicleStatus.ANALISE_FINALIZADA,
      checkTransition: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, { operation: 'save_vehicle_checklist' });
  }
}
```

**Melhoria:**
- 260 linhas → ~50 linhas no handler principal
- ~150 linhas em funções auxiliares reutilizáveis
- Complexidade ciclomática reduzida
- Testabilidade aumentada

### **⚠️ Riscos**
- 🟡 **Médio:** Endpoint mais complexo do sistema
- ⚠️ **Atenção:** Muitos fluxos diferentes (rascunho vs completo, com/sem imagens)

### **✅ Validação Manual**

**Checklist de Testes (Extenso):**
1. [ ] **Cenário 1:** Salvar checklist completo com imagens
   - Imagens fazem upload
   - Checklist atualizado
   - Status muda para "ANÁLISE FINALIZADA"
   - Histórico criado

2. [ ] **Cenário 2:** Salvar rascunho (sem finalizar)
   - Dados salvos
   - Status NÃO muda
   - Histórico NÃO criado

3. [ ] **Cenário 3:** Salvar sem imagens
   - Checklist salvo normalmente
   - Status atualizado

4. [ ] **Cenário 4:** Erro no upload de imagem
   - Erro tratado
   - Rollback apropriado

### **🔄 Rollback**
```bash
git revert <commit-hash>
# Volta ao código monolítico
```

### **⏱️ Tempo Estimado:** 6 horas (endpoint complexo)

### **📊 Status:** ⏳ PENDENTE

---

# FASE 4: ARQUITETURA E SERVIÇOS

**Objetivo:** Implementar camada de arquitetura (Repository, Services)  
**Duração:** 2 semanas  
**Risco:** 🟡 Médio (mudanças arquiteturais)

---

## ETAPA 4.1: Criar Repository Layer

### **📝 Descrição**
Criar camada de repositório para abstrair acesso ao Supabase.

### **🎯 Objetivo**
- Desacoplar lógica de negócio do Supabase
- Facilitar mudança de banco no futuro
- Centralizar queries

### **📂 Arquivos Afetados**
1. ✅ `/modules/vehicles/repositories/VehicleRepository.ts` (NOVO)
2. ✅ `/modules/vehicles/repositories/VehicleHistoryRepository.ts` (NOVO)
3. ✅ `/modules/vehicles/repositories/index.ts` (NOVO)

### **🔧 Implementação**

```typescript
// /modules/vehicles/repositories/VehicleRepository.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { VehicleStatusType } from '../constants/vehicleStatus';
import { ApiError } from '@/modules/common/errors/ApiError';

export interface Vehicle {
  id: string;
  status: VehicleStatusType;
  plate: string;
  // ... outros campos
}

export interface VehicleRepository {
  findById(id: string): Promise<Vehicle | null>;
  updateStatus(id: string, status: VehicleStatusType): Promise<void>;
  findByPlate(plate: string): Promise<Vehicle | null>;
}

export class SupabaseVehicleRepository implements VehicleRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Vehicle | null> {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw ApiError.internal('Erro ao buscar veículo');
    }

    return data as Vehicle;
  }

  async updateStatus(id: string, status: VehicleStatusType): Promise<void> {
    const { error } = await this.supabase
      .from('vehicles')
      .update({ status })
      .eq('id', id);

    if (error) {
      throw ApiError.internal('Erro ao atualizar status');
    }
  }

  async findByPlate(plate: string): Promise<Vehicle | null> {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select('*')
      .eq('plate', plate)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw ApiError.internal('Erro ao buscar veículo por placa');
    }

    return data as Vehicle;
  }
}
```

```typescript
// /modules/vehicles/repositories/VehicleHistoryRepository.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { VehicleStatusType } from '../constants/vehicleStatus';
import { ApiError } from '@/modules/common/errors/ApiError';

export interface VehicleHistoryEntry {
  id: string;
  vehicle_id: string;
  status: VehicleStatusType;
  notes: string | null;
  created_at: string;
}

export interface VehicleHistoryRepository {
  findByVehicleId(vehicleId: string): Promise<VehicleHistoryEntry[]>;
  create(entry: Omit<VehicleHistoryEntry, 'id' | 'created_at'>): Promise<VehicleHistoryEntry>;
  findLatestByVehicleId(vehicleId: string): Promise<VehicleHistoryEntry | null>;
}

export class SupabaseVehicleHistoryRepository implements VehicleHistoryRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByVehicleId(vehicleId: string): Promise<VehicleHistoryEntry[]> {
    const { data, error } = await this.supabase
      .from('vehicle_history')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (error) {
      throw ApiError.internal('Erro ao buscar histórico');
    }

    return data || [];
  }

  async create(
    entry: Omit<VehicleHistoryEntry, 'id' | 'created_at'>
  ): Promise<VehicleHistoryEntry> {
    const { data, error } = await this.supabase
      .from('vehicle_history')
      .insert(entry)
      .select()
      .single();

    if (error) {
      throw ApiError.internal('Erro ao criar entrada de histórico');
    }

    return data as VehicleHistoryEntry;
  }

  async findLatestByVehicleId(vehicleId: string): Promise<VehicleHistoryEntry | null> {
    const { data, error } = await this.supabase
      .from('vehicle_history')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw ApiError.internal('Erro ao buscar último histórico');
    }

    return data as VehicleHistoryEntry;
  }
}
```

### **⚠️ Riscos**
- 🟢 **Baixo:** Apenas criação, não muda código existente inicialmente

### **✅ Validação Manual**
```typescript
// Testar repositórios isoladamente
const vehicleRepo = new SupabaseVehicleRepository(supabase);
const vehicle = await vehicleRepo.findById('test-id');
console.log(vehicle); // Deve retornar veículo ou null
```

### **⏱️ Tempo Estimado:** 4 horas

### **📊 Status:** ⏳ PENDENTE

---

## ETAPA 4.2: Migrar VehicleStatusService para Usar Repository

### **📝 Descrição**
Refatorar VehicleStatusService para usar repositories ao invés de Supabase direto.

### **🎯 Objetivo**
- Desacoplar serviço do Supabase
- Usar abstração de repository

### **📂 Arquivos Afetados**
1. ✅ `/modules/vehicles/services/VehicleStatusService.ts` (MODIFICAR)

### **🔧 Implementação**

```typescript
// VehicleStatusService.ts (ANTES: injetava Supabase)
export class VehicleStatusService {
  constructor(private supabase: SupabaseClient) {}
  // ...
}

// VehicleStatusService.ts (DEPOIS: injeta Repositories)
export class VehicleStatusService {
  constructor(
    private vehicleRepo: VehicleRepository,
    private historyRepo: VehicleHistoryRepository
  ) {}

  async updateStatus(options: UpdateStatusOptions): Promise<StatusUpdateResult> {
    // ANTES: await this.supabase.from('vehicles').select()...
    // DEPOIS: await this.vehicleRepo.findById(vehicleId)
    
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) {
      throw ApiError.notFound('Veículo não encontrado');
    }

    // ... validação de transição ...

    await this.vehicleRepo.updateStatus(vehicleId, newStatus);

    // Verificar histórico
    const latestHistory = await this.historyRepo.findLatestByVehicleId(vehicleId);
    const historyCreated = latestHistory?.status === newStatus;

    return { success: true, previousStatus, newStatus, historyCreated };
  }
}
```

**Nos endpoints:**
```typescript
// ANTES
const statusService = new VehicleStatusService(supabase);

// DEPOIS
const vehicleRepo = new SupabaseVehicleRepository(supabase);
const historyRepo = new SupabaseVehicleHistoryRepository(supabase);
const statusService = new VehicleStatusService(vehicleRepo, historyRepo);
```

### **⚠️ Riscos**
- 🟡 **Médio:** Muda injeção de dependências

### **✅ Validação Manual**
- [ ] Todos os testes da Fase 3 continuam passando
- [ ] Nenhum comportamento mudou (apenas estrutura interna)

### **⏱️ Tempo Estimado:** 3 horas

### **📊 Status:** ⏳ PENDENTE

---

## ETAPA 4.3: Criar Value Objects

### **📝 Descrição**
Criar Value Objects para entidades do domínio (opcional, melhoria avançada).

### **🎯 Objetivo**
- Encapsular regras de negócio
- Validação em tempo de criação
- Código mais expressivo

### **📂 Arquivos Afetados**
1. ✅ `/modules/vehicles/domain/VehicleId.ts` (NOVO)
2. ✅ `/modules/vehicles/domain/VehicleStatus.ts` (NOVO)

### **🔧 Implementação (Exemplo)**

```typescript
// /modules/vehicles/domain/VehicleId.ts
export class VehicleId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): VehicleId {
    if (!value) {
      throw new Error('VehicleId não pode ser vazio');
    }

    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(value)) {
      throw new Error('VehicleId inválido');
    }

    return new VehicleId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: VehicleId): boolean {
    return this.value === other.value;
  }
}
```

**Uso:**
```typescript
// Garante que ID é sempre válido
const vehicleId = VehicleId.create(rawId); // Throws se inválido
await vehicleRepo.findById(vehicleId.toString());
```

### **⚠️ Riscos**
- 🟢 **Baixo:** Opcional, não precisa ser adotado em todo lugar

### **✅ Validação Manual**
```typescript
// Teste
try {
  VehicleId.create('invalid'); // Deve lançar erro
} catch (e) {
  console.log('✅ Validação funcionou');
}

const validId = VehicleId.create('550e8400-e29b-41d4-a716-446655440000');
console.log(validId.toString()); // Funciona
```

### **⏱️ Tempo Estimado:** 3 horas

### **📊 Status:** ⏳ PENDENTE (Opcional)

---

# FASE 5: QUALIDADE E TESTES

**Objetivo:** Adicionar testes e documentação  
**Duração:** 1 semana  
**Risco:** 🟢 Baixo (melhoria de qualidade)

---

## ETAPA 5.1: Adicionar Testes Unitários

### **📝 Descrição**
Criar testes unitários para serviços e validadores.

### **🎯 Objetivo**
- Prevenir regressões
- Documentar comportamento esperado
- Facilitar refactoring futuro

### **📂 Arquivos Afetados**
1. ✅ `/modules/vehicles/services/__tests__/VehicleStatusService.test.ts` (NOVO)
2. ✅ `/modules/vehicles/validators/__tests__/vehicleValidators.test.ts` (NOVO)

### **🔧 Implementação (Exemplo com Vitest)**

```typescript
// VehicleStatusService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { VehicleStatusService } from '../VehicleStatusService';
import { VehicleStatus } from '../../constants/vehicleStatus';
import { ApiError } from '@/modules/common/errors/ApiError';

describe('VehicleStatusService', () => {
  it('deve atualizar status com sucesso', async () => {
    // Mock do repository
    const mockRepo = {
      findById: vi.fn().mockResolvedValue({
        id: 'test-id',
        status: VehicleStatus.CHEGADA_CONFIRMADA,
      }),
      updateStatus: vi.fn().mockResolvedValue(undefined),
    };

    const mockHistoryRepo = {
      findLatestByVehicleId: vi.fn().mockResolvedValue({
        status: VehicleStatus.EM_ANALISE,
      }),
    };

    const service = new VehicleStatusService(mockRepo, mockHistoryRepo);

    const result = await service.updateStatus({
      vehicleId: 'test-id',
      newStatus: VehicleStatus.EM_ANALISE,
    });

    expect(result.success).toBe(true);
    expect(result.newStatus).toBe(VehicleStatus.EM_ANALISE);
    expect(mockRepo.updateStatus).toHaveBeenCalledWith('test-id', VehicleStatus.EM_ANALISE);
  });

  it('deve lançar erro se transição inválida', async () => {
    const mockRepo = {
      findById: vi.fn().mockResolvedValue({
        id: 'test-id',
        status: VehicleStatus.AGUARDANDO_COLETA,
      }),
      updateStatus: vi.fn(),
    };

    const mockHistoryRepo = {};

    const service = new VehicleStatusService(mockRepo, mockHistoryRepo);

    await expect(
      service.updateStatus({
        vehicleId: 'test-id',
        newStatus: VehicleStatus.FASE_EXECUCAO_INICIADA, // Pulo inválido
      })
    ).rejects.toThrow(ApiError);

    expect(mockRepo.updateStatus).not.toHaveBeenCalled();
  });

  it('deve permitir transição para mesmo status', async () => {
    const mockRepo = {
      findById: vi.fn().mockResolvedValue({
        id: 'test-id',
        status: VehicleStatus.EM_ANALISE,
      }),
      updateStatus: vi.fn().mockResolvedValue(undefined),
    };

    const mockHistoryRepo = {
      findLatestByVehicleId: vi.fn().mockResolvedValue({
        status: VehicleStatus.EM_ANALISE,
      }),
    };

    const service = new VehicleStatusService(mockRepo, mockHistoryRepo);

    const result = await service.updateStatus({
      vehicleId: 'test-id',
      newStatus: VehicleStatus.EM_ANALISE, // Mesmo status
    });

    expect(result.success).toBe(true);
  });
});
```

### **⚠️ Riscos**
- 🟢 **Baixo:** Apenas testes, não afeta produção

### **✅ Validação Manual**
```bash
npm run test
# Todos os testes devem passar
```

### **⏱️ Tempo Estimado:** 8 horas (cobertura de ~80%)

### **📊 Status:** ⏳ PENDENTE

---

## ETAPA 5.2: Documentação de API

### **📝 Descrição**
Documentar todos os endpoints de API com OpenAPI/Swagger.

### **🎯 Objetivo**
- Documentação automática
- Facilitar integração
- Contrato de API claro

### **📂 Arquivos Afetados**
1. ✅ `/docs/api/openapi.yaml` (NOVO)
2. ✅ `/app/api/docs/route.ts` (NOVO - Swagger UI)

### **🔧 Implementação (Exemplo)**

```yaml
# /docs/api/openapi.yaml
openapi: 3.0.0
info:
  title: Proline Homolog API
  version: 1.0.0
  description: API para gerenciamento de veículos e checklists

paths:
  /api/specialist/start-analysis:
    post:
      summary: Inicia análise de veículo
      tags:
        - Specialist
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                vehicleId:
                  type: string
                  format: uuid
              required:
                - vehicleId
      responses:
        '200':
          description: Análise iniciada com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  previousStatus:
                    type: string
                  newStatus:
                    type: string
        '400':
          description: Requisição inválida
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '404':
          description: Veículo não encontrado
          
components:
  schemas:
    Error:
      type: object
      properties:
        error:
          type: string
        code:
          type: string
```

### **⚠️ Riscos**
- 🟢 **Baixo:** Apenas documentação

### **✅ Validação Manual**
- [ ] Acessar `/api/docs` e ver Swagger UI
- [ ] Testar endpoints pela interface

### **⏱️ Tempo Estimado:** 4 horas

### **📊 Status:** ⏳ PENDENTE

---

## ETAPA 5.3: Code Review Final

### **📝 Descrição**
Revisão final de todo código refatorado.

### **🎯 Objetivo**
- Garantir qualidade
- Identificar pontos de melhoria restantes
- Validar que DEVELOPMENT_INSTRUCTIONS foram seguidas

### **📂 Checklist**

**DEVELOPMENT_INSTRUCTIONS:**
- [ ] ✅ **DRY:** Código de validação não está duplicado
- [ ] ✅ **SOLID-SRP:** Endpoints têm no máximo 2 responsabilidades
- [ ] ✅ **Object Calisthenics:** Máximo 2 níveis de indentação
- [ ] ✅ **Modular:** Serviços em `/modules`, separados por domínio
- [ ] ✅ **Testável:** Serviços têm testes unitários

**Qualidade:**
- [ ] ✅ Nenhum endpoint > 100 linhas
- [ ] ✅ Funções < 20 linhas
- [ ] ✅ Logging consistente
- [ ] ✅ Error handling padronizado

**Documentação:**
- [ ] ✅ README atualizado
- [ ] ✅ API documentada
- [ ] ✅ Serviços têm JSDoc

### **⏱️ Tempo Estimado:** 4 horas

### **📊 Status:** ⏳ PENDENTE

---

## 📊 **PROGRESSO GERAL (COMPLETO)**

| Fase | Etapas | Completas | Progresso |
|------|--------|-----------|-----------|
| Fase 0 | 2 | 0 | ⬜⬜⬜⬜⬜ 0% |
| Fase 1 | 3 | 0 | ⬜⬜⬜⬜⬜ 0% |
| Fase 2 | 3 | 0 | ⬜⬜⬜⬜⬜ 0% |
| Fase 3 | 5 | 0 | ⬜⬜⬜⬜⬜ 0% |
| Fase 4 | 3 | 0 | ⬜⬜⬜⬜⬜ 0% |
| Fase 5 | 3 | 0 | ⬜⬜⬜⬜⬜ 0% |
| **TOTAL** | **19** | **0** | **0%** |

---

## ✅ **CONCLUSÃO DO ROADMAP**

Este roadmap fornece um caminho claro e incremental para:
1. ✅ Corrigir problemas críticos (Fase 1)
2. ✅ Padronizar código (Fase 2)
3. ✅ Refatorar incrementalmente (Fase 3)
4. ✅ Melhorar arquitetura (Fase 4)
5. ✅ Garantir qualidade (Fase 5)

**Tempo Total Estimado:** 6-8 semanas  
**Risco:** Controlado (mudanças graduais)  
**Benefício:** Código sustentável e testável

---

**Criado em:** 2025-10-08  
**Baseado em:** `/docs/timeline-analysis/`  
**Próxima revisão:** Após conclusão de cada fase
