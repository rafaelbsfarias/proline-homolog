# 🚀 Guia Prático: Consolidação Partner Checklist

**Data:** 14 de Outubro de 2025  
**Objetivo:** Comandos práticos para executar a consolidação

---

## ✅ PRÉ-REQUISITOS

```bash
# 1. Estar na branch correta
git checkout develop
git pull origin develop

# 2. Banco de dados atualizado
supabase db reset

# 3. Dependências instaladas
pnpm install

# 4. Servidor rodando
pnpm dev
```

---

## 🧪 FASE 1: VALIDAÇÃO (TESTES)

### 1.1 Executar Auditoria

```bash
# Verificar estado atual
bash scripts/audit-checklist-dependencies.sh

# Saída esperada:
# ❌ EM USO: dynamic-checklist (15 usos)
# ⚠️  POUCOS USOS: usePartnerChecklist (1 uso)
# ❌ EM USO: /exists (9 usos)
```

### 1.2 Testar Checklist Atual (V1 - Mecânica)

```bash
# 1. Login como parceiro mecânica
# Email: mecanica@parceiro.com
# Senha: 123qwe

# 2. Acessar:
open http://localhost:3000/dashboard/partner/checklist?quoteId=4d7d160a-1c8e-47e4-853e-efa9da78bdc9

# 3. Verificar:
# ✅ Página carrega
# ✅ Campos pré-populados (se existir checklist anterior)
# ✅ Upload de imagens funciona
# ✅ Part requests são salvos
# ✅ Salvar funciona

# 4. Verificar no banco:
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT id, item_key, item_status, part_request 
FROM mechanics_checklist_items 
WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9';
"

psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT item_key, media_url, media_type 
FROM mechanics_checklist_evidences 
WHERE quote_id = '4d7d160a-1c8e-47e4-853e-efa9da78bdc9';
"
```

### 1.3 Testar Dynamic Checklist (Outras Categorias)

```bash
# 1. Login como parceiro funilaria
# Email: pintura@parceiro.com
# Senha: 123qwe

# 2. Criar novo quote (via dashboard admin)
# 3. Acessar:
open http://localhost:3000/dashboard/partner/dynamic-checklist?quoteId=NOVO_QUOTE_ID

# 4. Verificar:
# ✅ Página carrega
# ✅ Anomalias podem ser adicionadas
# ✅ Upload de fotos funciona
# ✅ Salvar funciona
```

### 1.4 Testar Checklist V2 (Templates)

```bash
# 1. Login como parceiro mecânica
# Email: mecanica@parceiro.com
# Senha: 123qwe

# 2. Obter vehicleId e quoteId do banco:
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT v.id as vehicle_id, q.id as quote_id 
FROM quotes q
JOIN vehicles v ON q.vehicle_id = v.id
WHERE q.status = 'pending'
LIMIT 1;
"

# 3. Acessar (substituir IDs):
open "http://localhost:3000/dashboard/partner/checklist-v2?vehicleId=VEHICLE_ID&quoteId=QUOTE_ID"

# 4. Verificar:
# ✅ Template carrega (baseado na categoria do parceiro)
# ✅ Campos dinâmicos aparecem
# ✅ Upload funciona
# ✅ Salvar funciona

# 5. Repetir para TODAS as categorias:
# - pintura@parceiro.com (Funilaria)
# - lavagem@parceiro.com (Lavagem)
# - pneus@parceiro.com (Pneus)
# - loja@parceiro.com (Loja)
```

---

## 🗑️ FASE 2: LIMPEZA SEGURA

### 2.1 Deletar Backups

```bash
# Verificar backups existentes
find . -name "*.backup" -o -name "*.original"

# Saída esperada:
# ./app/dashboard/admin/partner-overview/page.tsx.original
# ./app/dashboard/admin/partner-overview/page.tsx.backup
# ./app/dashboard/partner/execution-evidence/page.tsx.backup

# Deletar (SEGURO - já no Git)
rm app/dashboard/admin/partner-overview/page.tsx.original
rm app/dashboard/admin/partner-overview/page.tsx.backup
rm app/dashboard/partner/execution-evidence/page.tsx.backup

# Commit
git add -A
git commit -m "chore: remove backup files"
```

---

## 🔄 FASE 3: MIGRAÇÃO (SE V2 PASSAR NOS TESTES)

### 3.1 Criar Branch de Migração

```bash
git checkout -b refactor/consolidate-checklist
```

### 3.2 Mover Componentes Compartilhados

```bash
# Criar diretórios
mkdir -p modules/partner/components/part-request
mkdir -p modules/partner/hooks/part-request

# Mover componentes
mv app/dashboard/partner/dynamic-checklist/components/PartRequestModal.tsx \
   modules/partner/components/part-request/

mv app/dashboard/partner/dynamic-checklist/components/PartRequestCard.tsx \
   modules/partner/components/part-request/

# Mover hooks
mv app/dashboard/partner/dynamic-checklist/hooks/usePartRequestModal.ts \
   modules/partner/hooks/part-request/

# Mover types
mv app/dashboard/partner/dynamic-checklist/types/index.ts \
   modules/partner/types/partRequest.ts
```

### 3.3 Atualizar Imports

```bash
# Arquivo 1: checklist/page.tsx
# ANTES:
# import { PartRequestModal } from '@/app/dashboard/partner/dynamic-checklist/components/PartRequestModal';

# DEPOIS:
# import { PartRequestModal } from '@/modules/partner/components/part-request/PartRequestModal';

# Usar search & replace no VSCode:
# Ctrl+Shift+H
# Find: @/app/dashboard/partner/dynamic-checklist
# Replace: @/modules/partner
```

### 3.4 Atualizar PartnerDashboard

```typescript
// app/dashboard/PartnerDashboard.tsx (linha 264-265)

// ANTES:
const link = category === 'Mecânica'
  ? `/dashboard/partner/checklist?quoteId=${quote.id}`
  : `/dashboard/partner/dynamic-checklist?quoteId=${quote.id}`;

// DEPOIS:
const link = `/dashboard/partner/checklist-v2?vehicleId=${quote.vehicle_id}&quoteId=${quote.id}`;
```

### 3.5 Renomear Checklist V2 → Checklist

```bash
# Backup das páginas antigas
mkdir -p app/dashboard/partner/_deprecated
mv app/dashboard/partner/checklist app/dashboard/partner/_deprecated/checklist-v1
mv app/dashboard/partner/dynamic-checklist app/dashboard/partner/_deprecated/dynamic-checklist

# Promover V2 para oficial
mv app/dashboard/partner/checklist-v2 app/dashboard/partner/checklist
```

### 3.6 Atualizar Rotas no Código

```bash
# Procurar todas as referências
grep -r "checklist-v2" --include="*.ts" --include="*.tsx" .

# Substituir todas as ocorrências:
# /dashboard/partner/checklist-v2 → /dashboard/partner/checklist
```

---

## 🧪 FASE 4: TESTES PÓS-MIGRAÇÃO

### 4.1 Testes Manuais

```bash
# 1. Para CADA categoria de parceiro:
#    - mecanica@parceiro.com
#    - pintura@parceiro.com
#    - lavagem@parceiro.com
#    - pneus@parceiro.com
#    - loja@parceiro.com

# 2. Acessar dashboard
open http://localhost:3000/dashboard/partner

# 3. Clicar em "Vistoria" de um quote

# 4. Verificar:
# ✅ Checklist abre (agora é V2 unificado)
# ✅ Template correto carrega
# ✅ Campos aparecem
# ✅ Upload funciona
# ✅ Salvar funciona
# ✅ Dados persistem
```

### 4.2 Testes no Banco

```sql
-- Verificar checklists criados
SELECT 
  mc.id,
  mc.category,
  p.company_name as partner,
  COUNT(DISTINCT mci.id) as total_items,
  COUNT(DISTINCT mce.id) as total_evidences
FROM mechanics_checklist mc
JOIN partners p ON mc.partner_id = p.id
LEFT JOIN mechanics_checklist_items mci ON mci.quote_id = mc.quote_id
LEFT JOIN mechanics_checklist_evidences mce ON mce.quote_id = mc.quote_id
WHERE mc.created_at > NOW() - INTERVAL '1 hour'
GROUP BY mc.id, mc.category, p.company_name;
```

### 4.3 Testes de Regressão

```bash
# Executar testes E2E (se existirem)
pnpm test:e2e

# Executar testes unitários
pnpm test
```

---

## 🧹 FASE 5: LIMPEZA FINAL

### 5.1 Deletar Código Deprecado

```bash
# Apenas SE tudo funcionar perfeitamente!

# Deletar páginas antigas
rm -rf app/dashboard/partner/_deprecated/

# Deletar wrapper inútil
rm modules/partner/hooks/usePartnerChecklist.ts

# Atualizar imports que usavam wrapper
# (apenas dynamic-checklist usava, que já foi deletado)
```

### 5.2 Renomear Hook Duplicado

```bash
# Renomear para evitar confusão
mv modules/vehicles/hooks/usePartnerChecklist.ts \
   modules/vehicles/hooks/usePartnerChecklistViewer.ts

# Atualizar imports:
# app/dashboard/admin/partner-overview/page.tsx
# app/dashboard/admin/partner-overview/page.tsx.backup (se ainda existir)
```

### 5.3 Deletar Endpoint Redundante (/exists)

```bash
# Verificar usos restantes
grep -r "/api/partner/checklist/exists" --include="*.ts" --include="*.tsx" .

# Se apenas useChecklistCache.ts usar:
# 1. Modificar useChecklistCache para usar /load
# 2. Deletar endpoint:
rm -rf app/api/partner/checklist/exists/
```

---

## 📊 FASE 6: VALIDAÇÃO FINAL

### 6.1 Executar Auditoria Novamente

```bash
bash scripts/audit-checklist-dependencies.sh

# Saída esperada:
# ✅ SEGURO DELETAR: dynamic-checklist (0 usos)
# ✅ SEGURO DELETAR: usePartnerChecklist (0 usos)
# ✅ SEGURO DELETAR: /exists (0 usos)
```

### 6.2 Verificar Erros no Build

```bash
# Build de produção
pnpm build

# Deve completar sem erros
```

### 6.3 Verificar Erros de TypeScript

```bash
# Type checking
pnpm tsc --noEmit

# Deve completar sem erros
```

---

## 📝 FASE 7: DOCUMENTAÇÃO

### 7.1 Atualizar Documentação

```bash
# Criar arquivo de migração concluída
cat > docs/CHECKLIST_CONSOLIDATION_COMPLETED.md << 'EOF'
# ✅ Consolidação Partner Checklist - CONCLUÍDA

**Data:** $(date +%Y-%m-%d)

## Resumo
- ✅ 3 páginas → 1 página
- ✅ Templates dinâmicos no DB
- ✅ Componentes centralizados
- ✅ 66% redução de código

## Arquivos Removidos
- app/dashboard/partner/_deprecated/checklist-v1/
- app/dashboard/partner/_deprecated/dynamic-checklist/
- modules/partner/hooks/usePartnerChecklist.ts (wrapper)

## Arquivos Movidos
- Componentes: → modules/partner/components/part-request/
- Hooks: → modules/partner/hooks/part-request/
- Types: → modules/partner/types/partRequest.ts

## Testes
- ✅ Mecânica
- ✅ Funilaria
- ✅ Lavagem
- ✅ Pneus
- ✅ Loja
EOF
```

### 7.2 Commit e Push

```bash
# Adicionar todos os arquivos
git add -A

# Commit com mensagem descritiva
git commit -m "refactor: consolidate partner checklist into single page

- Unified /checklist, /dynamic-checklist, /checklist-v2 into one
- Moved shared components to modules/partner/
- All categories now use template-based system
- Removed ~2000 lines of duplicated code

BREAKING CHANGE: Removed /dynamic-checklist route
Migration: All users now use /checklist with templates"

# Push
git push origin refactor/consolidate-checklist

# Criar Pull Request no GitHub
gh pr create --title "Refactor: Consolidate Partner Checklist" \
             --body "See docs/CHECKLIST_CONSOLIDATION_COMPLETED.md"
```

---

## ⚠️ ROLLBACK (SE ALGO DER ERRADO)

### Rollback Rápido

```bash
# Voltar ao estado anterior
git checkout develop
git branch -D refactor/consolidate-checklist

# Ou se já fez merge:
git revert HEAD
git push origin develop
```

### Rollback Manual

```bash
# Restaurar páginas antigas
git checkout develop -- app/dashboard/partner/checklist/
git checkout develop -- app/dashboard/partner/dynamic-checklist/

# Restaurar PartnerDashboard
git checkout develop -- app/dashboard/PartnerDashboard.tsx

# Commit
git add -A
git commit -m "revert: rollback checklist consolidation"
git push origin develop
```

---

## 📋 CHECKLIST COMPLETO

### Antes de Começar
- [ ] Backup do banco de dados local
- [ ] Branch atualizada com develop
- [ ] Dependências instaladas
- [ ] Servidor rodando

### Validação (Fase 1)
- [ ] Auditoria executada
- [ ] Checklist V1 testado (Mecânica)
- [ ] Dynamic Checklist testado (Funilaria)
- [ ] Checklist V2 testado (Mecânica)
- [ ] Checklist V2 testado (Funilaria)
- [ ] Checklist V2 testado (Lavagem)
- [ ] Checklist V2 testado (Pneus)
- [ ] Checklist V2 testado (Loja)

### Limpeza Segura (Fase 2)
- [ ] Backups deletados
- [ ] Commit de limpeza criado

### Migração (Fase 3)
- [ ] Branch de migração criada
- [ ] Componentes movidos
- [ ] Imports atualizados
- [ ] PartnerDashboard atualizado
- [ ] V2 renomeado para oficial
- [ ] Rotas atualizadas

### Testes (Fase 4)
- [ ] Testes manuais para cada categoria
- [ ] Queries no banco verificadas
- [ ] Build de produção OK
- [ ] Type checking OK

### Limpeza Final (Fase 5)
- [ ] Código deprecado deletado
- [ ] Hooks renomeados
- [ ] Endpoints redundantes removidos

### Documentação (Fase 7)
- [ ] CHECKLIST_CONSOLIDATION_COMPLETED.md criado
- [ ] Commit criado
- [ ] Pull Request aberto
- [ ] Code review solicitado

---

## 🎯 MÉTRICAS DE SUCESSO

### Antes:
```
Páginas:  3
Hooks:    5
Código:   ~3000 linhas
Build:    ~2.5min
```

### Depois:
```
Páginas:  1 ✅
Hooks:    2 ✅
Código:   ~1000 linhas ✅
Build:    ~1.8min ✅
```

---

## 📞 SUPORTE

Em caso de problemas:

1. **Verificar logs:**
```bash
# Logs do Next.js
tail -f .next/trace

# Logs do Supabase
supabase logs
```

2. **Verificar banco:**
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

3. **Rollback imediato:**
```bash
git checkout develop
```

---

**Referências:**
- Auditoria: `docs/CHECKLIST_ENDPOINT_AUDIT.md`
- Resumo: `docs/CHECKLIST_EXECUTIVE_SUMMARY.md`
- Arquitetura: `docs/CHECKLIST_ARCHITECTURE_DIAGRAM.md`
