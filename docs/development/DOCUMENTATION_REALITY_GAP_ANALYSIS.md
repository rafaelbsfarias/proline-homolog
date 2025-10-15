# Análise: Documentação vs. Realidade da Implementação

**Data:** 14 de Outubro de 2025  
**Objetivo:** Avaliar o alinhamento entre a documentação em `@docs/` e o código implementado

---

## 📊 Status Geral

🟡 **PARCIALMENTE ALINHADO**

A documentação em `@docs/` descreve uma **arquitetura ideal/proposta** (target state), enquanto a implementação atual usa uma **arquitetura legada/transicional** que está sendo gradualmente migrada.

---

## 🔍 Principais Divergências

### 1. **Nomenclatura de Tabelas**

| Documentação (`@docs/`) | Implementação Atual | Status |
|------------------------|---------------------|--------|
| `partner_checklists` | `mechanics_checklist` | ❌ Divergente |
| `partner_checklist_items` | `mechanics_checklist_items` | ❌ Divergente |
| `partner_checklist_evidences` | `mechanics_checklist_evidences` | ❌ Divergente |
| `partner_part_requests` | `part_requests` | ❌ Divergente |
| `partner_anomalies` | `vehicle_anomalies` | ❌ Divergente |

**Impacto:** A documentação sugere nomes que refletem melhor o isolamento por parceiro, mas a implementação usa nomes legados focados em "mecânica".

### 2. **Campos de Contexto**

| Documentação | Implementação | Status |
|--------------|---------------|--------|
| `context_type` + `context_id` (normalizado) | `inspection_id` + `quote_id` (colunas separadas) | 🟡 Transição |
| Campo único `category` | Inferido do `partner_id` via join | 🟡 Diferente |

**Realidade Atual:**
- Migration `20251013005933_add_quote_id_to_checklist_tables.sql` adicionou `quote_id` mas manteve `inspection_id` para compatibilidade
- Sistema está em transição: parceiros usam `quote_id`, especialistas usam `inspection_id`

### 3. **Constraint Única**

| Documentação | Implementação Atual | Status |
|--------------|---------------------|--------|
| `UNIQUE (partner_id, vehicle_id, context_type, context_id, category)` | `UNIQUE (partner_id, quote_id)` + `UNIQUE (partner_id, vehicle_id, inspection_id)` | ✅ Funcional |

**Realidade:**
- Migration `20251014180312_fix_mechanics_checklist_unique_constraint.sql` corrigiu a constraint
- Agora permite múltiplos parceiros no mesmo veículo ✅
- Mas ainda usa campos separados ao invés de `(context_type, context_id)`

### 4. **APIs Documentadas vs. Implementadas**

| Endpoint Documentado | Endpoint Implementado | Status |
|---------------------|----------------------|--------|
| `POST /api/partner/checklist/load` | `GET /api/partner-checklist?quoteId=...` | 🟡 Diferente |
| `POST /api/partner/checklist/save` | `PUT /api/partner/checklist/save-anomalies` | 🟡 Diferente |
| `PUT /api/partner/checklist/submit` | `PUT /api/partner/checklist/submit` | ✅ Alinhado |
| `POST /api/partner/evidences/upload` | `POST /api/partner/checklist/upload-evidence` | 🟡 Diferente |

**Realidade:**
- As APIs existentes funcionam mas usam convenções diferentes
- `/api/partner-checklist` é o endpoint principal de load
- Dynamic checklist usa hooks customizados que abstraem as chamadas

### 5. **Categorias de Parceiros**

**Documentação sugere:**
- Enum de categorias: `mechanic`, `body`, `paint`, `electrical`, etc.
- Template diferente por categoria
- Campo `category` na tabela principal

**Implementação atual:**
- Categoria inferida via `partner_categories` (tabela de relacionamento)
- Nomes em português: "Mecânica", "Funilaria/Pintura", "Lavagem", "Pneus", "Loja"
- Sem campo `category` direto em `mechanics_checklist`

---

## ✅ Pontos Alinhados

### 1. **Isolamento por Parceiro**
- ✅ Campo `partner_id` presente em todas as tabelas
- ✅ Constraints garantem separação de dados
- ✅ RLS policies filtram por parceiro

### 2. **Múltiplas Evidências por Item**
- ✅ Implementado via `mechanics_checklist_evidences`
- ✅ Constraint UNIQUE removida (permite múltiplas fotos)
- ✅ Migration `20251014172305_allow_multiple_evidences_per_item.sql`

### 3. **Solicitações de Peças**
- ✅ Tabela `part_requests` implementada
- ✅ Vinculada a `quote_id` e `item_key`
- ✅ Migration `20251013143245_create_part_requests_table.sql`

### 4. **Visualização Somente Leitura**
- ✅ Componente `PartnerEvidencesSection` existe
- ✅ Exibe checklists por parceiro/categoria
- ✅ Lightbox para galeria de fotos

### 5. **Timeline de Status**
- ✅ Tabela `vehicle_history` registra fases
- ✅ Entradas por parceiro/categoria
- ✅ Deduplicação implementada

---

## 🎯 Recomendações

### Curto Prazo (Manter Funcionando)

1. **Atualizar Documentação `@docs/`** ⚠️ PRIORITÁRIO
   - Adicionar seção "Estado Atual vs. Estado Proposto"
   - Documentar tabelas reais: `mechanics_checklist`, `mechanics_checklist_items`, etc.
   - Incluir campos reais: `inspection_id`, `quote_id` (ambos)
   - Documentar APIs implementadas com exemplos reais

2. **Criar Documento de Migração**
   - `@docs/migration-status.md` mostrando o progresso
   - Checklist do que já foi migrado
   - Roadmap do que falta fazer

3. **Adicionar Comentários no Código**
   - Referenciar a documentação ideal
   - Explicar decisões de transição
   - Marcar código legado com `// A Fazer: migrate to partner_checklists`

### Médio Prazo (Alinhar Gradualmente)

4. **Normalizar Context**
   - Criar migration que adiciona `context_type` + `context_id`
   - Backfill dos dados existentes
   - Deprecar `inspection_id` e `quote_id` gradualmente

5. **Renomear Tabelas** (breaking change)
   - `mechanics_checklist` → `partner_checklists`
   - Criar views de compatibilidade
   - Migrar código gradualmente

6. **Padronizar APIs**
   - Alinhar endpoints com a documentação
   - Manter versões antigas com deprecation warnings
   - Criar `/api/v2/partner/checklist/...` com nova estrutura

### Longo Prazo (Estado Ideal)

7. **Implementar Templates**
   - Tabelas `checklist_templates` e `checklist_template_items`
   - Versionamento de templates
   - UI de gerenciamento de templates

8. **Multi-tenancy Completo**
   - Adicionar `org_id` se necessário
   - Isolamento por organização

9. **Auditoria Completa**
   - Campos `created_by`, `updated_by` em todas as tabelas
   - Tabela de histórico de alterações
   - Logs estruturados

---

## 📝 Conclusão

### A Documentação Faz Sentido? ✅ **SIM**

A documentação em `@docs/` representa uma **visão arquitetural sólida e bem pensada** do que o sistema deveria ser. Os princípios são corretos:

- ✅ Isolamento por parceiro
- ✅ Normalização de contexto
- ✅ Separação de responsabilidades
- ✅ Integridade referencial
- ✅ Visualização somente leitura

### O Problema: Gap de Implementação

A documentação descreve o **estado alvo** (target state), mas o código atual está em um **estado de transição**:

1. Sistema originalmente focado apenas em mecânica
2. Gradualmente expandido para outras categorias
3. Migrations incrementais adicionaram suporte a múltiplos parceiros
4. Nomes de tabelas e campos mantidos por compatibilidade

### Ação Imediata Necessária

🔴 **CRÍTICO:** Atualizar `@docs/README.md` com aviso:

```markdown
⚠️ **ATENÇÃO:** Esta documentação descreve a arquitetura ALVO (target state).
Para entender a implementação ATUAL, consulte:
- `/docs/CURRENT_ARCHITECTURE.md` - Estado atual do sistema
- `/docs/MIGRATION_STATUS.md` - Progresso da migração
- `/docs/DOCUMENTATION_REALITY_GAP_ANALYSIS.md` - Análise de gaps
```

### Valor da Documentação Atual

Apesar do gap, a documentação em `@docs/` é **valiosa como guia de norte** para onde o sistema deve evoluir. Ela não deve ser descartada, mas deve ser complementada com:

1. Documentação do estado atual
2. Roadmap de migração
3. Decisões arquiteturais (ADRs)
4. Justificativas para divergências

---

## 📚 Próximos Passos

- [x] Criar `@docs/as-is/CURRENT_STATE.md` documentando implementação real ✅
- [x] Criar `@docs/MIGRATION_STATUS.md` com progresso da transição ✅
- [x] Adicionar WARNING em `@docs/README.md` sobre target vs. current ✅
- [ ] Documentar decisões arquiteturais em ADRs (parcial - 4 ADRs em MIGRATION_STATUS.md)
- [ ] Criar script de validação que compara docs vs. schema real
- [ ] Atualizar diagramas para mostrar ambos estados (atual + alvo)

---

**Autor:** Análise automatizada do estado do código  
**Revisão:** Necessária por arquiteto/tech lead do projeto
