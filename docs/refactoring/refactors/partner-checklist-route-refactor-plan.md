# Plano de Refatoração — `app/api/partner-checklist/route.ts`

Estado: Proposta inicial

Objetivo: reduzir tamanho e complexidade do handler, separar responsabilidades (rota, orquestração, serviços, repositórios, mapeadores), padronizar contratos e logs, e alinhar o código aos princípios definidos em `docs/DEVELOPMENT_INSTRUCTIONS.md` (DRY, SOLID, Arquitetura Modular, Object Calisthenics, segurança e limpeza de debug em produção).

## Problemas Atuais

- Tamanho excessivo (~800 linhas) e múltiplas responsabilidades no mesmo arquivo (autenticação, validação, queries, regras de negócio, mapeamento, geração de signed URLs e compatibilidade legada).
- Fluxo com ramificações complexas (quote → mechanics/anomalies; fallbacks legados por `inspection_id`/`vehicle_id`).
- Lógica de acesso a dados acoplada à camada HTTP, dificultando testes e reuso.
- Logging verboso com muitos `info` e mensagens de debug no caminho quente.
- Ausência de validação de entrada/saída tipada formal (ex.: `vehicleId`).
- Mistura de normalização/agrupamento (categoria por `item_key`) com acesso a dados.
- Regras de segurança não centralizadas (escopo por parceiro/veículo e política de exposição de URLs assinadas espalhadas no handler).

## Objetivos de Refatoração (alinhados ao DEVELOPMENT_INSTRUCTIONS.md)

- Single Responsibility: cada arquivo com uma responsabilidade clara (rota mínima, controller, serviços, repositórios, mapeadores, validações).
- DRY e modularidade: reutilizar geração de signed URL, busca de items/evidences/anomalias e agrupamento por categoria.
- Segurança: validação de entrada com schema; evitar logs sensíveis; reduzir verbosidade em produção; garantir escopo por parceiro/veículo; expor apenas URLs assinadas com TTL adequado.
- Testabilidade: separar regras de negócio em serviços puros; repositórios finos; erros semânticos.
- Compatibilidade: manter contrato atual de resposta durante a transição; preservar fallbacks legados sob um orquestrador; plano para remoção gradual de caminhos legados.

## Arquitetura Proposta

Estruturar por camadas dentro de `modules/partner` (ou `modules/partner/checklist`), mantendo a rota fina:

- `app/api/partner-checklist/route.ts`
  - Papel: apenas transformar Request → Controller e Controller → NextResponse.
  - Sem lógica de negócio/acesso a dados.

- `modules/partner/checklist/controller/partnerChecklistController.ts`
  - Papel: orquestrar fluxo: validar query, resolver parceiro a partir do quote aprovado, despachar para serviço por tipo (`mechanic` vs demais), aplicar fallbacks legados quando necessário, e consolidar o DTO de resposta.

- `modules/partner/checklist/services/mechanicsChecklistService.ts`
  - Papel: carregar checklist mecânico, itens, evidências, assinar URLs, compor DTO e estatísticas.

- `modules/partner/checklist/services/anomaliesService.ts`
  - Papel: carregar anomalias e assinar fotos, compor DTO e estatísticas.

- `modules/partner/checklist/repositories/*Repository.ts`
  - `QuotesRepository`: busca de quote aprovado por `vehicle_id` + join com parceiro.
  - `MechanicsChecklistRepository`: checklist, itens e evidências (prioridade: `quote_id` → `inspection_id` → `vehicle_id` em último caso), sempre com escopo por parceiro quando aplicável.
  - `AnomaliesRepository`: anomalias por `vehicle_id` (e futuramente por `partner_id`, se o modelo evoluir).

- `modules/partner/checklist/mappers/*Mapper.ts`
  - Mapear linhas do banco em DTOs consumidos pela API (itens, evidências com URLs, anomalias com fotos assinadas, checklist header, `itemsByCategory`).

- `modules/partner/checklist/schemas.ts`
  - Zod (ou equivalente) para validar `vehicleId` na entrada e os DTOs de saída principais.

- `modules/partner/checklist/utils/*`
  - `signedUrlService.ts`: criação de URLs assinadas para `vehicle-media` com TTL padrão.
  - `groupByCategory.ts`: regra de agrupamento por `item_key` → categoria, isolada e testável.
  - `errors.ts`: `AppError`, `NotFoundError`, `ValidationError`, com `statusCode`.

- `modules/partner/checklist/logging.ts`
  - Logger configurado com níveis e mensagens sintetizadas; reduzir `info` no caminho crítico, manter `warn/error` com contexto.

## Contratos e Compatibilidade

Resposta atual a manter na transição (mecânica):

```
{
  "type": "mechanics",
  "checklist": { id, vehicle_id, partner: { id, name, type }, status, notes, created_at },
  "itemsByCategory": { [categoria]: ItemWithEvidences[] },
  "stats": { totalItems }
}
```

Resposta atual a manter na transição (anomalias):

```
{
  "type": "anomalies",
  "checklist": { vehicle_id, partner: { id, name, type } },
  "anomalies": Anomaly[],
  "stats": { totalAnomalies }
}
``;

Notas:
- Padronizar `partner.type` para `mechanic`/`<outros>` seguindo nomenclatura existente.
- URLs sempre assinadas; nunca retornar `storage_path` cru.
- Adotar `context` interno (quote_id/inspection_id/vehicle_id) definido no serviço, não expor no contrato.

## Passos de Refatoração (incremental)

1) Introduzir camada de utilidades e contratos
- Criar `schemas.ts` para `QuerySchema = { vehicleId: string }` e DTOs de saída.
- Extrair `groupByCategory.ts` com o mapa atual por `item_key` e testes unitários.
- Criar `signedUrlService.ts` com TTL configurável e função pura assíncrona.

2) Repositórios e serviços
- Implementar `QuotesRepository`, `MechanicsChecklistRepository`, `AnomaliesRepository` com funções focadas (sem logs excessivos), retornando tipos fortes.
- Implementar `mechanicsChecklistService.ts` e `anomaliesService.ts` consumindo repositórios e utilidades (sem NextResponse), lançando `AppError`s significativos.

3) Controller e rota fina
- Implementar `partnerChecklistController.ts` que: valida query, resolve parceiro via quote, decide serviço a chamar, aplica fallbacks legados e captura erros para status HTTP apropriados.
- Alterar `app/api/partner-checklist/route.ts` para delegar à função do controller e apenas converter em `NextResponse`.

4) Logging e segurança
- Substituir logs de debug por logs de nível adequado, com chaves estáveis (ex.: `event=mechanics_fetch`, `event=anomalies_fetch`, `vehicleId_hash` quando necessário).
- Revisar escopo de dados por parceiro/veículo nos repositórios (filtro por `partner_id` quando disponível) e revisar RLS no Supabase (fora do escopo deste PR, mas documentado).

5) Testes e limpeza
- Adicionar testes unitários para `groupByCategory`, `signedUrlService` e mapeadores.
- Adicionar testes de serviço com cenários de fallback (quote → inspection → vehicle).
- Adicionar teste de integração leve do controller (mock de repositórios).
- Remover código morto e comentários de debug do handler antigo.

## Critérios de Aceite

- `route.ts` com <= 60 linhas e apenas glue code HTTP.
- Serviços e repositórios sem dependência de `NextResponse` ou objetos HTTP.
- Contratos de resposta preservados nos caminhos existentes.
- Erros mapeados em códigos HTTP adequados: 400 (validação), 404 (não encontrado), 500 (erros internos/externos).
- Logs reduzidos e consistentes; sem dados sensíveis; TTL padrão configurável para URLs assinadas.

## Riscos e Mitigações

- Divergência de contrato: cobrir com testes e snapshot de respostas conhecidas.
- Regressão em fallbacks legados: validar com massa de dados que possui `inspection_id`/`vehicle_id` sem `quote_id`.
- Custos de I/O por assinatura de URLs: manter batch/Promise.all, ajustar TTL e evitar assinaturas desnecessárias (não assinar quando não há `storage_path`).

## Plano de Rollout

- Fase 1: Introduzir utilidades, repositórios e serviços sem alterar a rota (através de novos módulos não referenciados).
- Fase 2: Criar controller e alternar rota para usar o controller atrás de flag de ambiente (ex.: `CHECKLIST_CONTROLLER_ENABLED`).
- Fase 3: Remover caminhos antigos na rota, promover controller como padrão, apagar código morto.
- Fase 4: Ajustar níveis de logs, revisar métricas e adicionar monitoramento de erros.

## Referências

- `docs/DEVELOPMENT_INSTRUCTIONS.md`: DRY, SOLID, Arquitetura Modular, segurança, limpeza de debug.
- `app/api/partner-checklist/route.ts`: ponto atual a ser fatiado.
- Padrões internos recentemente adotados para hooks/constantes (ex.: `modules/partner/constants/checklist.ts`) como guia de organização modular.

