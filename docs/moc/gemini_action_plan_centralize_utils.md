# Plano de Ação do Agente: Gemini - Centralização de Utilitários

**Contexto:** Estruturar `modules/common/` e mover código compartilhado - Foco em Utilitários.

**Agente Responsável:** Gemini

**Status:** `EM PROGRESSO`

**Data de Início:** 2025-08-06

---

## Plano de Ação Detalhado

Esta tarefa foca exclusivamente na **Fase 1** do plano de refatoração: a centralização do código compartilhado, começando pelos arquivos de utilitários por serem de baixo acoplamento.

### Atividades a Serem Executadas:

1.  **Criar a Estrutura de Destino:**
    - Será criado o diretório `modules/common/utils/` para abrigar os arquivos de utilitários compartilhados.

2.  **Mover os Arquivos de Utilitários:**
    - Os seguintes arquivos serão **copiados** da pasta `app/utils/` para a nova pasta `modules/common/utils/`:
        - `authMiddleware.ts`
        - `environmentSecurity.ts`
        - `formatters.ts`
        - `getUserRole.ts`
        - `inputSanitization.ts`

### Delimitação do Escopo (O que NÃO será feito nesta etapa):

- **Não serão alterados os imports** que apontam para `app/utils/`. A atualização dos caminhos de importação para usar o novo alias `@/modules/common/utils/` será realizada em uma tarefa subsequente, conforme o plano de refatoração global.
- **Não será deletada a pasta original `app/utils/`**. Ela será mantida para garantir que a aplicação continue funcionando sem interrupções até que todos os imports sejam atualizados.

Este approach garante que a tarefa seja atômica, de baixo risco e um passo incremental claro na direção da arquitetura desejada.
