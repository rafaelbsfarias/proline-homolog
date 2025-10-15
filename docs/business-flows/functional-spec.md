# Especificação Funcional — Checklist/Vistoria por Parceiro

Status: proposta (alvo de implementação)

Objetivo: definir o comportamento ideal para checklists/vistorias isolados por parceiro (UUID), com
contexto por orçamento (`quote_id`) ou inspeção (`inspection_id`), checklist exclusivo para Mecânica
e genérico para demais categorias, e compartilhamento somente leitura para
administradores/clientes/especialistas via `PartnerEvidencesSection`.

## Conceitos e Definições

- Parceiro: entidade identificada por `partner_id` (UUID) e classificada por categoria (ex.:
  mecânica, funilaria, pintura, elétrica, etc.).
- Categoria: domínio de atuação do parceiro (enum). Mecânica possui checklist exclusivo (template
  próprio); demais categorias usam checklist genérico.
- Contexto: referência que vincula o checklist ao processo em andamento. Normalizado como
  `(context_type, context_id)` onde:
  - `context_type ∈ {quote, inspection}`
  - `context_id`: UUID de `quote_id` ou `inspection_id` conforme o tipo
- Veículo: identificado por `vehicle_id`.
- Checklist/Vistoria: conjunto de itens avaliados (OK/NOK/NA), com comentários e evidências (mídia).
  Estado: rascunho (draft) e submetido (submitted).
- Evidência: mídia (imagem/vídeo) associada a um item (por `item_key`) e opcionalmente ao registro
  de item.
- Solicitação de Peças: pedido por item (per-item) vinculado ao checklist e ao `item_key`.
- Anomalia: ocorrência derivada de itens NOK, consolidada para visualização e análise
  (opcional/derivada).

## Requisitos Funcionais

1. Isolamento por Parceiro

- Cada parceiro enxerga, cria, edita e submete APENAS o seu checklist para um
  `(vehicle_id, context)`.
- Múltiplos parceiros podem trabalhar simultaneamente no mesmo veículo/contexto sem sobrescrever
  dados alheios.
- Persistência e carregamento sempre respeitam `(partner_id, vehicle_id, context)`.

2. Tipos de Checklist

- Mecânica: checklist exclusivo — pode ter template e lógica própria.
- Genérico: checklist comum às demais categorias (funilaria, pintura, elétrica, etc.).

3. Início de Checklist

- Disparo: após o parceiro receber uma solicitação de orçamento (quote) ou a abertura de inspeção.
- O sistema cria/recupera o checklist do parceiro para `(vehicle_id, context)`; se não existir,
  inicia em rascunho.

4. Itens do Checklist

- Cada item possui: `item_key` (estável e único por template), status `OK|NOK|NA`, comentário,
  severidade opcional, e timestamps.
- Evidências por item: zero ou mais mídias. URLs devem ser válidas; ignorar strings vazias.
- Para mecânica, `item_key` pode divergir do genérico; templates independentes.

5. Solicitação de Peças (per-item)

- Disponível em todos os itens habilitados do checklist do parceiro.
- Ações: criar, editar, remover; vinculada a `(checklist_id, item_key)` e replica
  `partner_id, vehicle_id, context`.
- Estados da solicitação: `draft|sent|approved|rejected|cancelled`. Histórico de atualizações.

6. Estados do Checklist

- `draft`: edição livre pelo parceiro, pode salvar incrementos.
- `submitted`: checklist finalizado pelo parceiro; bloqueia edição (somente admins podem reabrir com
  auditoria).

7. Visualização Somente Leitura

- Administradores, clientes e especialistas visualizam os checklists/evidências via
  `PartnerEvidencesSection`.
- A seção exibe um botão por combinação `categoria • parceiro`, carregando o checklist
  correspondente.
- O viewer (modal ou página) exibe itens e evidências; ignora mídias inválidas; suporta lightbox.

8. Categorias Disponíveis na Tela do Veículo

- A lista de categorias deve refletir todos os checklists existentes para `(vehicle_id, context)`,
  organizados por parceiro e categoria.
- Deve funcionar em cenários somente `quote` (sem `inspection`) e vice-versa.

9. Consistência e Recuperação

- Recarregar a página não muda o checklist carregado; o parceiro sempre recupera sua versão.
- Salvamentos de outros parceiros não alteram a visão do parceiro atual.

10. Auditoria e Histórico

- Registrar `created_by/updated_by` e trilhas de alterações em checklist, itens, evidências e
  solicitações de peça.
- Opcional: diffs por item entre salvamentos.

## Requisitos Não Funcionais

- Escalabilidade: suportar múltiplos parceiros por veículo/contexto.
- Integridade referencial: chaves e cascatas garantem isolamento e limpeza de dados.
- Desempenho: endpoints de carregamento em <300ms P95 para 200 itens/30 evidências.
- Observabilidade: logs estruturados, métricas e rastreabilidade por `request_id`.
- Segurança: RBAC, checagens por `partner_id`, URLs assinadas para mídia.

## Interações Principais (alto nível)

- Parceiro abre o checklist a partir de uma solicitação (quote) ou inspeção.
- Edita itens, anexa evidências, cria solicitações de peças por item.
- Salva rascunhos; ao final, submete.
- Admin/Cliente/Especialista visualizam evidências consolidadas por parceiro/categoria.

## Regras Específicas

- `item_key` deve ser estável no template; alterações de template precisam de versionamento.
- Evidências sem `media_url` válido são ignoradas na renderização.
- Para visualização, consolidar evidências tanto de itens OK quanto NOK.
- Anomalias podem ser derivadas de itens NOK; exibir contagens por parceiro/categoria.

## Tolerância a Falhas

- Upload de mídia resiliente: reintentar, validar tipo/tamanho, gerar thumbnails.
- Salvamento parcialmente bem-sucedido: retornar itens com erro, sem invalidar checklist inteiro.
- Modo offline (opcional futuro): fila local de alterações.

## Métricas de Sucesso

- 0% de vazamento de dados entre parceiros.
- Tempo de resposta estável em P95.
- Taxa de erro de upload <1%.
