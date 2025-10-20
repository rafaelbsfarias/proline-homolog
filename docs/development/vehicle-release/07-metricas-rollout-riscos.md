# 07) Métricas, Rollout e Riscos

## Métricas de Sucesso
- Tempo médio entre “Finalizado” e agendamento (retirada/entrega).
- Taxa de conclusão por tipo (retirada vs entrega).
- Tempo médio de entrega até “Entregue”.

## Plano de Rollout
- Fase 0: detectar prontidão em modo somente leitura (feature flag), CTAs desabilitados para QA.
- Fase 1: habilitar CTAs do cliente e criação de pedidos; tela de Ops somente leitura.
- Fase 2: ações de Ops (aprovar, agendar, atribuir, progresso), notificações e timeline.
- Fase 3: portal/logística opcional; métricas e melhorias.
- Salvaguardas: sem alterações na delegação/queue; novas tabelas com RLS.

## Riscos e Mitigações
- Ambiguidade de estados de orçamento/execução → consolidar prontidão via RPC única e testada.
- Exposição de dados sensíveis (endereços) → restringir PII em timeline e políticas de acesso.
- Sobrecarga operacional no Ops → fila e filtros claros; status padronizados.

