# 🗺️ Roadmap de Melhorias Graduais - Sistema de Timeline

**Data de Criação:** 2025-10-08  
**Baseado em:** Análise completa em `/docs/timeline-analysis/`  
**Princípios:** DRY, SOLID, Object Calisthenics, Arquitetura Modular  
**Estratégia:** Melhorias incrementais mantendo código em produção

---

## 📋 **VISÃO GERAL**

Este roadmap foi criado para implementar as melhorias identificadas na análise técnica de forma **gradual e segura**, garantindo que o sistema permaneça funcional em produção após cada etapa.

### **Princípios do Roadmap:**
1. ✅ **Incrementalidade:** Uma melhoria por vez
2. ✅ **Testabilidade:** Cada etapa deve ser testável manualmente
3. ✅ **Reversibilidade:** Mudanças podem ser revertidas se necessário
4. ✅ **Compatibilidade:** Manter compatibilidade com código existente
5. ✅ **Documentação:** Cada etapa documenta suas mudanças

---

## 🎯 **ESTRUTURA DO ROADMAP**

### **Fases:**
- **Fase 0:** Preparação e Diagnóstico (1 dia)
- **Fase 1:** Correções Críticas (2 dias)
- **Fase 2:** Padronização e Limpeza (1 semana)
- **Fase 3:** Refactoring Modular (2 semanas)
- **Fase 4:** Arquitetura e Serviços (2 semanas)
- **Fase 5:** Qualidade e Testes (1 semana)

### **Cada Etapa Contém:**
- 📝 **Descrição:** O que será feito
- 🎯 **Objetivo:** Por que fazer
- 📂 **Arquivos Afetados:** Lista completa
- ⚠️ **Riscos:** Pontos de atenção
- ✅ **Validação Manual:** Como testar
- 🔄 **Rollback:** Como reverter se necessário
- ⏱️ **Tempo Estimado:** Duração
- 📊 **Progresso:** Status da etapa

---

## 📊 **MAPA VISUAL DE DEPENDÊNCIAS**

```
FASE 0: Preparação
    └─> ETAPA 0.1: Diagnóstico SQL
    └─> ETAPA 0.2: Backup e Documentação

FASE 1: Correções Críticas
    └─> ETAPA 1.1: Padronizar Formato de Status
    └─> ETAPA 1.2: Verificar Trigger
    └─> ETAPA 1.3: Criar Constants Centralizadas

FASE 2: Padronização
    └─> ETAPA 2.1: Extrair Funções de Validação
    └─> ETAPA 2.2: Padronizar Error Handling
    └─> ETAPA 2.3: Padronizar Logging

FASE 3: Refactoring Modular
    └─> ETAPA 3.1: Criar VehicleStatusService
    └─> ETAPA 3.2: Refatorar start-analysis
    └─> ETAPA 3.3: Refatorar finalize-checklist
    └─> ETAPA 3.4: Refatorar checklist/init
    └─> ETAPA 3.5: Refatorar save-vehicle-checklist

FASE 4: Arquitetura
    └─> ETAPA 4.1: Criar Repository Layer
    └─> ETAPA 4.2: Separar Serviços
    └─> ETAPA 4.3: Implementar Value Objects

FASE 5: Qualidade
    └─> ETAPA 5.1: Adicionar Testes Unitários
    └─> ETAPA 5.2: Documentação de API
    └─> ETAPA 5.3: Code Review Final
```

---

# FASE 0: PREPARAÇÃO E DIAGNÓSTICO

**Objetivo:** Garantir que temos visibilidade completa antes de fazer mudanças  
**Duração:** 1 dia  
**Risco:** 🟢 Baixo (apenas leitura)

---

## ETAPA 0.1: Diagnóstico SQL do Trigger

### **📝 Descrição**
Executar script de diagnóstico para entender estado atual do trigger `vehicle_history_trigger`.

### **🎯 Objetivo**
- Confirmar se trigger está ativo
- Identificar inconsistências de formato de status
- Verificar se há registros órfãos (vehicles sem history)

### **📂 Arquivos Envolvidos**
- ✅ **Executar:** `/scripts/diagnose-vehicle-history-trigger.sql`
- ✅ **Documentar resultados em:** `/docs/timeline-analysis/diagnostics/` (nova pasta)

### **⚠️ Riscos**
- Nenhum (apenas SELECT queries)

### **✅ Validação Manual**
```sql
-- Após executar o script, verificar:
-- 1. Trigger está ENABLED?
-- 2. Formatos de status consistentes?
-- 3. Todas as mudanças recentes têm histórico?
```

### **📊 Checklist de Execução**
- [ ] Executar script SQL no Supabase Dashboard
- [ ] Salvar resultados em arquivo texto
- [ ] Identificar problemas críticos
- [ ] Documentar descobertas

### **⏱️ Tempo Estimado:** 30 minutos

### **📊 Status:** ⏳ PENDENTE

---

## ETAPA 0.2: Criar Backup e Documentação do Estado Atual

### **📝 Descrição**
Criar snapshot do código atual antes de iniciar modificações.

### **🎯 Objetivo**
- Ter ponto de restauração seguro
- Documentar estado "antes" para comparação

### **📂 Arquivos Envolvidos**
```bash
# Criar branch de backup
git checkout -b backup/before-refactoring-2025-10-08
git push origin backup/before-refactoring-2025-10-08

# Documentar arquivos que serão modificados
docs/timeline-analysis/roadmap/FILES_TO_MODIFY.md
```

### **⚠️ Riscos**
- Nenhum (apenas backup)

### **✅ Validação Manual**
- [ ] Branch de backup criada
- [ ] Lista de arquivos documentada
- [ ] Estado atual commit pushado

### **⏱️ Tempo Estimado:** 30 minutos

### **📊 Status:** ⏳ PENDENTE

---

# FASE 1: CORREÇÕES CRÍTICAS

**Objetivo:** Corrigir problemas que impedem funcionamento correto  
**Duração:** 2 dias  
**Risco:** 🟡 Médio (mudanças em produção)

---

## ETAPA 1.1: Padronizar Formato de Status

### **📝 Descrição**
Corrigir inconsistência entre `'ANALISE FINALIZADA'` (sem acento) e `'ANÁLISE FINALIZADA'` (com acento).

### **🎯 Objetivo**
- Garantir que trigger funcione corretamente
- Eliminar mismatch de formatos

### **📂 Arquivos Afetados**
1. ✅ `/modules/vehicles/constants/vehicleStatus.ts`
2. ✅ Migration: `20251008_fix_status_format.sql` (NOVA)

### **🔧 Implementação**

#### **1.1.1: Atualizar Constantes TypeScript**

```typescript
// /modules/vehicles/constants/vehicleStatus.ts
export const VehicleStatus = {
  AGUARDANDO_COLETA: 'AGUARDANDO COLETA',
  AGUARDANDO_CHEGADA: 'AGUARDANDO CHEGADA DO VEÍCULO',
  CHEGADA_CONFIRMADA: 'CHEGADA CONFIRMADA',
  EM_ANALISE: 'EM ANÁLISE',                      // ✅ Já tem acento
  ANALISE_FINALIZADA: 'ANÁLISE FINALIZADA',      // ✅ ADICIONAR ACENTO
  ORCAMENTO_APROVADO: 'ORÇAMENTO APROVADO',      // ✅ Padronizar
  FASE_EXECUCAO_INICIADA: 'FASE DE EXECUÇÃO INICIADA',
} as const;
```

#### **1.1.2: Criar Migration Idempotente**

```sql
-- 20251008_fix_status_format.sql
-- Padronizar formatos de status com acentos

-- Atualizar tabela vehicles
UPDATE vehicles
SET status = 'ANÁLISE FINALIZADA'
WHERE status = 'ANALISE FINALIZADA';

UPDATE vehicles
SET status = 'EM ANÁLISE'
WHERE status = 'EM ANALISE';

-- Atualizar tabela vehicle_history
UPDATE vehicle_history
SET status = 'ANÁLISE FINALIZADA'
WHERE status = 'ANALISE FINALIZADA';

UPDATE vehicle_history
SET status = 'EM ANÁLISE'
WHERE status = 'EM ANALISE';

-- Verificar resultado
DO $$
BEGIN
  RAISE NOTICE 'Padronização concluída';
  RAISE NOTICE 'Vehicles com ANÁLISE FINALIZADA: %', 
    (SELECT COUNT(*) FROM vehicles WHERE status = 'ANÁLISE FINALIZADA');
  RAISE NOTICE 'History com ANÁLISE FINALIZADA: %', 
    (SELECT COUNT(*) FROM vehicle_history WHERE status = 'ANÁLISE FINALIZADA');
END $$;
```

### **⚠️ Riscos**
- 🟡 **Médio:** Mudança em constantes usadas em muitos lugares
- ⚠️ **Atenção:** TypeScript pode apontar erros em comparações hardcoded

### **✅ Validação Manual**

#### **Pré-Deploy:**
```bash
# 1. Verificar build
npm run build

# 2. Verificar TypeScript
npx tsc --noEmit

# 3. Buscar usos hardcoded
grep -r "ANALISE FINALIZADA" app/ modules/ --include="*.ts" --include="*.tsx"
```

#### **Pós-Deploy:**
```sql
-- Verificar que não há mais formatos antigos
SELECT DISTINCT status FROM vehicles WHERE status LIKE '%ANALISE%';
SELECT DISTINCT status FROM vehicle_history WHERE status LIKE '%ANALISE%';

-- Deve retornar apenas:
-- 'EM ANÁLISE'
-- 'ANÁLISE FINALIZADA'
```

#### **Teste Funcional:**
1. [ ] Especialista pode iniciar análise
2. [ ] Especialista pode finalizar checklist
3. [ ] Timeline mostra "EM ANÁLISE"
4. [ ] Timeline mostra "ANÁLISE FINALIZADA"

### **🔄 Rollback**
```bash
# Se houver problemas:
git revert <commit-hash>
npm run build
# Reverter migration manualmente no banco
```

### **⏱️ Tempo Estimado:** 2 horas

### **📊 Status:** ⏳ PENDENTE

---

## ETAPA 1.2: Verificar e Corrigir Trigger

### **📝 Descrição**
Garantir que trigger `vehicle_history_trigger` está ativo e funcionando.

### **🎯 Objetivo**
- Confirmar trigger está habilitado
- Testar que trigger cria registros automaticamente

### **📂 Arquivos Afetados**
- ✅ Banco de dados (trigger)
- ✅ Migration (se necessário): `20251008_verify_trigger.sql`

### **🔧 Implementação**

```sql
-- 20251008_verify_trigger.sql
-- Verificar e reativar trigger se necessário

DO $$
DECLARE
  trigger_enabled CHAR(1);
BEGIN
  -- Verificar status do trigger
  SELECT tgenabled INTO trigger_enabled
  FROM pg_trigger
  WHERE tgname = 'vehicle_history_trigger';

  IF trigger_enabled IS NULL THEN
    RAISE EXCEPTION 'Trigger vehicle_history_trigger não existe!';
  END IF;

  IF trigger_enabled = 'D' THEN
    RAISE NOTICE 'Trigger estava desabilitado. Reativando...';
    ALTER TABLE vehicles ENABLE TRIGGER vehicle_history_trigger;
    RAISE NOTICE 'Trigger reativado!';
  ELSE
    RAISE NOTICE 'Trigger já está ativo (status: %)', trigger_enabled;
  END IF;
END $$;

-- Teste do trigger
DO $$
DECLARE
  test_vehicle_id UUID;
  old_status TEXT;
  history_count_before INT;
  history_count_after INT;
BEGIN
  -- Selecionar um veículo de teste
  SELECT id, status INTO test_vehicle_id, old_status
  FROM vehicles
  WHERE status = 'CHEGADA CONFIRMADA'
  LIMIT 1;

  IF test_vehicle_id IS NULL THEN
    RAISE NOTICE 'Nenhum veículo de teste encontrado. Pulando teste.';
    RETURN;
  END IF;

  -- Contar histórico antes
  SELECT COUNT(*) INTO history_count_before
  FROM vehicle_history
  WHERE vehicle_id = test_vehicle_id;

  RAISE NOTICE 'Testando trigger com veículo: %', test_vehicle_id;
  RAISE NOTICE 'Histórico antes: % registros', history_count_before;

  -- Atualizar status (deve disparar trigger)
  UPDATE vehicles
  SET status = 'EM ANÁLISE'
  WHERE id = test_vehicle_id;

  -- Contar histórico depois
  SELECT COUNT(*) INTO history_count_after
  FROM vehicle_history
  WHERE vehicle_id = test_vehicle_id;

  RAISE NOTICE 'Histórico depois: % registros', history_count_after;

  IF history_count_after > history_count_before THEN
    RAISE NOTICE '✅ TRIGGER FUNCIONANDO! Novo registro criado.';
  ELSE
    RAISE EXCEPTION '❌ TRIGGER NÃO FUNCIONOU! Nenhum registro criado.';
  END IF;

  -- Reverter mudança de teste
  UPDATE vehicles
  SET status = old_status
  WHERE id = test_vehicle_id;

  RAISE NOTICE 'Teste concluído. Status revertido.';
END $$;
```

### **⚠️ Riscos**
- 🟢 **Baixo:** Apenas verificação e teste

### **✅ Validação Manual**
```sql
-- Após executar migration:
-- 1. Verificar que teste passou
-- 2. Confirmar trigger ativo
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'vehicle_history_trigger';
-- Deve retornar tgenabled = 'O' (enabled)
```

### **⏱️ Tempo Estimado:** 1 hora

### **📊 Status:** ⏳ PENDENTE

---

## ETAPA 1.3: Criar Constants Centralizadas para Status

### **📝 Descrição**
Adicionar tipos e helpers para trabalhar com status de forma type-safe.

### **🎯 Objetivo**
- Prevenir typos
- Facilitar refactoring futuro
- Melhorar autocomplete no IDE

### **📂 Arquivos Afetados**
1. ✅ `/modules/vehicles/constants/vehicleStatus.ts` (MODIFICAR)
2. ✅ `/modules/vehicles/types/vehicleStatus.types.ts` (NOVO)

### **🔧 Implementação**

```typescript
// /modules/vehicles/constants/vehicleStatus.ts
export const VehicleStatus = {
  AGUARDANDO_COLETA: 'AGUARDANDO COLETA',
  AGUARDANDO_CHEGADA: 'AGUARDANDO CHEGADA DO VEÍCULO',
  CHEGADA_CONFIRMADA: 'CHEGADA CONFIRMADA',
  EM_ANALISE: 'EM ANÁLISE',
  ANALISE_FINALIZADA: 'ANÁLISE FINALIZADA',
  ORCAMENTO_APROVADO: 'ORÇAMENTO APROVADO',
  FASE_EXECUCAO_INICIADA: 'FASE DE EXECUÇÃO INICIADA',
} as const;

export type VehicleStatusType = (typeof VehicleStatus)[keyof typeof VehicleStatus];

// Helper para validação
export function isValidVehicleStatus(status: string): status is VehicleStatusType {
  return Object.values(VehicleStatus).includes(status as VehicleStatusType);
}

// Helper para comparação case-insensitive
export function normalizeStatus(status: string): VehicleStatusType | null {
  const normalized = status.toUpperCase().trim();
  const found = Object.values(VehicleStatus).find(
    (s) => s.toUpperCase() === normalized
  );
  return found || null;
}
```

```typescript
// /modules/vehicles/types/vehicleStatus.types.ts (NOVO)
import { VehicleStatus, VehicleStatusType } from '../constants/vehicleStatus';

/**
 * Mapa de transições válidas de status
 * Cada status pode transitar apenas para os status listados
 */
export const STATUS_TRANSITIONS: Record<VehicleStatusType, VehicleStatusType[]> = {
  [VehicleStatus.AGUARDANDO_COLETA]: [VehicleStatus.AGUARDANDO_CHEGADA],
  [VehicleStatus.AGUARDANDO_CHEGADA]: [VehicleStatus.CHEGADA_CONFIRMADA],
  [VehicleStatus.CHEGADA_CONFIRMADA]: [VehicleStatus.EM_ANALISE],
  [VehicleStatus.EM_ANALISE]: [
    VehicleStatus.ANALISE_FINALIZADA,
    VehicleStatus.EM_ANALISE, // Permite salvar rascunho
  ],
  [VehicleStatus.ANALISE_FINALIZADA]: [VehicleStatus.ORCAMENTO_APROVADO],
  [VehicleStatus.ORCAMENTO_APROVADO]: [VehicleStatus.FASE_EXECUCAO_INICIADA],
  [VehicleStatus.FASE_EXECUCAO_INICIADA]: [],
};

/**
 * Valida se transição de status é permitida
 */
export function canTransition(
  from: VehicleStatusType,
  to: VehicleStatusType
): boolean {
  const allowedTransitions = STATUS_TRANSITIONS[from] || [];
  return allowedTransitions.includes(to);
}

/**
 * Retorna próximos status válidos a partir do atual
 */
export function getNextStatuses(current: VehicleStatusType): VehicleStatusType[] {
  return STATUS_TRANSITIONS[current] || [];
}
```

### **⚠️ Riscos**
- 🟢 **Baixo:** Apenas adição de código, não modifica comportamento

### **✅ Validação Manual**
```typescript
// Testar em um arquivo qualquer:
import { VehicleStatus, isValidVehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';
import { canTransition } from '@/modules/vehicles/types/vehicleStatus.types';

console.log(isValidVehicleStatus('EM ANÁLISE')); // true
console.log(isValidVehicleStatus('INVALIDO')); // false

console.log(canTransition(
  VehicleStatus.CHEGADA_CONFIRMADA,
  VehicleStatus.EM_ANALISE
)); // true

console.log(canTransition(
  VehicleStatus.CHEGADA_CONFIRMADA,
  VehicleStatus.FASE_EXECUCAO_INICIADA
)); // false
```

### **🔄 Rollback**
```bash
# Fácil: apenas remover arquivos novos
git revert <commit-hash>
```

### **⏱️ Tempo Estimado:** 1 hora

### **📊 Status:** ⏳ PENDENTE

---

# FASE 2: PADRONIZAÇÃO E LIMPEZA

**Objetivo:** Padronizar código existente sem mudar arquitetura  
**Duração:** 1 semana  
**Risco:** 🟢 Baixo (melhorias incrementais)

---

## ETAPA 2.1: Extrair Funções de Validação

### **📝 Descrição**
Criar funções reutilizáveis para validações comuns (vehicleId, status, etc).

### **🎯 Objetivo**
- Reduzir duplicação de código de validação
- Padronizar mensagens de erro
- Facilitar manutenção

### **📂 Arquivos Afetados**
1. ✅ `/modules/vehicles/validators/vehicleValidators.ts` (NOVO)
2. ✅ `/app/api/specialist/start-analysis/route.ts` (MODIFICAR)
3. ✅ `/app/api/specialist/finalize-checklist/route.ts` (MODIFICAR)
4. ✅ `/app/api/partner/checklist/init/route.ts` (MODIFICAR)

### **🔧 Implementação**

```typescript
// /modules/vehicles/validators/vehicleValidators.ts (NOVO)
import { VehicleStatusType } from '../types/vehicleStatus.types';
import { isValidVehicleStatus } from '../constants/vehicleStatus';

export class ValidationError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Valida se vehicleId está presente e é válido
 */
export function validateVehicleId(vehicleId: unknown): asserts vehicleId is string {
  if (!vehicleId) {
    throw new ValidationError('vehicleId é obrigatório');
  }

  if (typeof vehicleId !== 'string') {
    throw new ValidationError('vehicleId deve ser uma string');
  }

  // UUID v4 validation (básico)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(vehicleId)) {
    throw new ValidationError('vehicleId inválido');
  }
}

/**
 * Valida se status é válido
 */
export function validateStatus(status: unknown): asserts status is VehicleStatusType {
  if (!status) {
    throw new ValidationError('Status é obrigatório');
  }

  if (typeof status !== 'string') {
    throw new ValidationError('Status deve ser uma string');
  }

  if (!isValidVehicleStatus(status)) {
    throw new ValidationError(`Status inválido: ${status}`);
  }
}

/**
 * Valida se transição de status é permitida
 */
export function validateStatusTransition(
  from: VehicleStatusType,
  to: VehicleStatusType,
  allowedFrom: VehicleStatusType[]
): void {
  if (!allowedFrom.includes(from) && from !== to) {
    throw new ValidationError(
      `Transição de ${from} para ${to} não é permitida. Status atual deve ser: ${allowedFrom.join(', ')}`
    );
  }
}
```

### **Exemplo de Uso (start-analysis):**

```typescript
// /app/api/specialist/start-analysis/route.ts
import { validateVehicleId, validateStatusTransition, ValidationError } from '@/modules/vehicles/validators/vehicleValidators';
import { VehicleStatus } from '@/modules/vehicles/constants/vehicleStatus';

export const POST = createVehicleActionHandler(async ({ vehicleId, supabase }) => {
  try {
    // Validação centralizada
    validateVehicleId(vehicleId);

    const { data: veh, error: vehErr } = await supabase
      .from('vehicles')
      .select('status')
      .eq('id', vehicleId)
      .single();

    if (vehErr || !veh) {
      throw new ValidationError('Veículo não encontrado', 404);
    }

    // Validação de transição centralizada
    validateStatusTransition(
      veh.status,
      VehicleStatus.EM_ANALISE,
      [VehicleStatus.CHEGADA_CONFIRMADA, VehicleStatus.EM_ANALISE]
    );

    // Resto do código...
    const { error: updErr } = await supabase
      .from('vehicles')
      .update({ status: VehicleStatus.EM_ANALISE })
      .eq('id', vehicleId);

    if (updErr) {
      throw new Error('Erro ao atualizar status');
    }

    return { json: { success: true }, status: 200 };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { json: { error: error.message }, status: error.statusCode };
    }
    return { json: { error: 'Erro interno' }, status: 500 };
  }
});
```

### **⚠️ Riscos**
- 🟢 **Baixo:** Apenas extração de lógica existente

### **✅ Validação Manual**
1. [ ] Especialista pode iniciar análise (status válido)
2. [ ] Erro apropriado se status inválido
3. [ ] Mensagem de erro clara e consistente

### **⏱️ Tempo Estimado:** 3 horas

### **📊 Status:** ⏳ PENDENTE

---

## ETAPA 2.2: Padronizar Error Handling

### **📝 Descrição**
Criar middleware/helper para tratamento consistente de erros.

### **🎯 Objetivo**
- Erros consistentes em todas as APIs
- Logging automático de erros
- Melhor experiência para debug

### **📂 Arquivos Afetados**
1. ✅ `/modules/common/errors/ApiError.ts` (NOVO)
2. ✅ `/modules/common/middleware/errorHandler.ts` (NOVO)
3. ✅ Todos os endpoints de API (gradualmente)

### **🔧 Implementação**

```typescript
// /modules/common/errors/ApiError.ts (NOVO)
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, code?: string): ApiError {
    return new ApiError(message, 400, code);
  }

  static unauthorized(message: string = 'Não autorizado'): ApiError {
    return new ApiError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Acesso negado'): ApiError {
    return new ApiError(message, 403, 'FORBIDDEN');
  }

  static notFound(message: string = 'Recurso não encontrado'): ApiError {
    return new ApiError(message, 404, 'NOT_FOUND');
  }

  static internal(message: string = 'Erro interno do servidor'): ApiError {
    return new ApiError(message, 500, 'INTERNAL_ERROR');
  }
}
```

```typescript
// /modules/common/middleware/errorHandler.ts (NOVO)
import { NextResponse } from 'next/server';
import { ApiError } from '../errors/ApiError';
import { logger } from '@/modules/logger';

export function handleApiError(error: unknown, context?: Record<string, any>) {
  // ApiError personalizado
  if (error instanceof ApiError) {
    logger.warn('api_error', {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      ...context,
    });

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  // Erro desconhecido
  const err = error as Error;
  logger.error('unexpected_error', {
    message: err.message,
    stack: err.stack,
    ...context,
  });

  return NextResponse.json(
    {
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}
```

### **⚠️ Riscos**
- 🟢 **Baixo:** Apenas padronização de erros

### **✅ Validação Manual**
1. [ ] Erro 400 retorna mensagem clara
2. [ ] Erro 404 para recurso não encontrado
3. [ ] Erro 500 para problemas internos
4. [ ] Logs incluem contexto suficiente

### **⏱️ Tempo Estimado:** 2 horas

### **📊 Status:** ⏳ PENDENTE

---

## ETAPA 2.3: Padronizar Logging

### **📝 Descrição**
Garantir que todos os endpoints usam logging consistente.

### **🎯 Objetivo**
- Facilitar debugging
- Rastreamento de operações
- Métricas consistentes

### **📂 Arquivos Afetados**
- Todos os endpoints de API (revisar um por um)

### **🔧 Implementação**

**Padrão de Logging:**
```typescript
// Início da operação
logger.info('operation_started', {
  operation: 'start_analysis',
  vehicleId: vehicleId.slice(0, 8),
  userId: req.userId.slice(0, 8),
});

// Sucesso
logger.info('operation_completed', {
  operation: 'start_analysis',
  vehicleId: vehicleId.slice(0, 8),
  duration: Date.now() - startTime,
});

// Erro
logger.error('operation_failed', {
  operation: 'start_analysis',
  vehicleId: vehicleId.slice(0, 8),
  error: error.message,
});
```

### **⚠️ Riscos**
- 🟢 **Baixo:** Apenas adicionar logs

### **✅ Validação Manual**
1. [ ] Logs aparecem no console/monitoring
2. [ ] Logs incluem informações suficientes
3. [ ] IDs sensíveis são truncados

### **⏱️ Tempo Estimado:** 2 horas

### **📊 Status:** ⏳ PENDENTE

---

# FASE 3: REFACTORING MODULAR

**Objetivo:** Extrair serviços e reduzir complexidade  
**Duração:** 2 semanas  
**Risco:** 🟡 Médio (mudanças estruturais)

*(Continua no próximo documento...)*

---

## 📊 **PROGRESSO GERAL**

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

## 📝 **PRÓXIMOS PASSOS**

1. ✅ **LER:** Este roadmap completamente
2. ✅ **EXECUTAR:** Fase 0 (Diagnóstico)
3. ✅ **VALIDAR:** Resultados do diagnóstico
4. ✅ **INICIAR:** Fase 1, Etapa 1.1

---

**Criado em:** 2025-10-08  
**Baseado em:** `/docs/timeline-analysis/`  
**Próxima revisão:** Após conclusão de cada fase
