# Parceiros — Checklist/Vistoria (Especificação)

> ⚠️ **ATENÇÃO - DOCUMENTAÇÃO DE ESTADO ALVO**
>
> Esta documentação descreve a **arquitetura IDEAL/ALVO** (target state) do sistema. A implementação
> atual está em **transição** e pode divergir desta especificação.
>
> **Para entender o estado atual:**
>
> - 📖 `/docs/DOCUMENTATION_REALITY_GAP_ANALYSIS.md` - Análise completa de gaps
> - 🔧 `/docs/FIX_MECHANICS_CHECKLIST_CONSTRAINT.md` - Correções recentes
> - 🗄️ `supabase/migrations/` - Schema real do banco de dados
>
> **Principais divergências conhecidas:**
>
> - Tabelas: `mechanics_checklist` (atual) vs. `partner_checklists` (alvo)
> - Contexto: campos separados `inspection_id`/`quote_id` (atual) vs. `(context_type, context_id)`
>   (alvo)
> - APIs: endpoints legados vs. endpoints documentados aqui

Este diretório consolida a documentação de comportamento esperado (ideal) para o fluxo de
checklist/vistoria por parceiro, incluindo modelagem de dados, APIs, fluxos, segurança, UI/UX e
plano de migração. O objetivo é garantir isolamento completo por parceiro, suporte a contexto (por
orçamento `quote_id` ou inspeção `inspection_id`), checklist exclusivo para mecânica e checklist
genérico para demais categorias, além de visualização somente leitura para
administradores/clientes/especialistas via
`modules/vehicles/components/sections/PartnerEvidencesSection.tsx`.

Conteúdo:

- 1.  Visão e requisitos funcionais: `functional-spec.md`
- 2.  Modelagem de dados (ERD/DDL): `data-model.md`
- 3.  Especificação de APIs: `api-spec.md`
- 4.  UI/UX e integração (componentes/rotas): `ui-ux.md`
- 5.  Segurança e permissões: `security-permissions.md`
- 6.  Fluxos e diagramas de sequência: `flows.md`
- 7.  Plano de migração: `migration-plan.md`

Público-alvo:

- Engenharia (backend/frontend), Produto, QA.

Escopo desta documentação:

- Ignora o comportamento atual e descreve o comportamento esperado (ideal) a ser implementado.
