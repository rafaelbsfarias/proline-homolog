# 🤝 Contexto de Refatoração de Código Colaborativa

## Propósito

Este documento serve como um **Mecanismo de Orquestração de Contexto (MOC)** para gerenciar a refatoração colaborativa do código-fonte do projeto. Ele garante que múltiplos agentes possam trabalhar de forma eficiente e sem conflitos em diferentes partes da base de código.

## Escopo da Refatoração

A refatoração focará em **contextos granulares** dentro dos diretórios `app/` e `modules/`. Exemplos de contextos granulares incluem:

*   Um componente específico (ex: `modules/admin/components/UserList.tsx`).
*   Um grupo de APIs relacionadas a uma funcionalidade (ex: `app/api/admin/users-management/`).
*   Um formulário completo (frontend + backend) (ex: `Formulário de Cadastro Público`).

O objetivo é conquistar maior aderência aos `docs/DEVELOPMENT_INSTRUCTIONS.md`, melhorando a manutenibilidade, modularidade e a qualidade geral do código (DRY, SOLID, Object Calisthenics, Código Limpo).

## Processo de Refatoração Colaborativa

1.  **Análise Preliminar Individual:** Cada agente deve realizar uma análise geral do código e documentar suas observações e propostas de refatoração estrutural em um arquivo Markdown separado dentro de `docs/moc/analises-preliminares/` (ex: `docs/moc/analises-preliminares/analise_agente_[nome_do_agente].md`).
2.  **Discussão e Consolidação:** Após as análises individuais, todos os agentes devem discutir as propostas, consolidar as ideias e definir um plano de refatoração global.
3.  **Divisão de Tarefas Granulares:** O plano global será dividido em tarefas granulares, cada uma correspondendo a um "Contexto de Refatoração" específico.
4.  **Reivindicação e Execução:** Cada agente reivindicará um contexto específico para trabalhar, documentando seu plano de ação detalhado e o status do trabalho em seu próprio arquivo Markdown (ex: `docs/moc/agente_[nome_do_agente]_plano_[contexto].md`).

## Instruções para Agentes

*   **Consulte sempre os arquivos de análise preliminar** para entender a visão geral dos problemas.
*   **Crie seu próprio arquivo de plano de ação** para o contexto que você reivindicar.
*   **As mudanças serão EXCLUSIVAMENTE estruturais:** Foco em imports, organização de arquivos e pastas, sem alterar a lógica funcional do código.
*   **NÃO MODIFIQUE** um contexto que esteja `EM PROGRESSO` por outro agente.
*   Comunique-se e colabore para garantir um fluxo de trabalho suave.

---

**Última Atualização:** 2025-08-06