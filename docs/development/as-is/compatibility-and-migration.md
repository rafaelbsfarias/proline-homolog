# Compatibilidade, Migração e Não-regressão (As-Is ➜ Ideal)

Objetivo: alinhar o sistema ao modelo ideal mantendo funcionalidades atuais.

## Estratégia Recomendada

1. Introduzir modelo unificado (novo) em paralelo (dark launch)

- Criar tabelas `partner_checklists`, `partner_checklist_items/evidences`, `partner_part_requests` e
  templates.
- Expor novos endpoints (já em uso parcial) sem quebrar os existentes.

2. Shadow Writes (opcional)

- Ao salvar nos endpoints atuais, escrever também no novo modelo quando possível.
- Em mecânica, mapear itens/evidências legados → novo por `item_key` e contexto.

3. Leitura Híbrida

- Endpoints de visualização (`/api/checklist/view`, `/api/checklist/categories`) leem
  prioritariamente do novo modelo.
- Se inexistente no novo, consultam o legado para preservar cobertura.

4. Cutover Gradual

- Por categoria/cliente/feature flag, mover gravações para o novo modelo.
- Monitorar métricas e corrigir mapeamentos de `item_key`.

5. Desativação do Legado

- Quando cobertura > 95% e divergências resolvidas, interromper writes no legado.
- Backfill final e bloqueio de edição no legado.

## Não-regressão de Funcionalidade

- Requisitos a preservar durante a transição:
  - Parceiros continuam vendo e editando seus checklists.
  - Visualização em `PartnerEvidencesSection` continua mostrando todas as combinações
    `categoria • parceiro`.
  - Evidências não apresentam `src` vazio e mantêm thumbnails.
  - Solicitações de peças por item continuam funcionais.

## Testes e Validações

- Testes de contrato dos endpoints novos x antigos (mesmos cenários retornam dados equivalentes).
- Amostragens de veículos/contextos com múltiplos parceiros para garantir isolamento.
- Ensaios de migração com rollback seguro.

## Plano B (se não migrar mecânica agora)

- Manter camadas de compatibilidade para mecânica usando apenas `quote/inspection + vehicle` e
  `item_key`.
- Adiar inclusão de `partner_id` nas tabelas de mecânica até janela de manutenção.
