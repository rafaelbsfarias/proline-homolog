# Índice Geral da Documentação

## 1. Documentação Técnica

### 1.1 Arquitetura
- [Índice da Arquitetura](architecture/indice.md) - Documentação de arquitetura dos componentes
- [Análise ClientDashboard](../architecture/client_dashboard.md) - Análise do painel do cliente

### 1.2 Desenvolvimento
- [Índice de Desenvolvimento](development/indice.md) - Documentação do processo de desenvolvimento
- [Resumo Executivo](development/resumo_executivo.md) - Visão geral do processo de desenvolvimento
- [Componentes do Cliente](development/componentes_cliente.md) - Detalhamento da arquitetura do cliente
- [Diferenças na Implementação](development/diferencas_implementacao.md) - Comparação entre documentação e implementação
- [Relação Fluxos x Componentes](development/fluxos_componentes.md) - Mapeamento entre fluxos e componentes

## 2. Fluxos de Negócio

### 2.1 Fluxos de Serviço
- [Fluxo de Aprovação](business-flows/fluxo_aprovacao.md) - Fluxo de aprovação de coleta
- [Fluxo de Mudança de Data](business-flows/fluxo_mudanca_data.md) - Fluxo de mudança de data
- [Fluxo de Rejeição](business-flows/fluxo_rejeicao.md) - Fluxo de rejeição de coleta
- [Fluxo Orçamentário e Execução](business-flows/fluxo_orcamentario.md) - Fluxo completo de orçamento e execução de serviços

### 2.2 Fluxos de Status
- [Fluxo de Status dos Veículos](business-flows/fluxo_status_veiculos.md) - Fluxos de status dos veículos
- [Diagramas de Sequência](business-flows/diagramas_sequencia.md) - Diagramas dos fluxos de status
- [Resumo dos Fluxos](business-flows/resumo_fluxos_status.md) - Resumo dos fluxos de status

## 2.3 Documentação de Componentes
- [Input](components/Input.md) - Documentação do componente de Input reutilizável.
- [Modal](components/Modal.md) - Documentação do componente de Modal reutilizável.
- [Botões](components/Buttons.md) - Documentação dos componentes de botão (SolidButton e OutlineButton).

## 3. Refatoração e Dívida Técnica

### 3.1 Partner Overview Refactoring 🔥 NOVO
- [📖 Índice da Refatoração](refactoring/README.md) - Portal principal da refatoração
- [⚠️ **Avisos Importantes**](refactoring/IMPORTANT_WARNINGS.md) - **LEIA PRIMEIRO** - Padrões obrigatórios e anti-patterns
- [📊 Resumo Executivo](refactoring/EXECUTIVE_SUMMARY.md) - Overview para decisão rápida (5 min)
- [📋 Plano Completo](refactoring/PARTNER_OVERVIEW_REFACTORING_PLAN.md) - Análise detalhada e arquitetura DDD (20 min)
- [💻 Exemplos de Implementação](refactoring/PARTNER_OVERVIEW_IMPLEMENTATION_EXAMPLES.md) - Código pronto para usar
- [⚡ Quick Start](refactoring/QUICK_START_REFACTORING.md) - Guia prático passo a passo
- [📚 Índice Completo](refactoring/INDEX.md) - Navegação, FAQ e glossário

**Status:** ⏳ Aguardando aprovação  
**Prioridade:** 🔴 ALTA - Arquivo com 899 linhas violando múltiplos princípios  
**Impacto:** -80% no tamanho do arquivo, +500% em testabilidade  
**Abordagem:** ✅ Incremental (8-12h) recomendada | ⏳ DDD completo (15-22h) opcional

## 4. Diretrizes do Projeto

- [Instruções de Desenvolvimento](DEVELOPMENT_INSTRUCTIONS.md) - Princípios e diretrizes do projeto

## 5. Documentação de Funcionalidades

### 5.1 Visão Geral do Cliente (Admin)
- [Documento Principal](admin-client-dashboard.md) - Visão geral do cliente no painel administrativo

## 6. Segurança

- [Auditoria de Autenticação](security/auditoria-autenticacao.md) - Auditoria do sistema de autenticação
- [Auditoria de Módulos](security/auditoria-lib-modulos.md) - Auditoria de segurança em módulos
- [Auditoria de Módulos Comuns](security/auditoria-modulos.md) - Auditoria de módulos comuns
- [Plano de Ação de Segurança de Rotas](security/plano-acao-seguranca-rotas.md) - Plano de ação para segurança de rotas
- [Relatório de Rotas Completas](security/relatorio-rotas-completas.md) - Relatório completo de rotas do sistema

## 7. Bugs e Issues Conhecidos

- [Índice de Bugs](bugs/indice.md) - Índice completo dos bugs documentados
- [Erro ao Aceitar Data Proposta pelo Cliente](bugs/admin_accept_proposed_date_bug.md) - Bug crítico na aceitação de datas propostas

## 8. Diagnósticos e Análises Críticas

### 7.1 Diagnóstico - Finalização de Checklist (CRÍTICO)
- [📋 README](diagnostic-finalize-checklist/README.md) - Visão geral do problema e hipóteses
- [🔬 Análise Técnica](diagnostic-finalize-checklist/TECHNICAL_ANALYSIS.md) - Análise profunda com queries SQL e cenários
- [✅ Solução](diagnostic-finalize-checklist/SOLUTION.md) - Solução completa com código de implementação
- [📊 Resumo Executivo](diagnostic-finalize-checklist/EXECUTIVE_SUMMARY.md) - Resumo para stakeholders

**Status**: 🔴 CRÍTICO - Afeta produção. Especialistas bloqueados.  
**Causa Raiz**: Endpoint `start-analysis` não cria registro na tabela `inspections`.  
**Impacto**: Erro 404 em todas as tentativas de finalização de checklist.

## 8. Refatorações e Melhorias

### 8.1 Refatoração do Contexto do Parceiro (2025-10-09)
- [📖 README](partner-refactoring/README.md) - Visão geral do projeto de refatoração
- [🔍 Análise de Inconsistências](partner-refactoring/01-ANALYSIS.md) - Análise completa de problemas encontrados
- [🗺️ Plano de Refatoração](partner-refactoring/02-REFACTORING-PLAN.md) - Plano detalhado em 4 fases

**Status**: 🟡 Em Planejamento  
**Objetivo**: Aplicar princípios DRY, SOLID e Arquitetura Modular ao contexto do parceiro  
**Problemas Identificados**:
- 19 endpoints com padrões inconsistentes
- 6 endpoints sem autenticação adequada
- Código duplicado em múltiplos arquivos
- Falta de Domain Layer consistente
- Funções com 100-344 linhas

**Fases**:
1. 🔴 P0 - Correções Críticas de Segurança (2-3h)
2. 🔴 P1 - Padronização de Infraestrutura (4-6h)
3. 🔴 P2 - Refatoração de Arquitetura (10-15h)
4. 🔴 P3 - Melhorias de Qualidade (6-8h)
