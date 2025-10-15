# Diagrama de Fluxo - Revisão de Prazos

> **📖 Documentação Relacionada:**
> - [Resumo Executivo](./TIME_REVISION_FLOW_SUMMARY.md) - Visão rápida e checklist
> - [Controle Detalhado](./TIME_REVISION_FLOW_CONTROL.md) - Explicação técnica completa
> - [Planejamento Original](./PARTNER_TIME_REVISION_FLOW.md) - Especificação inicial

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE REVISÃO DE PRAZOS                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  PARCEIRO       │
│  Cria Orçamento │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Status: pending_partner │
└────────┬────────────────┘
         │ Parceiro submete
         ▼
┌──────────────────────────────┐
│ Status: pending_admin_approval│
└────────┬─────────────────────┘
         │ Admin aprova
         ▼
┌─────────────────┐
│ Status: approved │◄─────────────────────────────────────────┐
└────────┬────────┘                                           │
         │                                                    │
         │ Especialista analisa prazos                       │
         │                                                    │
    ┌────┴─────┐                                            │
    │          │                                            │
    ▼          ▼                                            │
┌─────────┐  ┌─────────────────────────────────────┐       │
│ APROVADO│  │     SOLICITA REVISÃO                │       │
│         │  │                                     │       │
└────┬────┘  └──────────────┬──────────────────────┘       │
     │                      │                               │
     │                      │ POST /specialist/quotes/      │
     │                      │      [quoteId]/review-times   │
     │                      │                               │
     │                      ▼                               │
     │       ┌──────────────────────────────────────┐       │
     │       │ Cria registro:                       │       │
     │       │   action: 'revision_requested'       │       │
     │       │   revision_requests: {               │       │
     │       │     "item-id": {                     │       │
     │       │       suggested_days: 5,             │       │
     │       │       reason: "..."                  │       │
     │       │     }                                │       │
     │       │   }                                  │       │
     │       └──────────────┬───────────────────────┘       │
     │                      │                               │
     │                      ▼                               │
     │       ┌─────────────────────────────────────────┐    │
     │       │ Status: specialist_time_revision_requested│  │
     │       └──────────────┬──────────────────────────┘    │
     │                      │                               │
     │                      │ ⚠️ PARCEIRO DEVE AGIR          │
     │                      │                               │
     │                      ▼                               │
     │       ┌────────────────────────────────────┐         │
     │       │ CARD: "Revisão de Prazos Solicitada"│        │
     │       │ (laranja, urgente)                │         │
     │       └──────────────┬─────────────────────┘         │
     │                      │                               │
     │                      │ Parceiro clica "Revisar Prazos"│
     │                      │                               │
     │                      ▼                               │
     │       ┌────────────────────────────────────┐         │
     │       │ TimeRevisionModal                 │         │
     │       │ - Mostra sugestões do especialista│         │
     │       │ - Permite editar prazos           │         │
     │       │ - Botão "Aplicar Sugestão"        │         │
     │       └──────────────┬─────────────────────┘         │
     │                      │                               │
     │                      │ PUT /partner/quotes/          │
     │                      │     [quoteId]/update-times    │
     │                      │                               │
     │                      ▼                               │
     │       ┌──────────────────────────────────────┐       │
     │       │ 1. Atualiza quote_items:             │       │
     │       │    SET estimated_days = :newDays     │       │
     │       │                                      │       │
     │       │ 2. Cria registro:                    │       │
     │       │    action: 'partner_updated'         │       │
     │       │    comments: "Prazos ajustados..."   │       │
     │       │                                      │       │
     │       │ 3. Atualiza status:                  │       │
     │       │    status = 'admin_review'           │       │
     │       └──────────────┬───────────────────────┘       │
     │                      │                               │
     │                      ▼                               │
     │       ┌─────────────────────────────┐                │
     │       │ Status: admin_review        │                │
     │       └──────────────┬──────────────┘                │
     │                      │                               │
     │                      ▼                               │
     │       ┌────────────────────────────────────┐         │
     │       │ CARD: "Orçamentos em Análise"     │         │
     │       │ (branco, informativo)             │         │
     │       │ has_time_revision: true           │         │
     │       └──────────────┬─────────────────────┘         │
     │                      │                               │
     │                      │ ⚠️ ESPECIALISTA DEVE REVISAR   │
     │                      │    OS NOVOS PRAZOS            │
     │                      │                               │
     │                      ▼                               │
     │       ┌─────────────────────────────────────┐        │
     │       │ Especialista Analisa Ajustes        │        │
     │       └──────────────┬──────────────────────┘        │
     │                      │                               │
     │                 ┌────┴─────┐                         │
     │                 │          │                         │
     │                 ▼          ▼                         │
     │         ┌─────────┐   ┌──────────────────┐          │
     │         │ APROVADO│   │ SOLICITA NOVA    │          │
     │         │         │   │ REVISÃO (LOOP)   │          │
     │         └────┬────┘   └──────┬───────────┘          │
     │              │               │                      │
     │              │               │ POST /specialist/    │
     │              │               │      review-times    │
     │              │               │ action: revision_    │
     │              │               │         requested    │
     │              │               │                      │
     │              │               ▼                      │
     │              │    ┌─────────────────────────────┐   │
     │              │    │ Status:                     │   │
     │              │    │ specialist_time_revision_   │   │
     │              │    │         requested           │   │
     │              │    └──────────┬──────────────────┘   │
     │              │               │                      │
     │              │               └──────────────────────┘
     │              │            ♻️ VOLTA AO CARD LARANJA
     │              │            (novo ciclo de revisão)
     │              │
     │              ▼
     │   ┌──────────────────────────────┐
     │   │ Status: specialist_time_approved│
     │   │ (Prazos aprovados pelo especialista)│
     │   └──────────────┬───────────────┘
     │                  │
     │                  │ Admin aprova orçamento final
     │                  │
     │                  ▼
     │      ┌─────────────────────────────┐
     │      │ Admin aprova                │
     │      └──────────────┬──────────────┘
     │                     │
     │                     └─────────────────────────────────┘
     │                         (volta para approved - execução)
     │
     ▼
   [Continua fluxo de execução...]


═══════════════════════════════════════════════════════════════════════════════
                            TABELA DE TRANSIÇÕES
═══════════════════════════════════════════════════════════════════════════════

┌────────────────────┬──────────────────────┬─────────────────────────────────┐
│  Status Atual      │  Ação                │  Próximo Status                 │
├────────────────────┼──────────────────────┼─────────────────────────────────┤
│ pending_partner    │ Parceiro submete     │ pending_admin_approval          │
│ pending_admin_approval│ Admin aprova      │ approved                        │
│ approved           │ Especialista aprova  │ specialist_time_approved        │
│ approved           │ Especialista revisa  │ specialist_time_revision_requested│
│ specialist_time_   │ Parceiro atualiza    │ admin_review                    │
│ revision_requested │                      │                                 │
│ admin_review       │ Especialista aprova  │ specialist_time_approved        │
│ admin_review       │ Especialista revisa  │ specialist_time_revision_requested│
│                    │ (nova rodada)        │ ♻️ LOOP                         │
│ specialist_time_   │ Admin aprova final   │ approved (execução)             │
│ approved           │                      │                                 │
└────────────────────┴──────────────────────┴─────────────────────────────────┘

⚠️ IMPORTANTE: O loop admin_review ↔ specialist_time_revision_requested pode
se repetir MÚLTIPLAS VEZES até que o especialista aprove os prazos.


═══════════════════════════════════════════════════════════════════════════════
                        REGISTROS NA quote_time_reviews
═══════════════════════════════════════════════════════════════════════════════

┌──────────────────────┬─────────────────┬────────────────────────────────────┐
│  Action              │  Criado Por     │  Quando                            │
├──────────────────────┼─────────────────┼────────────────────────────────────┤
│ revision_requested   │ Especialista    │ Especialista solicita revisão      │
│                      │                 │ - specialist_id: UUID              │
│                      │                 │ - revision_requests: JSONB         │
│                      │                 │ - comments: TEXT                   │
├──────────────────────┼─────────────────┼────────────────────────────────────┤
│ approved             │ Especialista    │ Especialista aprova todos os prazos│
│                      │                 │ - specialist_id: UUID              │
│                      │                 │ - comments: TEXT                   │
├──────────────────────┼─────────────────┼────────────────────────────────────┤
│ partner_updated      │ Parceiro        │ Parceiro ajusta prazos solicitados │
│                      │                 │ - specialist_id: NULL              │
│                      │                 │ - comments: TEXT                   │
└──────────────────────┴─────────────────┴────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                            CARDS DO DASHBOARD PARCEIRO
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  CARD 1: "Revisão de Prazos Solicitada" (Laranja/Urgente)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  API: GET /api/partner/quotes/pending-time-revisions                        │
│                                                                              │
│  Filtro: status = 'specialist_time_revision_requested'                      │
│                                                                              │
│  Exibe:                                                                      │
│    - Orçamento #ABC123                                                       │
│    - Veículo: ABC-1234 | Cliente: João Silva                               │
│    - Solicitado há: 2 dias                                                  │
│    - Comentário: "Prazos muito curtos para serviços complexos"             │
│                                                                              │
│  Ações:                                                                      │
│    [Revisar Prazos] → Abre TimeRevisionModal                               │
│    [Ver Detalhes]   → Abre página do orçamento                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  CARD 2: "Orçamentos em Análise" (Branco/Informativo)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  API: GET /api/partner/quotes/in-review                                     │
│                                                                              │
│  Filtro: status IN ('admin_review', 'pending_admin_approval',               │
│                     'specialist_time_revision_requested')                   │
│                                                                              │
│  Exibe (com has_time_revision: true):                                       │
│    - Orçamento #XYZ789                                                       │
│    - Veículo: XYZ-5678 | Cliente: Maria Santos                             │
│    - Aguardando há: 1 dia                                                   │
│    - Status: "Solicitação de revisão de prazos pelo especialista"          │
│                                                                              │
│  Exibe (com has_time_revision: false):                                      │
│    - Orçamento #DEF456                                                       │
│    - Veículo: DEF-9012 | Cliente: Pedro Costa                              │
│    - Aguardando há: 3 dias                                                  │
│    - Status: "Aguardando revisão do admin - Você já fez sua parte!"        │
│                                                                              │
│  Ações:                                                                      │
│    [Revisar Prazos] (se has_time_revision) → TimeRevisionModal             │
│    [Ver Detalhes]   (se !has_time_revision) → Página do orçamento          │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                         LÓGICA DE DECISÃO NO FRONTEND
═══════════════════════════════════════════════════════════════════════════════

// PartnerDashboard.tsx
const handleViewQuoteDetails = (quoteId: string) => {
  const quote = quotesInReview.find(q => q.quote_id === quoteId);
  
  if (quote?.has_time_revision) {
    // TEM REVISÃO: Abre modal de edição
    setSelectedQuoteForRevision(quoteId);
    setShowTimeRevisionModal(true);
  } else {
    // SEM REVISÃO: Redireciona para visualização
    router.push(`/dashboard/partner/orcamento?quoteId=${quoteId}`);
  }
};


═══════════════════════════════════════════════════════════════════════════════
                       EXEMPLO DE HISTÓRICO COM MÚLTIPLAS REVISÕES
═══════════════════════════════════════════════════════════════════════════════

Quote ID: 94621dbc-3bb7-45e1-8b73-1810175b2ecb

Timeline:
  
  1. 2025-10-10 09:00 | quotes.status = 'pending_partner'
     → Orçamento criado
  
  2. 2025-10-10 10:00 | quotes.status = 'pending_admin_approval'
     → Parceiro submeteu orçamento
  
  3. 2025-10-11 14:00 | quotes.status = 'approved'
     → Admin aprovou orçamento
  
  ┌──────────────────────────────────────────────────────────────────────┐
  │                       🔄 INÍCIO DO CICLO DE REVISÕES                 │
  └──────────────────────────────────────────────────────────────────────┘
  
  4. 2025-10-12 11:00 | quote_time_reviews.action = 'revision_requested'
                      | quotes.status = 'specialist_time_revision_requested'
     → ⚠️ [1ª REVISÃO] Especialista solicitou revisão de prazos
     → revision_requests: {
         "item-1": {suggested_days: 5, reason: "Muito curto"},
         "item-2": {suggested_days: 3, reason: "Aguardar peças"}
       }
  
  5. 2025-10-13 15:30 | quote_time_reviews.action = 'partner_updated'
                      | quote_items.estimated_days atualizado
                      | quotes.status = 'admin_review'
     → ✅ [1ª RESPOSTA] Parceiro ajustou prazos
     → Item-1: 2 dias → 5 dias
     → Item-2: 1 dia → 3 dias
  
  6. 2025-10-14 10:00 | quote_time_reviews.action = 'revision_requested'
                      | quotes.status = 'specialist_time_revision_requested'
     → ⚠️ [2ª REVISÃO] Especialista solicita NOVA revisão (loop)
     → revision_requests: {
         "item-1": {suggested_days: 7, reason: "Ainda insuficiente"}
       }
     → Comentário: "Item-2 OK, mas item-1 precisa mais tempo"
  
  7. 2025-10-14 16:00 | quote_time_reviews.action = 'partner_updated'
                      | quote_items.estimated_days atualizado
                      | quotes.status = 'admin_review'
     → ✅ [2ª RESPOSTA] Parceiro ajustou novamente
     → Item-1: 5 dias → 7 dias
  
  8. 2025-10-15 09:00 | quote_time_reviews.action = 'approved'
                      | quotes.status = 'specialist_time_approved'
     → ✅ [APROVAÇÃO FINAL] Especialista aprovou prazos finais
     → Comentário: "Prazos adequados, pode prosseguir"
  
  ┌──────────────────────────────────────────────────────────────────────┐
  │                       ✅ FIM DO CICLO DE REVISÕES                    │
  │                     (Após 2 rodadas de revisão)                      │
  └──────────────────────────────────────────────────────────────────────┘
  
  9. 2025-10-15 14:00 | quotes.status = 'approved'
     → Admin aprova orçamento final para execução


RESUMO DO CICLO:
  - 2 solicitações de revisão pelo especialista
  - 2 atualizações de prazos pelo parceiro
  - 1 aprovação final do especialista
  - Total de 5 registros na quote_time_reviews
═══════════════════════════════════════════════════════════════════════════════
                              QUERIES DE VERIFICAÇÃO
═══════════════════════════════════════════════════════════════════════════════

-- Verificar se orçamento tem revisão solicitada
SELECT 
  q.id,
  q.status,
  EXISTS(
    SELECT 1 
    FROM quote_time_reviews qtr 
    WHERE qtr.quote_id = q.id 
      AND qtr.action = 'revision_requested'
  ) as has_revision_requested,
  EXISTS(
    SELECT 1 
    FROM quote_time_reviews qtr 
    WHERE qtr.quote_id = q.id 
      AND qtr.action = 'partner_updated'
  ) as partner_already_updated
FROM quotes q
WHERE q.id = '94621dbc-3bb7-45e1-8b73-1810175b2ecb';


-- Ver última ação de cada tipo
SELECT DISTINCT ON (action)
  action,
  created_at,
  comments
FROM quote_time_reviews
WHERE quote_id = '94621dbc-3bb7-45e1-8b73-1810175b2ecb'
ORDER BY action, created_at DESC;


-- Contar ciclos de revisão
SELECT 
  COUNT(*) FILTER (WHERE action = 'revision_requested') as revision_count,
  COUNT(*) FILTER (WHERE action = 'partner_updated') as update_count,
  COUNT(*) FILTER (WHERE action = 'approved') as approval_count
FROM quote_time_reviews
WHERE quote_id = '94621dbc-3bb7-45e1-8b73-1810175b2ecb';
```


═══════════════════════════════════════════════════════════════════════════════
                          ⚠️ GAPS DE IMPLEMENTAÇÃO
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  PROBLEMA 1: ESPECIALISTA NÃO É NOTIFICADO                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Status Atual:                                                               │
│    Parceiro atualiza prazos → status = 'admin_review'                      │
│    ❌ Especialista não recebe notificação                                    │
│    ❌ Especialista não tem dashboard de "pendentes de revisão"              │
│    ❌ Processo fica travado esperando ação do especialista                  │
│                                                                              │
│  Soluções Necessárias:                                                       │
│    1. ✅ Criar API: GET /api/specialist/quotes/pending-review               │
│    2. ✅ Criar Card no Dashboard do Especialista                            │
│    3. ✅ Enviar notificação por email/push                                  │
│    4. ✅ Mudar status para 'pending_specialist_review' (mais claro)         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  PROBLEMA 2: LOOP INFINITO NÃO CONTROLADO                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Cenário Problemático:                                                       │
│    Especialista solicita revisão → Parceiro ajusta                          │
│    → Especialista rejeita novamente → Parceiro ajusta                       │
│    → Especialista rejeita novamente... (infinito)                           │
│                                                                              │
│  Impactos:                                                                   │
│    ❌ Frustração de ambas as partes                                          │
│    ❌ Orçamento pode ficar travado indefinidamente                          │
│    ❌ Sem métricas de quantas revisões foram feitas                         │
│                                                                              │
│  Soluções Necessárias:                                                       │
│    1. ✅ Adicionar coluna: quotes.revision_count                            │
│    2. ✅ Limitar a 3 revisões máximo                                        │
│    3. ✅ Após limite, escalar para admin decidir                            │
│    4. ✅ Exibir contador de revisões no frontend                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  PROBLEMA 3: FALTA HISTÓRICO VISUAL                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Necessidades:                                                               │
│    ❌ Timeline visual mostrando todas as revisões                           │
│    ❌ Comparativo: prazo original → sugerido → ajustado                     │
│    ❌ Histórico de comentários em ordem cronológica                         │
│                                                                              │
│  Onde Mostrar:                                                               │
│    1. Modal de revisão de prazos (para parceiro)                            │
│    2. Modal de análise de prazos (para especialista)                        │
│    3. Dashboard admin (visão geral)                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                       FLUXO IDEAL COM MELHORIAS IMPLEMENTADAS
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  PASSO 1: Especialista Solicita Revisão                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  POST /api/specialist/quotes/[quoteId]/review-times                         │
│  ✅ Status: approved → specialist_time_revision_requested                   │
│  ✅ Cria registro: action = 'revision_requested'                            │
│  ✅ Incrementa: revision_count = 1                                          │
│  ✅ Notificação: Email/Push para parceiro                                   │
│  ✅ Card Laranja: Aparece no dashboard do parceiro                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PASSO 2: Parceiro Atualiza Prazos                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  PUT /api/partner/quotes/[quoteId]/update-times                             │
│  ✅ Atualiza: quote_items.estimated_days                                    │
│  ✅ Cria registro: action = 'partner_updated'                               │
│  ✅ Status: specialist_time_revision_requested → pending_specialist_review  │
│  ✅ Notificação: Email/Push para especialista                               │
│  ✅ Card: Aparece em "Pendentes de Revisão" do especialista                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PASSO 3: Especialista Revisa Novamente                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  GET /api/specialist/quotes/pending-review                                  │
│  ✅ Lista orçamentos em pending_specialist_review                           │
│  ✅ Mostra histórico completo de revisões                                   │
│  ✅ Exibe contador: "Revisão 1 de 3"                                        │
│                                                                              │
│  Decisão do Especialista:                                                   │
│    A) Aprovar → specialist_time_approved (FIM)                              │
│    B) Solicitar nova revisão → Verifica revision_count                      │
│       - Se < 3: Permite nova revisão (LOOP)                                 │
│       - Se >= 3: Bloqueia e escala para admin                               │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                            STATUS SUGERIDOS (NOVOS)
═══════════════════════════════════════════════════════════════════════════════

┌──────────────────────────────────┬─────────────────────────────────────────┐
│  Status Atual                     │  Status Sugerido (Mais Claro)          │
├──────────────────────────────────┼─────────────────────────────────────────┤
│ admin_review                      │ pending_specialist_review               │
│ (genérico, não fica claro         │ (deixa explícito que especialista       │
│  quem deve agir)                  │  precisa revisar novamente)             │
└──────────────────────────────────┴─────────────────────────────────────────┘

Vantagens do novo status:
  ✅ Fica claro no código quem é o responsável pela ação
  ✅ Facilita criar queries para dashboard do especialista
  ✅ Evita confusão com outras revisões do admin
  ✅ Permite RLS policies mais específicas

