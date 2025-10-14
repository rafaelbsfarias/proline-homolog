# UI/UX Atual

Componentes e fluxos atuais relevantes para checklist/vistoria por parceiro.

## Edição (parceiro)

- Página do checklist (`app/dashboard/partner/checklist/page.tsx`) com:
  - Itens (OK/NOK/NA), comentários, severidade.
  - Evidências por item (upload/remover), com filtro de URLs vazias no render.
  - Solicitação de peças por item via modal reutilizado do dynamic-checklist.
  - Salvar rascunho e submeter.

## Visualização (somente leitura)

- Seção `PartnerEvidencesSection` com botões `categoria • parceiro`.
- `ChecklistViewer`/`MechanicsChecklistView` exibem itens e mídias; lightbox; ignoram `src` vazio.

## Observações

- Categorias aparecem mesmo em casos vinculados apenas por `quote_id` (sem `inspection_id`).
- O parceiro recupera seu próprio rascunho mesmo após outros parceiros salvarem.
- Em mecânica, ausência de `partner_id` nas tabelas de itens/evidências limita o isolamento completo
  via UI.
