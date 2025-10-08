# 🔧 Diagnóstico Técnico: Trigger vehicle_history_trigger

**Data:** 2025-01-09  
**Objetivo:** Verificar funcionamento do trigger automático de vehicle_history

---

## 📋 **PROBLEMA REPORTADO**

**Sintoma:**
- Status do veículo muda para "ANALISE FINALIZADA" ✅
- Timeline NÃO mostra o evento na interface ❌

**Evidência:**
- Screenshot mostra status atualizado mas ausente na timeline
- Parceiro insere manualmente na `vehicle_history` e funciona
- Especialista depende do trigger e não funciona

---

## 🔍 **HIPÓTESES**

### **Hipótese 1: Formato de Status Incompatível**
**Probabilidade:** 🔴 ALTA (90%)

**Descrição:**
Código TypeScript usa `'ANALISE FINALIZADA'` (sem acento), mas trigger SQL pode estar esperando `'ANÁLISE FINALIZADA'` (com acento).

**Como Verificar:**
```sql
-- 1. Ver status reais na tabela vehicles
SELECT DISTINCT status, COUNT(*) as count
FROM vehicles
GROUP BY status
ORDER BY status;

-- 2. Ver status reais na vehicle_history
SELECT DISTINCT status, COUNT(*) as count
FROM vehicle_history
GROUP BY status
ORDER BY status;

-- 3. Comparar formatos
SELECT 
  v.status as vehicle_status,
  vh.status as history_status,
  v.updated_at as vehicle_updated,
  vh.created_at as history_created
FROM vehicles v
LEFT JOIN vehicle_history vh ON vh.vehicle_id = v.id
WHERE v.status LIKE '%ANÁLISE%' OR v.status LIKE '%ANALISE%'
ORDER BY v.updated_at DESC
LIMIT 20;
```

---

### **Hipótese 2: Trigger Desativado ou Com Erro**
**Probabilidade:** 🟠 MÉDIA (40%)

**Descrição:**
Trigger pode estar desativado ou com erro silencioso que impede execução.

**Como Verificar:**
```sql
-- 1. Verificar se trigger existe e está ativo
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement,
  action_orientation
FROM information_schema.triggers
WHERE trigger_name = 'vehicle_history_trigger';

-- 2. Ver definição completa do trigger
SELECT 
  tgname as trigger_name,
  tgenabled as is_enabled,  -- 'O' = enabled, 'D' = disabled
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'vehicle_history_trigger';

-- 3. Verificar logs de erro (se disponível)
SELECT * FROM pg_stat_activity 
WHERE query LIKE '%vehicle_history%';
```

---

### **Hipótese 3: Condição do Trigger Não Satisfeita**
**Probabilidade:** 🟡 BAIXA (20%)

**Descrição:**
Trigger tem condição `NEW.status IS DISTINCT FROM OLD.status`, pode não estar detectando mudança.

**Como Verificar:**
```sql
-- Ver código da função do trigger
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'log_vehicle_history';

-- Testar manualmente
DO $$
DECLARE
    test_vehicle_id UUID := '<VEHICLE_ID>';
    old_status TEXT;
    new_status TEXT := 'ANALISE FINALIZADA';
BEGIN
    -- Pegar status atual
    SELECT status INTO old_status FROM vehicles WHERE id = test_vehicle_id;
    
    RAISE NOTICE 'Status atual: %', old_status;
    RAISE NOTICE 'Novo status: %', new_status;
    RAISE NOTICE 'São diferentes? %', (old_status IS DISTINCT FROM new_status);
    
    -- Atualizar
    UPDATE vehicles SET status = new_status WHERE id = test_vehicle_id;
    
    -- Ver se criou registro
    PERFORM * FROM vehicle_history 
    WHERE vehicle_id = test_vehicle_id AND status = new_status;
    
    IF FOUND THEN
        RAISE NOTICE 'Trigger funcionou! Registro criado.';
    ELSE
        RAISE NOTICE 'Trigger NÃO funcionou! Registro não foi criado.';
    END IF;
END $$;
```

---

### **Hipótese 4: Permissões Insuficientes**
**Probabilidade:** 🟡 BAIXA (10%)

**Descrição:**
Função do trigger pode não ter permissão para inserir na `vehicle_history`.

**Como Verificar:**
```sql
-- Ver permissões da tabela
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'vehicle_history';

-- Ver se função está com SECURITY DEFINER
SELECT 
  proname,
  prosecdef  -- TRUE se SECURITY DEFINER
FROM pg_proc
WHERE proname = 'log_vehicle_history';
```

---

## 🧪 **SCRIPT DE DIAGNÓSTICO COMPLETO**

```sql
-- =====================================================
-- DIAGNÓSTICO COMPLETO: vehicle_history_trigger
-- =====================================================

-- Seção 1: Informações do Trigger
-- =====================================================
SELECT '=== SEÇÃO 1: INFORMAÇÕES DO TRIGGER ===' as section;

SELECT 
  trigger_name,
  event_object_table as target_table,
  action_timing,
  string_agg(event_manipulation, ', ') as events,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'vehicle_history_trigger'
GROUP BY trigger_name, event_object_table, action_timing, action_statement;

-- Verificar se está habilitado
SELECT 
  tgname as trigger_name,
  CASE tgenabled
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    WHEN 'R' THEN 'REPLICA'
    WHEN 'A' THEN 'ALWAYS'
  END as status,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'vehicle_history_trigger';

-- Seção 2: Análise de Status
-- =====================================================
SELECT '=== SEÇÃO 2: ANÁLISE DE STATUS ===' as section;

-- Status únicos na tabela vehicles
SELECT 'Status em vehicles:' as info, status, COUNT(*) as count
FROM vehicles
GROUP BY status
ORDER BY status;

-- Status únicos na vehicle_history
SELECT 'Status em vehicle_history:' as info, status, COUNT(*) as count
FROM vehicle_history
GROUP BY status
ORDER BY status;

-- Veículos com status de análise (ultimos 20)
SELECT 
  v.id,
  v.plate,
  v.status as vehicle_status,
  v.updated_at as vehicle_updated,
  vh.status as history_status,
  vh.created_at as history_created,
  CASE 
    WHEN vh.id IS NULL THEN '❌ SEM HISTÓRICO'
    ELSE '✅ COM HISTÓRICO'
  END as has_history
FROM vehicles v
LEFT JOIN vehicle_history vh ON vh.vehicle_id = v.id 
  AND (vh.status LIKE '%ANÁLISE%' OR vh.status LIKE '%ANALISE%')
WHERE v.status LIKE '%ANÁLISE%' OR v.status LIKE '%ANALISE%'
ORDER BY v.updated_at DESC
LIMIT 20;

-- Seção 3: Comparação de Formatos
-- =====================================================
SELECT '=== SEÇÃO 3: COMPARAÇÃO DE FORMATOS ===' as section;

-- Ver se há mismatch de formatos
WITH vehicle_statuses AS (
  SELECT DISTINCT status FROM vehicles
),
history_statuses AS (
  SELECT DISTINCT status FROM vehicle_history
)
SELECT 
  'Formatos diferentes?' as check_type,
  vs.status as in_vehicles,
  hs.status as in_history,
  CASE 
    WHEN vs.status = hs.status THEN '✅ MATCH'
    WHEN UPPER(vs.status) = UPPER(hs.status) THEN '⚠️ CASE MISMATCH'
    ELSE '❌ FORMATO DIFERENTE'
  END as comparison
FROM vehicle_statuses vs
FULL OUTER JOIN history_statuses hs ON vs.status = hs.status
WHERE vs.status LIKE '%ANÁLISE%' OR vs.status LIKE '%ANALISE%'
   OR hs.status LIKE '%ANÁLISE%' OR hs.status LIKE '%ANALISE%';

-- Seção 4: Código da Função do Trigger
-- =====================================================
SELECT '=== SEÇÃO 4: CÓDIGO DA FUNÇÃO ===' as section;

SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'log_vehicle_history';

-- Seção 5: Teste Manual do Trigger
-- =====================================================
SELECT '=== SEÇÃO 5: TESTE MANUAL (SIMULAÇÃO) ===' as section;

-- Contar registros antes do teste
SELECT 
  'Antes do teste:' as momento,
  COUNT(*) as total_history_records
FROM vehicle_history;

-- IMPORTANTE: Substitua <VEHICLE_ID> por um ID real de veículo em teste
-- Exemplo de teste (comentado para segurança):
/*
DO $$
DECLARE
    test_vehicle_id UUID := '<VEHICLE_ID>';  -- SUBSTITUIR AQUI
    old_status TEXT;
    new_status TEXT := 'EM ANÁLISE';  -- Status de teste
    history_count INTEGER;
BEGIN
    -- Salvar status atual
    SELECT status INTO old_status FROM vehicles WHERE id = test_vehicle_id;
    RAISE NOTICE 'Status original: %', old_status;
    
    -- Contar histórico antes
    SELECT COUNT(*) INTO history_count 
    FROM vehicle_history WHERE vehicle_id = test_vehicle_id;
    RAISE NOTICE 'Registros de histórico antes: %', history_count;
    
    -- Atualizar status
    UPDATE vehicles SET status = new_status WHERE id = test_vehicle_id;
    RAISE NOTICE 'Status atualizado para: %', new_status;
    
    -- Contar histórico depois
    SELECT COUNT(*) INTO history_count 
    FROM vehicle_history WHERE vehicle_id = test_vehicle_id;
    RAISE NOTICE 'Registros de histórico depois: %', history_count;
    
    -- Verificar se novo registro foi criado
    IF EXISTS (
      SELECT 1 FROM vehicle_history 
      WHERE vehicle_id = test_vehicle_id 
        AND status = new_status 
        AND created_at > NOW() - INTERVAL '5 seconds'
    ) THEN
        RAISE NOTICE '✅ TRIGGER FUNCIONOU! Novo registro criado.';
    ELSE
        RAISE NOTICE '❌ TRIGGER NÃO FUNCIONOU! Registro não foi criado.';
    END IF;
    
    -- ROLLBACK (para não afetar dados reais)
    RAISE EXCEPTION 'Teste finalizado. Fazendo rollback...';
END $$;
*/

-- Seção 6: Eventos Recentes de Mudança de Status
-- =====================================================
SELECT '=== SEÇÃO 6: MUDANÇAS RECENTES ===' as section;

SELECT 
  v.id,
  v.plate,
  v.status as current_status,
  v.updated_at as last_vehicle_update,
  (
    SELECT vh.status 
    FROM vehicle_history vh 
    WHERE vh.vehicle_id = v.id 
    ORDER BY vh.created_at DESC 
    LIMIT 1
  ) as last_history_status,
  (
    SELECT vh.created_at 
    FROM vehicle_history vh 
    WHERE vh.vehicle_id = v.id 
    ORDER BY vh.created_at DESC 
    LIMIT 1
  ) as last_history_created,
  CASE 
    WHEN v.updated_at > (
      SELECT COALESCE(MAX(vh.created_at), '1970-01-01'::timestamp)
      FROM vehicle_history vh 
      WHERE vh.vehicle_id = v.id
    ) THEN '❌ VEHICLE MAIS RECENTE (trigger pode não ter disparado)'
    ELSE '✅ HISTORY ATUALIZADO'
  END as sync_status
FROM vehicles v
WHERE v.updated_at > NOW() - INTERVAL '7 days'
  AND (v.status LIKE '%ANÁLISE%' OR v.status LIKE '%ANALISE%')
ORDER BY v.updated_at DESC
LIMIT 20;

-- Seção 7: Inconsistências (Vehicles sem History)
-- =====================================================
SELECT '=== SEÇÃO 7: INCONSISTÊNCIAS ===' as section;

SELECT 
  v.id,
  v.plate,
  v.status,
  v.created_at as vehicle_created,
  v.updated_at as vehicle_updated,
  COUNT(vh.id) as history_count
FROM vehicles v
LEFT JOIN vehicle_history vh ON vh.vehicle_id = v.id
GROUP BY v.id, v.plate, v.status, v.created_at, v.updated_at
HAVING COUNT(vh.id) = 0
ORDER BY v.created_at DESC
LIMIT 10;

-- Seção 8: Sumário Final
-- =====================================================
SELECT '=== SEÇÃO 8: SUMÁRIO ===' as section;

SELECT 
  (SELECT COUNT(*) FROM vehicles) as total_vehicles,
  (SELECT COUNT(DISTINCT vehicle_id) FROM vehicle_history) as vehicles_with_history,
  (SELECT COUNT(*) FROM vehicle_history) as total_history_records,
  (
    SELECT COUNT(*) FROM vehicles v
    WHERE NOT EXISTS (SELECT 1 FROM vehicle_history vh WHERE vh.vehicle_id = v.id)
  ) as vehicles_without_history,
  (
    SELECT CASE tgenabled
      WHEN 'O' THEN '✅ ENABLED'
      WHEN 'D' THEN '❌ DISABLED'
    END
    FROM pg_trigger
    WHERE tgname = 'vehicle_history_trigger'
  ) as trigger_status;
```

---

## 🎯 **COMO EXECUTAR O DIAGNÓSTICO**

### **Opção 1: Supabase Dashboard**
1. Acessar Dashboard do Supabase
2. Ir em **SQL Editor**
3. Colar o script acima
4. Executar
5. Analisar resultados de cada seção

### **Opção 2: psql CLI**
```bash
# Conectar ao banco
psql "postgresql://postgres:[password]@[host]:5432/postgres"

# Executar script
\i diagnose_trigger.sql
```

### **Opção 3: Script Node.js**
```typescript
// scripts/diagnose-trigger.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function diagnoseTrigger() {
  // 1. Verificar trigger
  const { data: triggers } = await supabase.rpc('pg_get_triggers');
  console.log('Triggers:', triggers);

  // 2. Verificar status
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('status')
    .like('status', '%ANALISE%');
  
  console.log('Veículos com status de análise:', vehicles?.length);

  // 3. Verificar histórico
  const { data: history } = await supabase
    .from('vehicle_history')
    .select('*')
    .like('status', '%ANALISE%');
  
  console.log('Registros de histórico de análise:', history?.length);
}

diagnoseTrigger();
```

---

## 📊 **INTERPRETAÇÃO DOS RESULTADOS**

### **Resultado Esperado se Trigger Funcionar:**
```
✅ Trigger ENABLED
✅ Status em vehicles e vehicle_history com MESMO formato
✅ Toda mudança em vehicles tem correspondente em vehicle_history
✅ Timestamps de vehicle_history >= timestamps de vehicles
```

### **Resultado Esperado se Trigger NÃO Funcionar:**
```
❌ Trigger DISABLED ou com erro
❌ Formatos de status diferentes (com/sem acento)
❌ Vehicles atualizados mas vehicle_history vazio
❌ Timestamps de vehicle_history < timestamps de vehicles
```

---

## 🛠️ **CORREÇÕES BASEADAS NO DIAGNÓSTICO**

### **Se Formato de Status Estiver Errado:**
```sql
-- Migration: 20250109_fix_status_format.sql

-- 1. Padronizar status em vehicles
UPDATE vehicles
SET status = 'ANÁLISE FINALIZADA'
WHERE status = 'ANALISE FINALIZADA';

UPDATE vehicles
SET status = 'EM ANÁLISE'
WHERE status = 'EM ANALISE';

-- 2. Padronizar status em vehicle_history
UPDATE vehicle_history
SET status = 'ANÁLISE FINALIZADA'
WHERE status = 'ANALISE FINALIZADA';

UPDATE vehicle_history
SET status = 'EM ANÁLISE'
WHERE status = 'EM ANALISE';

-- 3. Atualizar código TypeScript
-- /modules/vehicles/constants/vehicleStatus.ts
-- EM_ANALISE: 'EM ANÁLISE',              // ✅ Já correto
-- ANALISE_FINALIZADA: 'ANÁLISE FINALIZADA',  // ✅ Adicionar acento
```

### **Se Trigger Estiver Desativado:**
```sql
-- Reativar trigger
ALTER TABLE vehicles ENABLE TRIGGER vehicle_history_trigger;

-- Verificar
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'vehicle_history_trigger';
-- Deve retornar 'O' (enabled)
```

### **Se Trigger Estiver Com Erro:**
```sql
-- Recriar função e trigger
DROP TRIGGER IF EXISTS vehicle_history_trigger ON vehicles;
DROP FUNCTION IF EXISTS log_vehicle_history();

-- Recriar (usar código da migration original)
\i supabase/migrations/20250929130000_create_vehicle_history_trigger.sql
```

### **Se Faltar Registros Históricos:**
```sql
-- Criar registros históricos para veículos que não têm
INSERT INTO vehicle_history (vehicle_id, status, created_at)
SELECT 
  id as vehicle_id,
  status,
  COALESCE(updated_at, created_at) as created_at
FROM vehicles v
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_history vh 
  WHERE vh.vehicle_id = v.id AND vh.status = v.status
);
```

---

## 🎯 **CHECKLIST DE VALIDAÇÃO**

Após aplicar correções, verificar:

- [ ] Trigger está habilitado (`tgenabled = 'O'`)
- [ ] Formatos de status estão padronizados (com acento)
- [ ] Atualizar status em vehicles cria registro em vehicle_history
- [ ] Timeline na UI mostra todos os eventos
- [ ] Código TypeScript usa formatos corretos
- [ ] Migration de correção é idempotente
- [ ] Teste manual confirma trigger funcionando

---

## 📝 **TEMPLATE DE TESTE MANUAL**

```sql
-- Escolher um veículo de teste
SELECT id, plate, status FROM vehicles LIMIT 1;

-- Anotar ID: _______________________

-- Contar histórico antes
SELECT COUNT(*) FROM vehicle_history WHERE vehicle_id = '<ID>';
-- Resultado antes: _______

-- Atualizar status
UPDATE vehicles SET status = 'EM ANÁLISE' WHERE id = '<ID>';

-- Contar histórico depois
SELECT COUNT(*) FROM vehicle_history WHERE vehicle_id = '<ID>';
-- Resultado depois: _______

-- Ver último registro criado
SELECT * FROM vehicle_history 
WHERE vehicle_id = '<ID>' 
ORDER BY created_at DESC 
LIMIT 1;

-- ✅ Se contagem aumentou: TRIGGER FUNCIONA
-- ❌ Se contagem não mudou: TRIGGER NÃO FUNCIONA
```

---

## 📞 **PRÓXIMOS PASSOS**

1. **Executar script de diagnóstico completo**
2. **Analisar resultados e identificar causa raiz**
3. **Aplicar correção apropriada**
4. **Validar com teste manual**
5. **Atualizar documentação**

---

**Documento criado em:** 2025-01-09  
**Status:** Aguardando execução do diagnóstico
