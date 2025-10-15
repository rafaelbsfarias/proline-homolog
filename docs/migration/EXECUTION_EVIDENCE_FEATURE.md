# Evidências de Execução de Serviços - Funcionalidade Completa

## 📋 Sumário Executivo

Esta funcionalidade permite que parceiros registrem evidências fotográficas da execução dos serviços aprovados, criando um checklist de execução com fotos e descrições para cada serviço do orçamento.

---

## 🎯 Objetivo

Permitir que o parceiro documente a execução dos serviços através de:
- Upload de fotos de evidência para cada serviço
- Descrições opcionais para cada evidência
- Salvamento progressivo do checklist
- Finalização oficial da execução

---

## 🏗️ Arquitetura

### Componentes Criados

#### 1. **Página de Evidências**
**Arquivo**: `app/dashboard/partner/execution-evidence/page.tsx`

**Funcionalidades**:
- Lista todos os serviços do orçamento aprovado
- Permite upload de múltiplas fotos por serviço
- Campo de descrição opcional para cada foto
- Botão "Salvar Progresso" (salva sem finalizar)
- Botão "Finalizar Execução" (marca como concluído)

#### 2. **Botão no Dashboard**
**Arquivo**: `app/dashboard/PartnerDashboard.tsx`

**Modificações**:
- Adicionado handler `handleExecutionEvidence`
- Passa `onExecutionEvidence` para o DataTable
- Botão aparece ao lado do botão de download da OS

#### 3. **DataTable Atualizado**
**Arquivo**: `modules/common/components/shared/DataTable.tsx`

**Modificações**:
- Nova prop `onExecutionEvidence`
- Novo botão com ícone de câmera (FaCamera)
- Cor azul (#3b82f6) para diferenciação

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `execution_evidences`

```sql
CREATE TABLE public.execution_evidences (
    id UUID PRIMARY KEY,
    quote_id UUID NOT NULL,                    -- ID do orçamento
    quote_item_id UUID NOT NULL,               -- ID do item/serviço específico
    image_url TEXT NOT NULL,                   -- URL da imagem no Storage
    description TEXT,                          -- Descrição opcional
    uploaded_at TIMESTAMPTZ,                   -- Data de upload
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**Índices**:
- `idx_execution_evidences_quote_id`
- `idx_execution_evidences_quote_item_id`

**Relacionamentos**:
- `quote_id` → `quotes.id` (ON DELETE CASCADE)
- `quote_item_id` → `quote_items.id` (ON DELETE CASCADE)

### Tabela: `execution_checklists`

```sql
CREATE TABLE public.execution_checklists (
    id UUID PRIMARY KEY,
    quote_id UUID NOT NULL UNIQUE,             -- Um checklist por orçamento
    status TEXT NOT NULL,                      -- 'in_progress' ou 'completed'
    completed_at TIMESTAMPTZ,                  -- Data de finalização
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**Índices**:
- `idx_execution_checklists_quote_id`
- `idx_execution_checklists_status`

**Constraint**: `UNIQUE(quote_id)` - Um checklist por orçamento

### Storage Bucket: `execution-evidences`

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('execution-evidences', 'execution-evidences', true);
```

**Estrutura de pastas**:
```
execution-evidences/
  └── {partner_id}/
      └── {quote_id}/
          └── {quote_item_id}/
              └── {timestamp}.{ext}
```

---

## 🔒 Políticas RLS

### execution_evidences

| Política | Ação | Condição |
|----------|------|----------|
| Partners can view their own | SELECT | `quote.partner_id = auth.uid()` |
| Partners can insert | INSERT | `quote.partner_id = auth.uid()` |
| Partners can update their own | UPDATE | `quote.partner_id = auth.uid()` |
| Partners can delete their own | DELETE | `quote.partner_id = auth.uid()` |
| Admins can view all | SELECT | `profile.role = 'admin'` |

### execution_checklists

| Política | Ação | Condição |
|----------|------|----------|
| Partners can view their own | SELECT | `quote.partner_id = auth.uid()` |
| Partners can upsert their own | ALL | `quote.partner_id = auth.uid()` |
| Admins can view all | SELECT | `profile.role = 'admin'` |

### Storage (execution-evidences)

| Política | Ação | Condição |
|----------|------|----------|
| Partners can upload | INSERT | `authenticated` |
| Anyone can view | SELECT | `bucket_id = 'execution-evidences'` |
| Partners can delete own | DELETE | Folder = `auth.uid()` |

---

## 🎨 Interface do Usuário

### 1. Dashboard do Parceiro

**Tabela**: "Orçamentos Aprovados - Aguardando Execução"

**Botões de Ação**:
- 🟢 **Download** (verde): Baixar Ordem de Serviço
- 🔵 **Câmera** (azul): Registrar Evidências ← **NOVO**

### 2. Página de Evidências

**Layout**:
```
┌─────────────────────────────────────────────┐
│ ← Voltar ao Dashboard                       │
├─────────────────────────────────────────────┤
│ Evidências de Execução                      │
│ Veículo: ABC-1234 - Volkswagen Golf         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 1. Instalação de acessórios elétricos      │
│ [📷 Adicionar Foto]                         │
│                                             │
│ ┌────────┐ ┌────────┐ ┌────────┐          │
│ │ Foto 1 │ │ Foto 2 │ │ Foto 3 │          │
│ │        │ │        │ │        │          │
│ │[Desc]  │ │[Desc]  │ │[Desc]  │          │
│ │[❌ Del] │ │[❌ Del] │ │[❌ Del] │          │
│ └────────┘ └────────┘ └────────┘          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 2. Troca de óleo                            │
│ [📷 Adicionar Foto]                         │
│ (Nenhuma evidência adicionada ainda)       │
└─────────────────────────────────────────────┘

                [💾 Salvar Progresso] [✓ Finalizar Execução]
```

---

## 🔄 Fluxo de Uso

### Passo 1: Acessar Evidências
1. Parceiro visualiza orçamento aprovado no dashboard
2. Clica no botão **🔵 Câmera** (Evidências)
3. É redirecionado para `/dashboard/partner/execution-evidence?quoteId={id}`

### Passo 2: Adicionar Evidências
1. Para cada serviço listado:
   - Clica em "📷 Adicionar Foto"
   - Seleciona arquivo de imagem
   - Imagem é enviada ao Supabase Storage
   - Aparece preview da imagem
   - (Opcional) Adiciona descrição
   - Pode remover a foto se necessário

### Passo 3: Salvar Progresso
- Clica em "💾 Salvar Progresso"
- Evidências são salvas no banco
- Pode sair e voltar depois
- Status permanece `in_progress`

### Passo 4: Finalizar
- Clica em "✓ Finalizar Execução"
- Salva todas as evidências
- Cria registro em `execution_checklists` com `status = 'completed'`
- Redireciona ao dashboard
- Toast de sucesso

---

## 📊 Estados do Sistema

### Status do Checklist

| Status | Descrição | Ações Disponíveis |
|--------|-----------|-------------------|
| `null` | Não iniciado | Iniciar |
| `in_progress` | Em andamento | Continuar, Salvar, Finalizar |
| `completed` | Concluído | Apenas visualização |

### Validações

| Validação | Momento | Mensagem |
|-----------|---------|----------|
| Quote existe | Carregamento | "ID do orçamento não fornecido" |
| Usuário autenticado | Upload | "Usuário não autenticado" |
| Arquivo é imagem | Upload | Validação do input `accept="image/*"` |
| Evidências salvas | Finalização | Salva automaticamente |

---

## 🧪 Como Testar

### 1. Preparação
```bash
# Aplicar migration
cd /home/rafael/workspace/proline-homolog
npx supabase db push

# Verificar que as tabelas foram criadas
npx supabase db diff
```

### 2. Criar Dados de Teste
```sql
-- Criar um quote aprovado
INSERT INTO quotes (id, partner_id, service_order_id, status, total_value)
VALUES (
  'test-quote-id',
  'partner-id',
  'service-order-id',
  'approved',
  1000
);

-- Criar itens do quote
INSERT INTO quote_items (id, quote_id, description, quantity, unit_price, total_price)
VALUES
  (gen_random_uuid(), 'test-quote-id', 'Serviço 1', 1, 500, 500),
  (gen_random_uuid(), 'test-quote-id', 'Serviço 2', 1, 500, 500);
```

### 3. Testar na Interface
1. Login como parceiro
2. Verificar quote aprovado na tabela
3. Clicar no botão de câmera (azul)
4. Adicionar fotos para cada serviço
5. Adicionar descrições
6. Testar "Salvar Progresso"
7. Sair e voltar (verificar persistência)
8. Testar "Finalizar Execução"

### 4. Verificar Banco de Dados
```sql
-- Verificar evidências
SELECT * FROM execution_evidences WHERE quote_id = 'test-quote-id';

-- Verificar checklist
SELECT * FROM execution_checklists WHERE quote_id = 'test-quote-id';

-- Verificar arquivos no storage
SELECT * FROM storage.objects WHERE bucket_id = 'execution-evidences';
```

---

## 9. Troubleshooting

### Problema: Página mostra "Nenhum serviço encontrado"

**Possíveis causas e soluções:**

1. **Políticas RLS incorretas (CORRIGIDO na migration `20251009150915`)**
   - As políticas RLS inicialmente referenciavam `budget_id` em vez de `quote_id`
   - Isso foi corrigido na migration que recriou as políticas com `quote_id`
   - Verifique se a migration foi aplicada: `npx supabase migration up`

2. **Quote sem itens**
   ```sql
   -- Verificar se o quote tem itens
   SELECT * FROM quote_items WHERE quote_id = 'seu-quote-id';
   ```

3. **Quote não está aprovado**
   ```sql
   -- Verificar status do quote
   SELECT id, status FROM quotes WHERE id = 'seu-quote-id';
   ```

---

## 📱 Responsividade

A página foi desenvolvida com grid responsivo:

```css
gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'
```

**Comportamento**:
- Desktop: 3-4 fotos por linha
- Tablet: 2 fotos por linha
- Mobile: 1 foto por linha

---

## 🚀 Melhorias Futuras

### Curto Prazo
- [ ] Adicionar preview antes do upload
- [ ] Comprimir imagens antes do upload
- [ ] Adicionar progresso de upload
- [ ] Validar tamanho máximo de arquivo

### Médio Prazo
- [ ] Permitir captura direta da câmera (mobile)
- [ ] Adicionar anotações nas fotos
- [ ] Criar relatório PDF com evidências
- [ ] Notificar cliente quando finalizado

### Longo Prazo
- [ ] Timeline de execução com fotos
- [ ] Comparação antes/depois
- [ ] Assinatura digital do cliente
- [ ] Integração com QR Code

---

## 📚 Arquivos Modificados/Criados

### Criados ✨
1. `app/dashboard/partner/execution-evidence/page.tsx`
2. `supabase/migrations/20251009113938_create_execution_evidences_tables.sql`
3. `docs/EXECUTION_EVIDENCE_FEATURE.md` (este arquivo)

### Modificados 🔧
1. `app/dashboard/PartnerDashboard.tsx`
   - Adicionado `handleExecutionEvidence`
   - Passado `onExecutionEvidence` para DataTable

2. `modules/common/components/shared/DataTable.tsx`
   - Nova prop `onExecutionEvidence`
   - Novo botão com ícone FaCamera
   - Import de `FaCamera` do react-icons

---

## ✅ Checklist de Implementação

- [x] Criar página de evidências
- [x] Adicionar botão no dashboard
- [x] Atualizar DataTable com nova prop
- [x] Criar migration do banco
- [x] Configurar RLS
- [x] Criar bucket de storage
- [x] Configurar políticas de storage
- [x] Adicionar validações
- [x] Implementar toast notifications
- [x] Criar documentação
- [ ] Testar em produção
- [ ] Treinar usuários

---

## 🎯 Resultado Final

✅ Parceiros podem documentar a execução dos serviços com evidências fotográficas
✅ Sistema de salvamento progressivo permite trabalhar em etapas
✅ Botão de finalização marca oficialmente a conclusão
✅ Interface intuitiva e responsiva
✅ Dados seguros com RLS adequado
✅ Fotos armazenadas de forma organizada no Storage

---

## 📞 Suporte

Para dúvidas ou problemas com esta funcionalidade:
1. Verificar esta documentação
2. Verificar logs do Supabase
3. Verificar console do navegador
4. Contatar o time de desenvolvimento

---

**Data de Criação**: 09/10/2025  
**Versão**: 1.0.0  
**Branch**: `aprovacao-orcamento-pelo-admin`
