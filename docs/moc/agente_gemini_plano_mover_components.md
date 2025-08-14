# 🚀 Plano de Ação do Agente Gemini CLI: Mover Componentes Comuns

## Contexto

Este documento detalha o plano de refatoração para a movimentação de arquivos de componentes genéricos de `app/components/` para `modules/common/components/`.

## Agente Responsável

Agente Gemini CLI

## Status

CONCLUÍDO

## Data de Início

2025-08-06

## Objetivo

Centralizar os componentes de UI comuns e reutilizáveis da aplicação no diretório `modules/common/components/`, seguindo o princípio DRY e a arquitetura modular. Esta etapa envolve apenas a movimentação dos arquivos, sem a atualização dos imports neste momento.

## Ações Propostas

1.  **Mover os seguintes arquivos de `app/components/` para `modules/common/components/`:**
    *   `ActionButton.css`
    *   `ActionButton.tsx`
    *   `BaseActionButton.tsx`
    *   `BaseDashboard.tsx`
    *   `ChangePasswordModal.css`
    *   `ChangePasswordModal.tsx`
    *   `ClientOnly.tsx`
    *   `FormInput.css`
    *   `FormInput.tsx`
    *   `LoginForm.tsx`
    *   `LoginHeader.tsx`
    *   `LoginOptions.tsx`
    *   `LoginPageContainer.tsx`
    *   `Modal.css`
    *   `Modal.tsx`
    *   `SettingsButton.css`
    *   `SettingsButton.tsx`
    *   `ToastContainer.module.css`
    *   `Toast.module.css`
    *   `ToastProvider.tsx`
    *   `Toast.tsx`
    *   `VehicleCounter.tsx`
    *   `ClientSearch.tsx`
    *   `ClientVehicleRegistrationModal.tsx`
    *   `VehicleDetailsModal.tsx`
    *   `VehicleRegistrationModal.tsx`
    *   `EmailTemplateTest.tsx`
    *   `EdgeFunctionEmailTest.tsx`

2.  **Não apagar a pasta `app/components/` neste momento.** Ela será removida em uma etapa posterior, após a atualização dos imports.

## Próximos Passos Imediatos

Executar os comandos para mover os arquivos listados acima.

---

**Última Atualização:** 2025-08-06 10:10:00
