# 🐛 Vehicle Count Duplication Bug Fix

## Problema
A coluna "Veículos Cadastrados" no DataPanel estava mostrando contagens duplicadas quando múltiplos especialistas eram associados a um cliente.

**Exemplo do Bug:**
- Cliente tem **100 veículos** cadastrados
- Cliente tem **2 especialistas** associados
- Resultado exibido: **200 veículos** (100 × 2)

## Causa Raiz
A função SQL `get_clients_with_vehicle_count()` fazia JOINs múltiplos que causavam duplicação de linhas:

```sql
-- PROBLEMÁTICO: JOINs múltiplos causam duplicação
LEFT JOIN vehicles v ON p.id = v.client_id          -- N veículos
LEFT JOIN client_specialists cs ON p.id = cs.client_id  -- M especialistas
-- Resultado: N × M linhas, COUNT() retorna N × M
```

## Solução
Nova migration usando CTEs (Common Table Expressions) para agregar dados separadamente:

```sql
-- CORRETO: CTEs evitam duplicação
WITH vehicle_counts AS (
  SELECT v.client_id, COUNT(v.id) AS vehicle_count
  FROM vehicles v GROUP BY v.client_id
),
specialist_agg AS (
  SELECT cs.client_id,
         STRING_AGG(DISTINCT sp.full_name, ', ') AS specialist_names
  FROM client_specialists cs
  JOIN profiles sp ON cs.specialist_id = sp.id
  GROUP BY cs.client_id
)
SELECT ... FROM profiles p
LEFT JOIN vehicle_counts vc ON p.id = vc.client_id
LEFT JOIN specialist_agg sa ON p.id = sa.client_id
```

## Arquivos Criados

### 1. Migration
- **Arquivo:** `supabase/migrations/20250908155213_fix_vehicle_count_duplication_bug.sql`
- **Propósito:** Corrige a função `get_clients_with_vehicle_count()`

### 2. Script de Teste SQL
- **Arquivo:** `scripts/test_vehicle_count_fix.sql`
- **Propósito:** Cria dados de teste e valida a correção

### 3. Script de Validação
- **Arquivo:** `scripts/test_vehicle_count_fix.cjs`
- **Propósito:** Aplica migration e executa testes

## Como Aplicar a Correção

### Passo 1: Aplicar a Migration
```bash
npx supabase db push
```

### Passo 2: Executar Teste de Validação
```bash
# Conecte ao banco e execute o script SQL
psql -f scripts/test_vehicle_count_fix.sql [sua-conexao-database]
```

### Passo 3: Verificar no Dashboard
1. Acesse o painel administrativo
2. Verifique a coluna "Veículos Cadastrados"
3. Confirme que as contagens estão corretas

## Resultado Esperado
- ✅ Cliente com 100 veículos e 2 especialistas → Mostra **100 veículos**
- ✅ Contagem de veículos independente do número de especialistas
- ✅ Lista de especialistas agregada corretamente

## Validação
O script de teste cria:
- 1 cliente de teste
- 2 especialistas associados
- 5 veículos para o cliente
- **Resultado esperado:** Contagem = 5 (não 10)

## Impacto
- **Antes:** Contagem duplicada = veículos × especialistas
- **Depois:** Contagem correta = apenas veículos
- **Benefício:** Dados precisos no dashboard administrativo

## Arquivos Afetados
- `supabase/migrations/20250908155213_fix_vehicle_count_duplication_bug.sql` (novo)
- `scripts/test_vehicle_count_fix.sql` (novo)
- `scripts/test_vehicle_count_fix.cjs` (novo)
- `app/api/(admin)/(collections)/admin/clients-with-collection-summary/route.ts` (usa a função corrigida)

---
**Status:** ✅ Migration criada e pronta para aplicação
**Tipo:** Correção de bug crítico
**Prioridade:** Alta</content>
<parameter name="filePath">/home/rafael/workspace/proline-homolog/docs/VEHICLE_COUNT_BUG_FIX_README.md
