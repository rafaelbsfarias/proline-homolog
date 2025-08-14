# 🚀 Plano de Ação do Agente Gemini CLI: Mover Serviços Comuns

## Contexto

Este documento detalha o plano de refatoração para a movimentação de arquivos de serviços genéricos de `app/services/` para `modules/common/services/`.

## Agente Responsável

Agente Gemini CLI

## Status

CONCLUÍDO - Parte da refatoração da Fase 1 (Centralização de Lógica Comum).

## Data de Início

2025-08-06

## Objetivo

Centralizar os serviços comuns e reutilizáveis da aplicação no diretório `modules/common/services/`, seguindo o princípio DRY e a arquitetura modular. Esta etapa envolve apenas a movimentação dos arquivos, sem a atualização dos imports neste momento.

## Ações Propostas

1.  **Mover os seguintes arquivos de `app/services/` para `modules/common/services/`:**
    *   `AuthServiceInterface.ts`
    *   `AuthService.ts`
    *   `ErrorHandlerService.ts`
    *   `NavigationService.ts`
    *   `SupabaseAuthService.ts`
    *   `supabaseClient.ts`
    *   `SupabaseEmailService.ts`
    *   `SupabaseService.ts`
    *   `ValidationService.ts`

2.  **Não apagar a pasta `app/services/` neste momento.** Ela será removida em uma etapa posterior, após a atualização dos imports.

## Próximos Passos Imediatos

Executar os comandos para mover os arquivos listados acima.

---

**Última Atualização:** 2025-08-06 10:05:00
