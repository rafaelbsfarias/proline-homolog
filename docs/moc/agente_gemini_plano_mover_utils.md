# 🚀 Plano de Ação do Agente Gemini CLI: Mover Utilitários Comuns

## Contexto

Este documento detalha o plano de refatoração para a movimentação de arquivos de utilitários genéricos de `app/utils/` para `modules/common/utils/`.

## Agente Responsável

Agente Gemini CLI

## Status

CONCLUÍDO

## Data de Início

2025-08-06

## Objetivo

Centralizar os utilitários comuns e reutilizáveis da aplicação no diretório `modules/common/utils/`, seguindo o princípio DRY e a arquitetura modular. Esta etapa envolve apenas a movimentação dos arquivos, sem a atualização dos imports neste momento.

## Ações Propostas

1.  **Mover os seguintes arquivos de `app/utils/` para `modules/common/utils/`:**
    *   `authMiddleware.ts`
    *   `emailConfirmationTokens.ts`
    *   `environmentSecurity.ts`
    *   `formatters.ts`
    *   `getUserRole.ts`
    *   `inputSanitization.ts`
    *   `plateValidation.ts`

2.  **Não apagar a pasta `app/utils/` neste momento.** Ela será removida em uma etapa posterior, após a atualização dos imports.

## Próximos Passos Imediatos

Executar os comandos para mover os arquivos listados acima.

---

**Última Atualização:** 2025-08-06 10:20:00
