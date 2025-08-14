# 🚀 Plano de Ação do Agente Gemini CLI: Atualização Gradual dos Imports

## Contexto

Este documento detalha o plano de refatoração para a atualização de todos os imports na base de código que ainda referenciam os diretórios `app/components/`, `app/hooks/`, `app/services/` e `app/value-objects/` para os novos Path Aliases (`@/modules/common/components/`, `@/modules/common/hooks/`, `@/modules/common/services/`, `@/modules/common/utils/`, `@/modules/common/domain/`).

## Agente Responsável

Agente Gemini CLI

## Status

EM PROGRESSO

## Data de Início

2025-08-06

## Objetivo

Refatorar os imports dos arquivos que consomem código compartilhado para o novo local em `modules/common/`, garantindo que o código permaneça 100% funcional e utilizando os Path Aliases configurados no `tsconfig.json`.

## Ações Propostas

1.  **Identificar arquivos que ainda importam dos diretórios antigos:**
    *   Realizar buscas por padrões de importação como `from '../components/'`, `from '../../components/'`, `from '../../../components/'`, etc.
    *   Realizar buscas por padrões de importação como `from '../hooks/'`, `from '../../hooks/'`, etc.
    *   Realizar buscas por padrões de importação como `from '../services/'`, `from '../../services/'`, etc.
    *   Realizar buscas por padrões de importação como `from '../utils/'`, `from '../../utils/'`, etc.
    *   Realizar buscas por padrões de importação como `from '../value-objects/'`, `from '../../value-objects/'`, etc.

2.  **Para cada arquivo encontrado:**
    *   Ler o conteúdo do arquivo.
    *   Identificar as linhas de importação que precisam ser alteradas.
    *   Usar a ferramenta `replace` para atualizar o caminho do import para o alias correspondente (ex: `import ... from '@/modules/common/components/...'`).

3.  **Testar cada alteração:**
    *   Após cada conjunto de substituições (ex: todos os imports de um tipo de recurso em um arquivo), verificar se o código ainda compila e funciona corretamente.

4.  **Repetir** até que todos os imports sejam atualizados.

## Próximos Passos Imediatos

Começar a identificar e atualizar os imports, começando pelos componentes.

---

**Última Atualização:** 2025-08-06 10:30:00
