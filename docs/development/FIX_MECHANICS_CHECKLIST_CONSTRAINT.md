# Fix: Constraint Única em mechanics_checklist

## 🐛 Problema

Ao tentar salvar um checklist dinâmico com um segundo parceiro (diferente categoria), o sistema retornava o erro:

```
duplicate key value violates unique constraint "unique_vehicle_inspection"
```

### Cenário do Erro

1. **Parceiro 1** (Funilaria) salva checklist para veículo X
2. **Parceiro 2** (Pintura) tenta salvar checklist para o mesmo veículo X
3. ❌ Sistema retorna erro de constraint única

### Causa Raiz

A constraint `unique_vehicle_inspection` era definida como:

```sql
UNIQUE (vehicle_id, inspection_id)
```

Isso impedia que múltiplos parceiros salvassem checklist para o mesmo veículo, pois **não considerava o `partner_id`**.

## ✅ Solução

Criada migration `20251014180312_fix_mechanics_checklist_unique_constraint.sql` que:

### 1. Remove Constraint Antiga

```sql
ALTER TABLE mechanics_checklist
  DROP CONSTRAINT IF EXISTS unique_vehicle_inspection;
```

### 2. Cria Constraint para Nova Arquitetura (quote_id)

```sql
ALTER TABLE mechanics_checklist
  ADD CONSTRAINT unique_partner_quote 
  UNIQUE (partner_id, quote_id);
```

**Garante:** Cada parceiro pode ter apenas um checklist por quote_id.

### 3. Cria Constraint para Dados Legados (inspection_id)

```sql
ALTER TABLE mechanics_checklist
  ADD CONSTRAINT unique_partner_vehicle_inspection 
  UNIQUE (partner_id, vehicle_id, inspection_id);
```

**Garante:** Compatibilidade com dados legados que usam inspection_id.

## 🎯 Resultado

Agora múltiplos parceiros podem salvar checklist para o mesmo veículo:

| Cenário | Antes | Depois |
|---------|-------|--------|
| Parceiro 1 (Funilaria) salva checklist para veículo X | ✅ | ✅ |
| Parceiro 2 (Pintura) salva checklist para veículo X | ❌ Erro | ✅ Sucesso |
| Parceiro 1 tenta salvar duplicata para mesmo quote | ✅ Permitia | ❌ Bloqueia |

## 🔍 Constraints Atuais

```bash
psql -c "SELECT conname, pg_get_constraintdef(oid) 
         FROM pg_constraint 
         WHERE conrelid = 'mechanics_checklist'::regclass 
         AND contype = 'u';"
```

**Resultado:**

| Constraint | Definição |
|-----------|-----------|
| `unique_partner_quote` | UNIQUE (partner_id, quote_id) |
| `unique_partner_vehicle_inspection` | UNIQUE (partner_id, vehicle_id, inspection_id) |

## 📝 Arquitetura

### Nova Arquitetura (Recomendada)

- Parceiros usam **`quote_id`** (não mais inspection_id)
- Cada parceiro tem seu próprio quote para o veículo
- Constraint: `unique_partner_quote`

### Arquitetura Legada (Compatibilidade)

- Dados antigos usam **`inspection_id`**
- Mantida para não quebrar dados existentes
- Constraint: `unique_partner_vehicle_inspection`

## 🧪 Como Testar

### Teste 1: Múltiplos Parceiros (✅ Deve Funcionar)

1. Login como `pintura@parceiro.com` (Funilaria)
2. Acesse um veículo e salve checklist
3. Logout
4. Login como `lavagem@parceiro.com` (Lavagem)
5. Acesse o mesmo veículo e salve checklist
6. ✅ Ambos devem salvar com sucesso

### Teste 2: Duplicata do Mesmo Parceiro (❌ Deve Bloquear)

1. Login como `pintura@parceiro.com`
2. Salve checklist para um quote
3. Tente salvar novamente para o mesmo quote
4. ❌ Deve ser bloqueado pela constraint ou atualizar o existente

## 🚀 Migration Aplicada

```bash
npx supabase migration up
# Output: Local database is up to date.
```

## 📊 Impacto

- ✅ Resolve problema de múltiplos parceiros
- ✅ Mantém compatibilidade com dados legados
- ✅ Previne duplicatas por parceiro/quote
- ✅ Migration idempotente (pode ser reaplicada)

## 🔗 Arquivos Relacionados

- Migration: `supabase/migrations/20251014180312_fix_mechanics_checklist_unique_constraint.sql`
- API Endpoint: `app/api/partner/checklist/submit/route.ts`
- Dynamic Checklist: `app/dashboard/partner/dynamic-checklist/page.tsx`

## ⚠️ Nota Importante

Esta correção é **essencial** para o funcionamento correto do sistema multi-parceiro, onde diferentes categorias (Funilaria, Pintura, Lavagem, Pneus, etc.) precisam salvar seus próprios checklists para o mesmo veículo.
