# 🚀 Plano de Ação do Agente Gemini CLI: Mover Componentes de Veículos para `modules/admin/`

## Contexto

Este documento detalha o plano de refatoração para a movimentação de componentes e utilitários relacionados a veículos que foram erroneamente colocados em `modules/common/` para o módulo `modules/admin/`. Esta ação visa melhorar a coesão e aderência aos princípios de arquitetura modular.

## Agente Responsável

Agente Gemini CLI

## Status

EM PROGRESSO

## Data de Início

2025-08-06

## Objetivo

Centralizar a lógica e os componentes de gerenciamento de veículos dentro do módulo `admin`, onde eles pertencem mais naturalmente, e remover os arquivos duplicados ou mal classificados de `modules/common/`.

## Ações Propostas

1.  **Criar os seguintes diretórios dentro de `modules/admin/` (se não existirem):**
    *   `modules/admin/components/vehicles/`
    *   `modules/admin/hooks/vehicles/`
    *   `modules/admin/utils/`

2.  **Mover os seguintes arquivos de `modules/common/components/` para `modules/admin/components/vehicles/`:**
    *   `CadastrarVeiculoModal.module.css`
    *   `CadastrarVeiculoModal.tsx`
    *   `ClientSearch.tsx`
    *   `ClientVehicleRegistrationModal.tsx`
    *   `VehicleCounter.css`
    *   `VehicleCounter.tsx`
    *   `VehicleDetailsModal.tsx`
    *   `VehicleRegistrationModal.css`
    *   `VehicleRegistrationModal.tsx`

3.  **Mover os seguintes arquivos de `modules/common/hooks/` para `modules/admin/hooks/vehicles/`:**
    *   `useVehicleManagement.ts`

4.  **Mover os seguintes arquivos de `modules/common/utils/` para `modules/admin/utils/`:**
    *   `plateValidation.ts`

5.  **Mover os seguintes arquivos de teste/debug para `dev-tools/` ou remover (se não forem mais necessários):**
    *   `modules/common/components/EdgeFunctionEmailTest.tsx`
    *   `modules/common/components/EmailTemplateTest.tsx`
    *   `modules/common/components/SignupPageSimple.tsx`
    *   `modules/common/hooks/useAuthenticatedFetch.test.ts`
    *   `modules/common/hooks/useAuthenticatedFetchDebug.ts`

6.  **Atualizar todos os imports** na base de código para refletir os novos caminhos, utilizando os Path Aliases (`@/modules/admin/...`).

7.  **Remover os arquivos originais** de `modules/common/` após a movimentação e atualização dos imports.

## Próximos Passos Imediatos

Executar os comandos para criar os diretórios e mover os arquivos listados acima.
