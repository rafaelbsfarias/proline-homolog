# Plano de Migração — Checklist/Vistoria por Parceiro

Status: proposta (alvo de implementação)

Este plano descreve os passos para sair do legado e atingir o modelo ideal com isolamento por
parceiro, contexto unificado e visualização consistente.

## Premissas

- Banco: PostgreSQL. Migrações com ferramenta padrão do projeto.
- Zero-downtime: migração sem interrupção perceptível.
- Compatibilidade temporária: etapa de espelhamento/ETL se necessário.

## Etapas

1. Preparação de Esquema (DDL)

- Criar tabelas novas conforme `@docs/data-model.md`:
  - `partner_checklists`, `partner_checklist_items`, `partner_checklist_evidences`,
    `partner_part_requests`.
  - `checklist_templates`, `checklist_template_items` (se não existirem) e views auxiliares.
- Adicionar índices e chaves únicas.

2. Seed de Templates

- Popular templates iniciais: `mechanic@v1` e `generic@v1` com itens e `item_key` estáveis.
- Definir política de versionamento para futuras mudanças.

3. ETL de Dados Legados (se aplicável)

- Identificar origem (ex.: tabelas `mechanics_checklist*`).
- Mapear registros para o novo cabeçalho `partner_checklists` por
  `(partner_id, vehicle_id, context)` e `category` correspondente.
- Migrar itens para `partner_checklist_items` preservando `item_key` (ou mapear chaves antigas para
  novas via tabela de correspondência).
- Migrar evidências para `partner_checklist_evidences` (filtrar URLs vazias/invalidas).
- Migrar solicitações de peças (se existirem) para `partner_part_requests` por `item_key`.

4. Backfill e Consistência

- Garantir unicidade por `(partner_id, vehicle_id, context_type, context_id, category)`.
- Preencher `template_version` adequada em todos os checklists migrados.
- Validar contagens: itens por template, evidências por item, somatórios.

5. API Bridge (Compatibilidade)

- Implementar endpoints novos conforme `@docs/api-spec.md`.
- Se necessário, manter endpoints antigos funcionando e apontando para dados migrados (ou camada de
  compatibilidade que lê de ambos e prioriza o novo).

6. Cutover

- Alternar o frontend para consumir exclusivamente os novos endpoints.
- Monitorar métricas e logs (erros, latência, volume de upload).

7. Limpeza

- Após período de estabilidade, desativar/arquivar tabelas e código legados.