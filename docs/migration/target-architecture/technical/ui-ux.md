# UI/UX e Integração — Checklist/Vistoria por Parceiro

Status: proposta (alvo de implementação)

Este documento descreve a experiência do usuário para parceiros (edição) e para
administradores/clientes/especialistas (visualização), além de integrações entre componentes
existentes.

## Princípios de UX

- Isolamento explícito: a interface deixa claro qual parceiro e categoria estão ativos.
- Persistência previsível: o parceiro sempre recupera seu próprio rascunho ao voltar.
- Ações por item: evidências e solicitação de peças ficam no contexto do item.
- Visualização limpa: separar evidências por parceiro/categoria; evitar overlap visual.

## Páginas e Componentes

- `app/dashboard/partner/checklist/page.tsx`
  - Carrega o checklist do parceiro para `(vehicle_id, contexto, categoria)` usando
    `/api/partner/checklist/load`.
  - Exibe grupos e itens conforme o template (mecânica: exclusivo; demais: genérico).
  - Para cada item: campos de status, comentário, severidade; lista de evidências com
    upload/remover; botão "Solicitar compra de peças".
  - Botões: Salvar rascunho, Submeter.
  - Estados: esqueleto de carregamento, avisos de conflito/erro.

- `modules/partner/components/checklist/PartnerChecklistGroups.tsx`
  - Renderiza os itens por grupos lógicos baseados no template.
  - Integra modal de Solicitação de Peças por item (`usePartRequestModal`, `PartRequestModal`).
  - Em `submitted`, torna os campos somente leitura.

- `modules/vehicles/components/sections/PartnerEvidencesSection.tsx`
  - Renderiza um botão por combinação `categoria • parceiro` (todas as que existirem via
    `/api/checklist/categories`).
  - Ao clicar, chama o viewer com `{ partner_id, category, vehicle_id, context }`.

- `modules/vehicles/components/modals/ChecklistViewer.tsx`
  - Recebe dados de `/api/checklist/view`.
  - Exibe itens e evidências; ignora `media_url` vazio; suporta lightbox.
  - Indica o parceiro e categoria no cabeçalho.

- `modules/vehicles/components/modals/MechanicsChecklistView.tsx`
  - Específico para mecânica (se necessário), mantendo coerência com o viewer genérico.
  - Filtra mídias inválidas e controla índice do lightbox.

- Hooks
  - `modules/vehicles/hooks/useDynamicChecklistLoader.ts`: orquestra carregamento para visualização;
    assegura parâmetros de `partner_id` e `category`.
  - `modules/partner/hooks/usePartnerChecklist.ts`: ciclo de vida de edição (load/save/submit) com
    isolamento de parceiro.

## Fluxos de UI

1. Parceiro abre a página do checklist

- Seleciona veículo/contexto/categoria (ou chega com deep link).
- Página carrega rascunho existente ou inicializa a partir do template.

2. Edição por item

- Marca `OK/NOK/NA`, adiciona comentário/severidade.
- Anexa evidências (upload com progresso) e pode removê-las.
- Pode abrir modal de Solicitação de Peças por item: cria/edita/remove.

3. Salvar e Submeter

- Salvar: permanece em `draft`, confirma sucesso, mantém estado local sincronizado.
- Submeter: confirma irreversibilidade; trava campos; muda para `submitted`.

4. Visualização pública (admin/cliente/especialista)

- Seção PartnerEvidencesSection mostra botões por `categoria • parceiro`.
- Abrir viewer lista itens e evidências em layout de duas colunas (itens à esquerda; evidências à
  direita) ou tabulado no mobile.

## Estados e Variações

- Sem evidências: mostrar vazio elegante (placeholder) por item.
- `media_url` inválido: ocultar card e registrar aviso em console apenas em modo dev.
- Erro de upload: retry, remover parcial e mensagem clara.
- Confirmação ao deletar evidências e solicitações de peças.
- Acessibilidade: foco gerenciável no modal, textos alternativos em mídia.

## Integração com APIs

- Carregamento inicial: `/api/partner/checklist/load` para parceiros; `/api/checklist/categories` e
  `/api/checklist/view` para leitura pública.
- Salvamento: `/api/partner/checklist/save` com payload único (itens, evidências metadata,
  part-requests).
- Upload de mídia: obter URL em `/api/partner/evidences/upload`, depois PUT direto ao storage; por
  fim, salvar `media_url` no `/save`.
- Submissão: `/api/partner/checklist/submit`.

## Desempenho

- Debounce na edição de campos; salvar em lote.
- Carregar evidências sob demanda (lazy) quando abrir o viewer.
- Thumbnails em vez de imagens originais no grid.

## Telemetria

- Eventos: open_checklist, save_checklist, submit_checklist, add_evidence, remove_evidence,
  create_part_request, view_partner_category.
- Correlacionar por `checklist_id`, `partner_id`, `vehicle_id` e `context`.