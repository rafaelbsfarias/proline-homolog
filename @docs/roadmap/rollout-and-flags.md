# Rollout, Feature Flags e Monitoramento

Status: proposta (alvo de implementação)

## Feature Flags

- `checklist.partner_model.enabled`: ativa novo modelo de dados e endpoints para parceiros
  selecionados.
- `checklist.viewer.categories_v2`: usa nova agregação de categorias por parceiro.
- `checklist.mech.compat_layer`: liga camada de compatibilidade para mecânica.

## Estratégia de Rollout

- Staging: ativar 100% para validação de carga, latência e erros.
- Produção (gradual): por cliente, parceiro ou categoria (mecânica vs genéricas).
- Observabilidade: métricas por endpoint (latência, taxa de erro), contagem de evidências,
  divergência de `item_key`.

## Monitoramento

- Dashboards com: P50/P95 por endpoint, taxa de upload, falhas de salvamento.
- Alertas: erro 5xx > 1% por 5 min; picos de latência > 800ms P95.

## Rollback

- Flags podem ser desligadas por cliente/parceiro em minutos.
- Read path do viewer mantém fallback para legado quando necessário.
