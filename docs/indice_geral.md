# Índice Geral da Documentação

## 1. Documentação Técnica

### 1.1 Arquitetura
- [Índice da Arquitetura](architecture/indice.md) - Documentação de arquitetura dos componentes
- [Análise ClientDashboard](architecture/client_dashboard.md) - Análise do painel do cliente

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

## 3. Diretrizes do Projeto

- [Instruções de Desenvolvimento](DEVELOPMENT_INSTRUCTIONS.md) - Princípios e diretrizes do projeto

## 4. Documentação de Funcionalidades

### 4.1 Visão Geral do Cliente (Admin)
- [Documento Principal](admin-client-dashboard.md) - Visão geral do cliente no painel administrativo

## 5. Segurança

- [Auditoria de Autenticação](security/auditoria-autenticacao.md) - Auditoria do sistema de autenticação
- [Auditoria de Módulos](security/auditoria-lib-modulos.md) - Auditoria de segurança em módulos
- [Auditoria de Módulos Comuns](security/auditoria-modulos.md) - Auditoria de módulos comuns
- [Plano de Ação de Segurança de Rotas](security/plano-acao-seguranca-rotas.md) - Plano de ação para segurança de rotas
- [Relatório de Rotas Completas](security/relatorio-rotas-completas.md) - Relatório completo de rotas do sistema

## 6. Análises Técnicas

### 6.1 Análise do Sistema de Timeline de Veículos
- [📚 Índice da Análise](timeline-analysis/README.md) - Análise completa do sistema de timeline
- [📊 Resumo Executivo](timeline-analysis/EXECUTIVE_SUMMARY.md) - Resumo para stakeholders (10 min)
- [🔬 Análise Comparativa](timeline-analysis/SPECIALIST_VS_PARTNER_ANALYSIS.md) - Especialista vs Parceiro (30 min)
- [🚨 Violações de Código](timeline-analysis/DEVELOPMENT_INSTRUCTIONS_VIOLATIONS.md) - Auditoria de conformidade (45 min)
- [🔧 Guia de Diagnóstico](timeline-analysis/TRIGGER_DIAGNOSTIC_GUIDE.md) - Diagnóstico do trigger (15 min)
- [✅ Correção Implementada](timeline-analysis/FIX_PARTNER_CHECKLIST_INIT.md) - Hook usePartnerChecklist

## 7. Bugs e Issues Conhecidos

- [Índice de Bugs](bugs/indice.md) - Índice completo dos bugs documentados
- [Erro ao Aceitar Data Proposta pelo Cliente](bugs/admin_accept_proposed_date_bug.md) - Bug crítico na aceitação de datas propostas
