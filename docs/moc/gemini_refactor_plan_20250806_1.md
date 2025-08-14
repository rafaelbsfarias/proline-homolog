# Plano de Ação de Refatoração - Gemini

**Contexto:** Fase 1 - Estruturar `modules/common/` e Mover Value Objects

**Agente Responsável:** Gemini

**Status:** `EM PROGRESSO`

**Data de Início:** 2025-08-06

## Plano de Ação Detalhado

O objetivo desta tarefa é iniciar a centralização do código compartilhado, focando exclusivamente nos **Value Objects**. Esta é uma tarefa de baixo risco que estabelece o padrão para movimentações futuras.

### Passos:

1.  **Criar a Estrutura de Destino:**
    *   Criar o diretório `modules/common/domain/` para abrigar os Value Objects, seguindo uma abordagem de Domain-Driven Design.

2.  **Mover os Arquivos:**
    *   Mover os seguintes arquivos de `app/value-objects/` para `modules/common/domain/`:
        *   `Email.ts`
        *   `Password.ts`
        *   `UserRole.ts`
        *   `index.ts`

3.  **Atualizar Imports (Próxima Etapa):**
    *   Neste momento, **não** irei alterar os imports na aplicação. Apenas a movimentação dos arquivos será realizada para criar um checkpoint seguro.
    *   A atualização dos imports será feita em uma tarefa subsequente, utilizando os aliases de caminho (`@/modules/common/...`).

4.  **Verificação:**
    *   Confirmar que os arquivos foram movidos corretamente para a nova estrutura.

### Princípios Aplicados:

*   **Arquitetura Modular:** Inicia a consolidação da lógica de domínio compartilhada em um local central e desacoplado.
*   **Coesão:** Agrupa os Value Objects, que possuem alta coesão, em um mesmo diretório de domínio.
*   **Código Limpo:** Prepara o terreno para a remoção de pastas duplicadas em `app/`, tornando a estrutura do projeto mais clara.
