# Especificação Funcional — Checklist/Vistoria por Parceiro

Status: proposta (alvo de implementação)

Este documento define o comportamento ideal para checklists/vistorias isolados por parceiro (UUID), com
contexto por orçamento (`quote_id`) ou inspeção (`inspection_id`), checklist exclusivo para Mecânica
e genérico para demais categorias, e compartilhamento somente leitura para
administradores/clientes/especialistas via `PartnerEvidencesSection.tsx`.

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
- Persistência e carregamento sempre respeitam `(partner_id, vehicle_id, context_type, context_id)`.

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
  `PartnerEvidencesSection.tsx`.
- A seção exibe um botão por combinação `categoria • parceiro`, carregando o checklist
  correspondente ao clicar.
- Visualização mostra itens e evidências; ignora `media_url` vazio; suporta lightbox.

## Requisitos Não-Funcionais

1. Segurança

- Isolamento por `partner_id` garantido em todas as camadas (front, back, db).
- Autenticação e autorização rigorosas (RBAC).
- Validação de entrada e saída (Zod schemas).
- Logs estruturados de acesso e operações.

2. Performance

- Carregamento inicial < 2s (95% dos casos).
- Salvamento em lote < 1s (95% dos casos).
- Upload de mídia com progresso e retry.
- Caching de templates e dados estáticos.

3. Confiabilidade

- Transações ACID para operações críticas.
- Tratamento de erros e rollback automático.
- Validação de integridade referencial.
- Backup e recuperação de dados.

4. Manutenibilidade

- Código modular seguindo DDD e SOLID.
- Testes unitários (>80% cobertura).
- Documentação técnica atualizada.
- Versionamento semântico de APIs.

5. Compatibilidade

- Backward compatibility com versões anteriores.
- Mecanismo de migração de dados.
- Feature flags para rollouts graduais.
- Fallback para sistemas legados quando necessário.

## Arquitetura de Dados

1. Modelo Conceitual

- Partners (`partners`): catálogo de parceiros.
- Vehicles (`vehicles`): veículos dos clientes.
- Partner Checklists (`partner_checklists`): checklist raiz por parceiro/veículo/contexto/categoria.
- Items (`partner_checklist_items`): respostas por item (`item_key`).
- Evidences (`partner_checklist_evidences`): mídias por item e checklist.
- Part Requests (`partner_part_requests`): solicitações de compra por item.
- Templates (`checklist_templates`, `checklist_template_items`): versões por categoria.
- Anomalies (`partner_anomalies`): derivadas de itens NOK (opcional/view materializada).

2. Princípios

- Isolamento por `partner_id` garantido por chaves únicas e relacionamentos.
- Contexto normalizado como `(context_type, context_id)` para suportar `quote` e `inspection`.
- Versionamento de templates por categoria para garantir consistência de `item_key`.
- Itens e evidências vinculados ao checklist (relação 1:N), com `item_key` como âncora semântica.
- Solicitações de peças por item (relação 1:N com checklist + `item_key`).

## APIs

1. Endpoints Principais

- `POST /api/partner/checklist/load` - Carrega checklist do parceiro para `(vehicle_id, contexto, categoria)`
- `POST /api/partner/checklist/save` - Salva rascunho de itens/evidências/solicitações
- `PUT /api/partner/checklist/submit` - Submete checklist (trava edição)
- `GET /api/checklist/categories` - Lista combinações `categoria • parceiro` disponíveis
- `GET /api/checklist/view` - Retorna checklist/itens/evidências para visualização

2. Endpoints Secundários

- `POST /api/partner/evidences/upload` - Solicita URL assinada para upload de evidência
- `DELETE /api/partner/evidences/:id` - Remove evidência do checklist
- `POST /api/partner/part-requests` - Cria solicitação de peças por item
- `PUT /api/partner/part-requests/:id` - Atualiza solicitação de peças
- `DELETE /api/partner/part-requests/:id` - Remove solicitação de peças
- `GET /api/partner/checklist/load-anomalies` - Lista anomalias derivadas de itens NOK
- `POST /api/partner/checklist/save-anomalies` - Salva anomalias do parceiro

## Componentes Frontend

1. Páginas

- `app/dashboard/partner/checklist/page.tsx` - Página de checklist do parceiro (edição de rascunho/submissão)
- `modules/vehicles/components/sections/PartnerEvidencesSection.tsx` - Seção de visualização somente leitura

2. Componentes

- `modules/partner/components/checklist/PartnerChecklistGroups.tsx` - Renderização de grupos/itens do checklist
- `modules/partner/components/checklist/PartnerChecklistItem.tsx` - Renderização de item individual
- `modules/partner/components/evidence/EvidenceUploader.tsx` - Componente de upload de evidências
- `modules/partner/components/part-request/PartRequestModal.tsx` - Modal de solicitação de peças
- `modules/vehicles/components/modals/ChecklistViewer.tsx` - Viewer de itens/evidências consolidado
- `modules/vehicles/components/modals/MechanicsChecklistView.tsx` - Viewer focado na mecânica

3. Hooks

- `modules/partner/hooks/usePartnerChecklist.ts` - Hook principal para gerenciar checklist do parceiro
- `modules/partner/hooks/useChecklistTemplate.ts` - Hook para carregar templates de checklist
- `modules/partner/hooks/useEvidenceUpload.ts` - Hook para upload de evidências
- `modules/partner/hooks/usePartRequest.ts` - Hook para gerenciar solicitações de peças
- `modules/vehicles/hooks/usePartnerChecklistViewer.ts` - Hook para visualização somente leitura
- `modules/vehicles/hooks/useDynamicChecklistLoader.ts` - Hook para carregar checklists dinamicamente

## Fluxos de Negócio

1. Checklist do Parceiro

```
┌─────────────────────────────────────────────────┐
│              Parceiro acessa checklist         │
└─────────────────────────────────────────────────┘
                    │
           POST /api/partner/checklist/load
                    │
        ┌─────────────────────────────────────┐
        │  Sistema carrega checklist do    │
        │  parceiro para (veículo, contexto)  │
        └─────────────────────────────────────┘
                    │
     ┌────────────────────────────────────────────┐
     │ Checklist carregado com:                │
     │ - Dados do veículo                     │
     │ - Template da categoria do parceiro    │
     │ - Itens existentes (se houver)         │
     │ - Evidências existentes (se houver)    │
     │ - Solicitações de peças (se houver)    │
     └────────────────────────────────────────────┘
                    │
         Edição dos itens/checklist
                    │
           POST /api/partner/checklist/save
                    │
        ┌─────────────────────────────────────┐
        │  Sistema salva rascunho do       │
        │  checklist do parceiro            │
        └─────────────────────────────────────┘
                    │
        PUT /api/partner/checklist/submit
                    │
        ┌─────────────────────────────────────┐
        │  Sistema submete checklist        │
        │  (bloqueia edição do parceiro)     │
        └─────────────────────────────────────┘
```

2. Visualização de Checklist

```
┌─────────────────────────────────────────────────┐
│         Admin/Cliente/Especialista          │
│         acessa PartnerEvidencesSection      │
└─────────────────────────────────────────────────┘
                    │
           GET /api/checklist/categories
                    │
        ┌─────────────────────────────────────┐
        │  Sistema retorna combinações      │
        │  (categoria • parceiro)           │
        └─────────────────────────────────────┘
                    │
         Clique em botão de categoria
                    │
            GET /api/checklist/view
                    │
        ┌─────────────────────────────────────┐
        │  Sistema retorna checklist        │
        │  completo para visualização       │
        └─────────────────────────────────────┘
                    │
     ┌────────────────────────────────────────────┐
     │ Checklist exibido com:                  │
     │ - Itens e status                       │
     │ - Evidências (mídia)                   │
     │ - Solicitações de peças                │
     │ - Lightbox para visualização           │
     └────────────────────────────────────────────┘
```

## Casos de Uso

1. Parceiro Mecânica

- Recebe solicitação de orçamento para veículo
- Acessa checklist via `/dashboard/partner/checklist?quoteId=...`
- Preenche checklist com base no template mecânico
- Adiciona evidências (fotos) para itens NOK
- Cria solicitações de peças por item
- Salva rascunho e submete checklist

2. Parceiro Funilaria/Pintura

- Recebe solicitação de orçamento para veículo
- Acessa checklist via `/dashboard/partner/dynamic-checklist?quoteId=...`
- Preenche checklist com base no template genérico
- Adiciona evidências (fotos) para itens NOK
- Cria solicitações de peças por item
- Salva rascunho e submete checklist

3. Admin Visualizando Checklist

- Acessa página de detalhes do veículo
- Vê seção `PartnerEvidencesSection`
- Clica em botão "Mecânica • Oficina XYZ"
- Visualiza checklist completo do parceiro
- Navega pelas evidências em lightbox

4. Cliente Visualizando Checklist

- Acessa página de detalhes do veículo
- Vê seção `PartnerEvidencesSection`
- Clica em botão "Funilaria • Loja ABC"
- Visualiza checklist completo do parceiro
- Navega pelas evidências em lightbox

## Regras de Negócio

1. Isolamento por Parceiro

- Cada checklist é único por `(partner_id, vehicle_id, context_type, context_id, category)`
- Parceiros só podem acessar seus próprios checklists
- Admins podem acessar checklists de todos os parceiros
- Clientes/especialistas só podem visualizar (somente leitura)

2. Estados do Checklist

- `draft`: pode ser editado/salvo indefinidamente
- `submitted`: bloqueado para edição (exceto admins com permissão)
- Transição: `draft` → `submitted` (irreversível sem intervenção admin)

3. Evidências

- URLs vazios são ignorados na visualização
- Upload retorna URL pública/assinada para `media_url`
- Evidências podem ser removidas antes da submissão
- Após submissão, evidências ficam permanentemente vinculadas

4. Solicitações de Peças

- Criadas por item (vinculadas a `item_key`)
- Podem ser editadas/removidas antes da submissão
- Após submissão, só admins podem alterar status
- Status: `draft` → `sent` → `approved/rejected` → `ordered` → `received`

5. Templates

- Cada categoria tem seu próprio template
- Templates são versionados (ex.: `mechanic@v1`)
- `item_key` deve ser estável entre versões
- Novos templates devem manter compatibilidade com dados existentes

## Considerações Técnicas

1. Banco de Dados

- Tabelas normalizadas com chaves únicas por `(partner_id, vehicle_id, context, category)`
- Índices por colunas de busca frequente
- RLS policies para isolamento por parceiro
- Triggers para `updated_at` automático

2. APIs

- Autenticação via Bearer JWT com `partner_id` no token
- Validação rigorosa com Zod schemas
- Tratamento de erros padronizado
- Paginação para endpoints que retornam listas

3. Frontend

- Componentes reutilizáveis seguindo Composition Pattern
- Hooks para lógica de negócio complexa
- Gerenciamento de estado centralizado
- Feedback visual para operações assíncronas

4. Segurança

- Validação de ownership em todas as operações
- Rate limiting para endpoints sensíveis
- Logging estruturado para auditoria
- Proteção contra ataques comuns (XSS, CSRF, etc.)

## Próximos Passos

1. Implementação

- Criar tabelas no banco de dados conforme modelo
- Desenvolver APIs RESTful seguindo especificação
- Construir componentes frontend reutilizáveis
- Implementar testes unitários e de integração

2. Testes

- Testar isolamento por parceiro
- Validar fluxos completos (criação → edição → submissão)
- Verificar integridade de dados
- Testar casos de erro e recuperação

3. Documentação

- Completar documentação técnica dos componentes
- Criar guias de uso para desenvolvedores
- Documentar processo de migração de legado
- Atualizar diagramas e fluxos

4. Implantação

- Configurar ambiente de staging para testes
- Implementar feature flags para rollout gradual
- Monitorar métricas de performance e erros
- Preparar plano de rollback se necessário