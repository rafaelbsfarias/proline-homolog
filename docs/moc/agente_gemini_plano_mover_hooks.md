# 🚀 Plano de Ação do Agente Gemini CLI: Mover Hooks Comuns

## Contexto

Este documento detalha o plano de refatoração para a movimentação de arquivos de hooks genéricos de `app/hooks/` para `modules/common/hooks/`.

## Agente Responsável

Agente Gemini CLI

## Status

CONCLUÍDO - Parte da refatoração da Fase 1 (Centralização de Lógica Comum).

## Data de Início

2025-08-06

## Objetivo

Centralizar os hooks de React comuns e reutilizáveis da aplicação no diretório `modules/common/hooks/`, seguindo o princípio DRY e a arquitetura modular. Esta etapa envolve apenas a movimentação dos arquivos, sem a atualização dos imports neste momento.

## Ações Propostas

1.  **Mover os seguintes arquivos de `app/hooks/` para `modules/common/hooks/`:**
    *   `useAuthenticatedFetchDebug.ts`
    *   `useAuthenticatedFetch.ts`
    *   `useLoginForm.ts`
    *   `useUserData.ts`
    *   `useVehicleManagement.ts`

2.  **Não apagar a pasta `app/hooks/` neste momento.** Ela será removida em uma etapa posterior, após a atualização dos imports.

## Próximos Passos Imediatos

Executar os comandos para mover os arquivos listados acima.

---

**Última Atualização:** 2025-08-06 10:15:00
