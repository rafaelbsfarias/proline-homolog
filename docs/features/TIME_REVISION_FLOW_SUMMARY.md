# Resumo Executivo - Fluxo de Revisão de Prazos

## 📋 Visão Geral

O sistema controla revisões de prazos através de:
1. **Status do orçamento** (`quotes.status`)
2. **Registros de ações** (`quote_time_reviews.action`)

---

## 🔄 Ciclo Básico

```
1. Especialista solicita revisão
   ↓ status: specialist_time_revision_requested
   
2. Parceiro ajusta prazos
   ↓ status: admin_review
   
3. Especialista revisa ajustes
   ↓ Aprova: specialist_time_approved ✅
   └ OU Rejeita: specialist_time_revision_requested ♻️ (LOOP)
```

---

## 📊 Status e Ações

### Status do Orçamento

| Status | Significado | Próxima Ação |
|--------|-------------|--------------|
| `specialist_time_revision_requested` | Especialista solicitou revisão | **Parceiro** deve ajustar prazos |
| `admin_review` | Parceiro ajustou prazos | **Especialista** deve revisar novamente |
| `specialist_time_approved` | Prazos aprovados | Continuar fluxo normal |

### Ações na quote_time_reviews

| Action | Criado Por | Quando |
|--------|------------|--------|
| `revision_requested` | Especialista | Solicita ajuste nos prazos |
| `partner_updated` | Parceiro | Ajusta prazos conforme solicitado |
| `approved` | Especialista | Aprova prazos finais |

---

## ⚠️ Problemas Atuais

### 1. Especialista Não é Notificado ❌

**Problema:** Quando parceiro atualiza prazos, especialista não sabe que precisa revisar

**Impacto:**
- Orçamento fica "travado" em `admin_review`
- Especialista não tem visibilidade de pendências
- Processo depende de verificação manual

**Solução Necessária:**
- [ ] Dashboard para especialista ver orçamentos pendentes
- [ ] Notificação por email/push quando parceiro atualiza
- [ ] Novo status `pending_specialist_review` (mais claro)

### 2. Loop Infinito Não Controlado ❌

**Problema:** Não há limite de quantas revisões podem acontecer

**Impacto:**
- Frustração de parceiro e especialista
- Orçamento pode ficar em loop indefinidamente
- Sem métricas de quantas revisões foram feitas

**Solução Necessária:**
- [ ] Adicionar `revision_count` na tabela quotes
- [ ] Limitar a 3 revisões máximo
- [ ] Após limite, escalar para admin
- [ ] Exibir contador no frontend

### 3. Falta Histórico Visual ❌

**Problema:** Difícil acompanhar histórico de mudanças

**Solução Necessária:**
- [ ] Timeline visual de revisões
- [ ] Comparativo: original → sugerido → ajustado
- [ ] Histórico de comentários

---

## 🎯 APIs Principais

### Especialista Solicita Revisão
```
POST /api/specialist/quotes/[quoteId]/review-times
Body: {
  action: 'revision_requested',
  comments: 'Prazos muito curtos',
  revision_requests: {
    'item-id': { suggested_days: 5, reason: '...' }
  }
}
```

### Parceiro Atualiza Prazos
```
PUT /api/partner/quotes/[quoteId]/update-times
Body: {
  items: [{ item_id: '...', estimated_days: 5 }],
  comments: 'Prazos ajustados'
}
```

### Parceiro Lista Revisões Pendentes
```
GET /api/partner/quotes/pending-time-revisions
Retorna orçamentos com status: specialist_time_revision_requested
```

### Especialista Lista Orçamentos para Revisar ⚠️ FALTA IMPLEMENTAR
```
GET /api/specialist/quotes/pending-review
Deveria retornar orçamentos com status: admin_review
```

---

## 🔍 Como Verificar

### Revisão foi solicitada?
```sql
SELECT status FROM quotes WHERE id = :quoteId;
-- Se = 'specialist_time_revision_requested' → SIM
```

### Parceiro já respondeu?
```sql
SELECT * FROM quote_time_reviews
WHERE quote_id = :quoteId 
  AND action = 'partner_updated'
ORDER BY created_at DESC LIMIT 1;
-- Se existe → SIM
```

### Quantas revisões já foram feitas?
```sql
SELECT 
  COUNT(*) FILTER (WHERE action = 'revision_requested') as solicitacoes,
  COUNT(*) FILTER (WHERE action = 'partner_updated') as atualizacoes
FROM quote_time_reviews
WHERE quote_id = :quoteId;
```

---

## 📦 Cards do Dashboard

### Parceiro

**Card 1: "Revisão de Prazos Solicitada" (Laranja)**
- Mostra: `specialist_time_revision_requested`
- Ação: Botão "Revisar Prazos" → Abre TimeRevisionModal

**Card 2: "Orçamentos em Análise" (Branco)**
- Mostra: `admin_review` + `pending_admin_approval`
- Se `has_time_revision=true`: Botão "Revisar Prazos"
- Se `has_time_revision=false`: Botão "Ver Detalhes"

### Especialista ⚠️ FALTA IMPLEMENTAR

**Card: "Revisões Pendentes" (Sugestão)**
- Mostra: `admin_review` (após partner_updated)
- Ação: Botão "Revisar Prazos Ajustados"

---

## 📈 Exemplo de Histórico

```
Orçamento #ABC123 - 2 ciclos de revisão

1. 10/10 10:00 - Orçamento criado
2. 11/10 14:00 - Admin aprovou → approved
3. 12/10 11:00 - Especialista solicitou revisão (1ª vez)
                 Item-1: 2→5 dias | Item-2: 1→3 dias
4. 13/10 15:30 - Parceiro ajustou prazos (1ª vez)
                 Status: admin_review
5. 14/10 10:00 - Especialista solicitou NOVA revisão (2ª vez)
                 Item-1: 5→7 dias
6. 14/10 16:00 - Parceiro ajustou prazos (2ª vez)
                 Status: admin_review
7. 15/10 09:00 - Especialista APROVOU prazos finais
                 Status: specialist_time_approved ✅

Total: 2 rodadas de revisão antes da aprovação
```

---

## 🚀 Melhorias Sugeridas

### Curto Prazo
1. ✅ Criar API para especialista listar revisões pendentes
2. ✅ Adicionar card no dashboard do especialista
3. ✅ Implementar notificações por email

### Médio Prazo
4. ✅ Adicionar contador de revisões
5. ✅ Limitar número máximo de revisões
6. ✅ Timeline visual de histórico

### Longo Prazo
7. ✅ Notificações em tempo real (WebSocket)
8. ✅ Chatbot para mediação entre parceiro e especialista
9. ✅ Sugestões automáticas de prazos baseadas em histórico

---

## 📚 Documentação Completa

- **Controle Detalhado:** [TIME_REVISION_FLOW_CONTROL.md](./TIME_REVISION_FLOW_CONTROL.md)
- **Diagramas Visuais:** [TIME_REVISION_FLOW_DIAGRAM.md](./TIME_REVISION_FLOW_DIAGRAM.md)
- **Planejamento Original:** [PARTNER_TIME_REVISION_FLOW.md](./PARTNER_TIME_REVISION_FLOW.md)

---

## ✅ Checklist de Implementação

### Implementado
- [x] Especialista solicita revisão
- [x] Parceiro visualiza solicitação
- [x] Parceiro ajusta prazos via modal
- [x] Registro de ações no banco
- [x] Card laranja para revisões pendentes
- [x] Card branco para orçamentos em análise

### Pendente
- [ ] Notificação ao especialista após atualização do parceiro
- [ ] Dashboard do especialista para revisões pendentes
- [ ] Contador de revisões
- [ ] Limite máximo de revisões
- [ ] Timeline visual de histórico
- [ ] Comparativo de prazos (original vs sugerido vs ajustado)
- [ ] Status `pending_specialist_review` (mais claro)
- [ ] Emails automáticos de notificação
- [ ] Testes end-to-end do loop completo
