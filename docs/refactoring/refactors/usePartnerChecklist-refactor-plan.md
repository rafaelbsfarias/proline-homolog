# Plano de Refatoração — modules/partner/hooks/usePartnerChecklist.ts

Status: proposta (alvo de implementação)

Motivação: o arquivo atual é grande, agrega múltiplas responsabilidades (formulário, evidências, anomalias, chamadas a API, side-effects e integração de UI) e viola princípios do projeto definidos em docs/DEVELOPMENT_INSTRUCTIONS.md (SOLID, Arquitetura Modular e Object Calisthenics).

## Objetivos
- Responsabilidade única por módulo/hook (SRP/SOLID).
- Isolar efeitos colaterais (I/O, storage, uploads) de estado de UI.
- Melhorar tipagem, legibilidade e testabilidade.
- Reduzir acoplamento com páginas e componentes.
- Eliminar hacks (ex.: sessionStorage ‘loaded_part_requests’) substituindo por fluxo de dados formal.

## Problemas identificados (antipadrões)
- Tamanho do arquivo e múltiplas razões para mudança (form, evidências, anomalias, requisições e timeline).
- Acesso direto a sessionStorage para part-requests, criando acoplamento implícito e estado oculto.
- Mistura de camadas: lógica de domínio, chamadas HTTP (serviço), composição de payloads de upload e manipulação de UI/Toast no mesmo hook.
- Tipos amplos com `any` e objetos dinâmicos sem contrato único.
- Logging misturado com transformação de dados, dificultando testes puros.

## Diretrizes de refatoração (alinhadas ao DEVELOPMENT_INSTRUCTIONS.md)
- DRY e Arquitetura Modular: extrair serviços e utilitários compartilháveis.
- SOLID: separar por responsabilidade (form, evidências, anomalias, API, mapeamentos).
- Object Calisthenics: funções curtas, nomes explícitos, objetos pequenos e coesos.
- React/TS boas práticas: hooks focados, dependências claras, sem efeitos escondidos.
- Remover debugs após resolução; manter logs estruturados via logger util.

## Nova estrutura proposta

- `modules/partner/hooks/checklist/`
  - `useChecklistForm.ts`: estado e ações do formulário (valores, setters, validações locais).
  - `useChecklistEvidences.ts`: estado de evidências (múltiplas por item), adicionar/remover, normalização.
  - `useChecklistAnomalies.ts`: carregar/salvar anomalias, mapear fotos (upload/ref), status.
  - `useChecklistOrchestrator.ts`: orquestra ciclo de vida (load inicial, submit), compondo hooks acima.
- `modules/partner/services/checklistApi.ts`
  - Cliente de API (load/save/submit, anomalies, upload), usando `useAuthenticatedFetch` internamente.
- `modules/partner/mappers/checklistMappers.ts`
  - Normalizações de status, mapeamento item_key<->labels, parsing de URLs de mídia.
- `modules/partner/types/checklist.ts`
  - Tipos de domínio (Form, EvidenceItem, Anomaly, PartRequest, etc.).
- `modules/partner/constants/checklist.ts`
  - `EVIDENCE_KEYS`, enums, limites e mensagens padrão.

Obs.: Páginas e componentes continuam consumindo um único hook de orquestração, mas com responsabilidade delegada.

## Interfaces públicas (contratos)

- `useChecklistForm()`
  - Retorna: `{ form, setField, reset, validate }`
- `useChecklistEvidences()`
  - Retorna: `{ evidences, addEvidence(itemKey, file), removeEvidence(itemKey, id), clear }`
- `useChecklistAnomalies({ vehicleId, inspectionId?, quoteId? })`
  - Retorna: `{ anomalies, load(), save(anomalies), loading, error }`
- `useChecklistOrchestrator({ vehicleId, inspectionId?, quoteId? })`
  - Internamente compõe form/evidences/anomalies + checklistApi
  - Retorna: `{ form, setField, evidences, addEvidence, removeEvidence, loadAll(), saveAll(), submit(), states }`

## Plano de execução (etapas)

1) Tipos e constantes
- Extrair tipos do arquivo atual para `modules/partner/types/checklist.ts`.
- Extrair `EVIDENCE_KEYS` e chaves de notas para `constants/checklist.ts`.

2) Serviços de API
- Criar `checklistApi.ts` com funções puras (sem estado React):
  - `loadChecklist(params)`, `saveChecklist(params)`, `submitChecklist(payload)`
  - `loadAnomalies(params)`, `saveAnomalies(formData)`
  - `getSignedUploadUrl(fileMeta)`, etc.

3) Hooks unitários
- Implementar `useChecklistForm.ts` isolando apenas estado e validação do formulário.
- Implementar `useChecklistEvidences.ts` para coleção por item_key, IDs estáveis e limite/validação.
- Implementar `useChecklistAnomalies.ts` (carregar/salvar + normalização de paths de mídia).

4) Hook orquestrador
- Implementar `useChecklistOrchestrator.ts` consumindo os hooks e o `checklistApi`.
- Responsável por: load inicial (preencher form+evidences), salvar rascunho e submit; sem acessar sessionStorage.
- Repassar part-requests via API (carregamento vem junto dos itens/anomalias, sem sessão).

5) Substituição incremental
- Na página `app/dashboard/partner/checklist/page.tsx`, substituir `usePartnerChecklist` por `useChecklistOrchestrator` mantendo API próxima do atual (para reduzir dif).
- Remover uso de `sessionStorage` para part-requests; usar dados carregados pelo `loadChecklist`/`loadAnomalies`.

6) Limpeza
- Deprecar `usePartnerChecklist.ts`. Manter wrapper fino temporário se necessário para compat.
- Atualizar imports nos componentes que usam `EVIDENCE_KEYS` e tipos.

## Critérios de aceite
- Arquivo original reduzido e/ou substituído por hooks menores (< 300–400 linhas por arquivo; funções < ~50 linhas).
- Nenhuma regressão funcional: edição, upload, exclusão de evidências, salvar rascunho, submit e part-requests por item.
- Sem `sessionStorage` para dados de domínio; dados fluem via API.
- Logs estruturados via logger; sem `console.log`/debugs remanescentes.

## Riscos e mitigação
- Divergência de contratos: mitigar definindo tipos únicos em `types/checklist.ts` e utilitários de mapeamento.
- Regressão de upload: cobrir com testes manuais e mocks de storage; manter fallback/validação.
- Integração com part-requests: garantir que API retorna e aceita esses dados junto dos itens/anomalias.

## Testes e QA
- Testes de contrato de `checklistApi.ts` com mocks (sucesso/erro).
- Testes de hooks unitários (estado, add/remove evidences, validações).
- Cenários end-to-end em staging: load→editar→salvar→reload→submit, com e sem anomalias, múltiplas evidências por item.

## Métricas e monitoramento
- Medir tempo de `loadAll` e `saveAll` (P95), tamanho dos payloads e taxa de erro por endpoint.
- Contar evidências por item e falhas de upload.

## Rollout
- PRs pequenos e isolados por etapa, conforme docs/DEVELOPMENT_INSTRUCTIONS.md.
- Feature flag (se necessário) para alternar entre hooks antigo/novo na página até estabilizar.

## Pós-refatoração (opcional)
- Implementar debounce/batching nos saves.
- Adotar Zod no cliente para validar payloads antes de enviar.
- Melhorar acessibilidade (foco, ARIA) e legibilidade.

