
# Plano de Refatoração: Estrutura Comum - `utils` e `value-objects`

- **Contexto:** Estruturação inicial de `modules/common/` e migração dos diretórios `app/utils` e `app/value-objects`.
- **Agente Responsável:** Gemini
- **Status:** `EM PROGRESSO`
- **Data de Início:** 2025-08-06

---

## Plano de Ação Detalhado

Esta refatoração é a primeira etapa para centralizar o código compartilhado, conforme o plano global. O foco é puramente estrutural, movendo arquivos sem alterar os imports ou a lógica funcional.

### Passos:

1.  **Criar Estrutura de Diretórios em `modules/common/`:**
    *   Criar o diretório `modules/common/utils/`.
    *   Criar o diretório `modules/common/domain/` para abrigar os *value objects*, conforme sugestão do plano de refatoração.

2.  **Mover Arquivos de `app/` para `modules/common/`:**
    *   Mover todo o conteúdo do diretório `app/utils/` para `modules/common/utils/`.
    *   Mover todo o conteúdo do diretório `app/value-objects/` para `modules/common/domain/`.

3.  **Escopo e Limitações:**
    *   **NÃO** serão alterados os imports nos arquivos que consomem estes utilitários e VOs. Esta será uma tarefa subsequente.
    *   **NÃO** serão excluídos os diretórios originais (`app/utils/`, `app/value-objects/`) nesta etapa para garantir que o build e os testes não quebrem.

### Princípios Aplicados:

*   **Arquitetura Modular:** Inicia a centralização de código verdadeiramente compartilhado no módulo `common`.
*   **Coesão:** Agrupa utilitários e modelos de domínio em seus respectivos contextos lógicos, preparando o terreno para uma base de código mais coesa.
