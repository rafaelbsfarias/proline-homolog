# 💰 Resumo Financeiro do Parceiro

**Data**: 16/10/2025
**Versão**: 1.0.0
**Status**: 📋 Modelagem - Planejamento Inicial

---

## 🎯 Visão Geral

### Objetivo
Criar uma tela de resumo financeiro simplificada para parceiros, permitindo visualizar métricas essenciais de performance financeira, acompanhar receitas básicas e ter uma visão geral dos valores projetados.

### Justificativa
Os parceiros atualmente não possuem visibilidade clara sobre sua performance financeira básica na plataforma. A ausência de um dashboard financeiro simples limita a capacidade de acompanhamento de resultados essenciais.

### Benefícios Esperados
- **Transparência**: Visibilidade das métricas financeiras essenciais
- **Acompanhamento**: Dados básicos para acompanhar resultados
- **Planejamento**: Base para projeções simples de receita
- **Simplicidade**: Interface limpa focada no essencial

---

## 📊 Requisitos Funcionais

### RF001 - Dashboard Financeiro Básico
**Como** parceiro ou administrador,
**Quero** visualizar métricas financeiras essenciais,
**Para** ter uma visão geral da minha performance financeira básica.

**Critérios de Aceitação:**
- Exibir valor total faturado no período selecionado
- Mostrar total de orçamentos realizados
- Apresentar valor médio dos orçamentos
- Calcular valor projetado (pendentes + em execução)

### RF002 - Controle de Peças
**Como** parceiro,
**Quero** visualizar informações sobre peças solicitadas,
**Para** acompanhar custos com materiais.

**Critérios de Aceitação:**
- Número total de peças solicitadas no período
- Valor total gasto em peças
- Relacionamento com orçamentos realizados

### RF003 - Filtros de Período
**Como** parceiro,
**Quero** filtrar dados por períodos customizados,
**Para** analisar diferentes intervalos de tempo.

**Critérios de Aceitação:**
- Seleção de data inicial e final
- Validação de períodos razoáveis (máximo 1 ano)
- Atualização automática dos dados

### RF004 - Acesso Administrativo
**Como** administrador,
**Quero** acessar dados financeiros básicos de todos os parceiros,
**Para** ter visão geral da performance da rede.

**Critérios de Aceitação:**
- Visão consolidada simplificada
- Filtros por período
- Acesso restrito a administradores

---

## 🏗️ Arquitetura e Design

### Princípios Aplicados

#### SOLID
- **Single Responsibility**: Cada componente tem responsabilidade única
- **Open/Closed**: Componentes extensíveis sem modificação
- **Liskov Substitution**: Interfaces consistentes
- **Interface Segregation**: Interfaces específicas por contexto
- **Dependency Inversion**: Dependências de abstrações

#### DRY (Don't Repeat Yourself)
- Componentes reutilizáveis para métricas
- Hooks compartilhados para lógica de negócio
- Utilitários comuns para cálculos financeiros

#### KISS (Keep It Simple, Stupid)
- Interfaces intuitivas e limpas
- Lógica de negócio simplificada
- Componentes focados em uma função

#### Arquitetura Modular
- Separação clara entre domínio, aplicação e infraestrutura
- Módulos independentes e coesos
- Interfaces bem definidas entre camadas

### Estrutura Arquitetural

```
modules/partner/
├── domain/
│   ├── entities/           # Entidades de negócio (FinancialSummary, etc.)
│   ├── services/           # Regras de negócio puras
│   ├── value-objects/      # Objetos de valor (Money, Percentage, etc.)
│   └── repositories/       # Interfaces de repositório
├── application/
│   ├── services/           # Casos de uso e serviços de aplicação
│   └── dto/               # Objetos de transferência de dados
├── infrastructure/
│   ├── repositories/       # Implementações de repositório
│   ├── api/               # Camada de API externa
│   └── mappers/           # Mapeamento entre camadas
├── interfaces/
│   ├── components/         # Componentes de UI
│   ├── hooks/             # Hooks React
│   └── types/             # Tipos TypeScript
└── utils/                 # Utilitários específicos
```

### Padrão de Componentes

#### Composition Pattern
Todos os componentes seguem o padrão de composição, onde:
- Páginas principais atuam como containers
- Componentes filhos gerenciam partes específicas do fluxo
- Props são passadas de forma controlada
- Estado é gerenciado no nível apropriado

### Design System
- Utilizar componentes existentes do design system
- Manter consistência visual com o resto da aplicação
- Seguir padrões de acessibilidade
- Componentes responsivos e simples

---

## 🔧 APIs e Endpoints

### GET /api/partner/financial-summary
**Propósito**: Obter resumo financeiro consolidado do parceiro

**Parâmetros de Query:**
- `period`: `last_month` | `last_3_months` | `last_year` | `custom`
- `start_date`: `YYYY-MM-DD` (para período custom)
- `end_date`: `YYYY-MM-DD` (para período custom)

**Resposta:**
```typescript
{
  "period": {
    "start_date": "2025-09-01",
    "end_date": "2025-09-30",
    "label": "Setembro 2025"
  },
  "metrics": {
    "total_revenue": {
      "amount": 45250.00,
      "formatted": "R$ 45.250,00"
    },
    "total_quotes": 127,
    "average_quote_value": {
      "amount": 356.30,
      "formatted": "R$ 356,30"
    },
    "parts": {
      "total_parts_requested": 89,
      "total_parts_value": {
        "amount": 12800.00,
        "formatted": "R$ 12.800,00"
      }
    },
    "projected_value": {
      "pending_approval": {
        "amount": 15200.00,
        "formatted": "R$ 15.200,00"
      },
      "in_execution": {
        "amount": 8750.00,
        "formatted": "R$ 8.750,00"
      },
      "total_projected": {
        "amount": 23950.00,
        "formatted": "R$ 23.950,00"
      }
    }
  }
}
```

### GET /api/admin/partners/financial-summary
**Propósito**: Obter visão consolidada financeira de todos os parceiros (apenas admin)

**Parâmetros de Query:**
- `period`: `last_month` | `last_3_months` | `last_year` | `custom`
- `partner_id`: `uuid` (opcional - filtra por parceiro específico)
- `region`: `string` (opcional - filtra por região)

**Resposta:**
```typescript
{
  "period": { /* ... */ },
  "partners_summary": [
    {
      "partner_id": "uuid",
      "partner_name": "Oficina Silva",
      "total_revenue": {
        "amount": 45250.00,
        "formatted": "R$ 45.250,00"
      },
      "total_quotes": 127,
      "average_quote_value": {
        "amount": 356.30,
        "formatted": "R$ 356,30"
      },
      "parts_requested": 89,
      "projected_value": {
        "amount": 23950.00,
        "formatted": "R$ 23.950,00"
      }
    }
  ],
  "network_overview": {
    "total_partners": 45,
    "active_partners": 38,
    "total_revenue": {
      "amount": 1250000.00,
      "formatted": "R$ 1.250.000,00"
    },
    "average_partner_revenue": {
      "amount": 32894.74,
      "formatted": "R$ 32.894,74"
    }
  }
}
```

### GET /api/partner/financial-summary/export
**Propósito**: Exportar relatório financeiro em PDF/Excel

**Parâmetros de Query:**
- `format`: `pdf` | `excel`
- `period`: `last_month` | `last_3_months` | `last_year` | `custom`

---

## 🎨 Interface do Usuário

### Layout Principal
```
┌─────────────────────────────────────────────────┐
│           📊 RESUMO FINANCEIRO                   │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐    │
│  │        📈 MÉTRICAS PRINCIPAIS           │    │
│  │  ┌─────────────┬─────────────┬─────────┐ │    │
│  │  │ Receita     │ Orçamentos │ Valor    │ │    │
│  │  │ Total       │ Realizados │ Médio    │ │    │
│  │  │ R$ 45.250   │ 127        │ R$ 356   │ │    │
│  │  └─────────────┴─────────────┴─────────┘ │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │        � INFORMAÇÕES DE PEÇAS          │    │
│  │                                         │    │
│  │  Peças Solicitadas: 89                  │    │
│  │  Valor Total: R$ 12.800                 │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │      � VALOR PROJETADO                 │    │
│  │                                         │    │
│  │  Pendente Aprovação: R$ 15.200          │    │
│  │  Em Execução: R$ 8.750                  │    │
│  │  Total Projetado: R$ 23.950             │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### Componentes Principais

#### FinancialSummaryPage (Container)
- Gerencia estado global da página
- Coordena filtros de período customizado
- Responsável por carregamento de dados básicos
- Container simples e direto

#### FinancialMetricsCards
- Exibe as 3 métricas principais em cards
- Valores formatados em moeda
- Design responsivo e limpo

#### PartsInfoCard
- Mostra informações sobre peças solicitadas
- Número total e valor gasto
- Interface simples e objetiva

#### ProjectedValueCard
- Exibe valores projetados
- Separação entre pendentes e em execução
- Total projetado destacado

---

## 🔒 Segurança e Autorização

### Controle de Acesso
- **Parceiro**: Acesso apenas aos próprios dados financeiros
- **Administrador**: Acesso a dados de todos os parceiros
- **Auditoria**: Logs de acesso aos dados financeiros

### Validação de Dados
- Sanitização de parâmetros de entrada
- Validação de períodos de data
- Limitação de volume de dados retornados
- Rate limiting para prevenir abuso

### Privacidade
- Dados financeiros tratados como sensíveis
- Criptografia em trânsito e repouso
- Não exposição de dados de outros parceiros
- Conformidade com LGPD

---

## 📈 Métricas e KPIs

### Métricas de Performance
- **Receita Total**: Soma de todos os orçamentos faturados
- **Total de Orçamentos**: Contagem total de orçamentos realizados
- **Valor Médio dos Orçamentos**: Receita total ÷ Total de orçamentos
- **Valor Projetado**: Soma de orçamentos pendentes + em execução

### Métricas de Peças
- **Peças Solicitadas**: Número total de peças em orçamentos
- **Valor Total em Peças**: Custo total das peças solicitadas
- **Percentual de Peças**: Peças ÷ Total do orçamento × 100

### Métricas de Eficiência
- **Orçamentos por Período**: Média de orçamentos por dia/mês
- **Receita por Orçamento**: Eficiência de monetização
- **Projeção vs Realizado**: Comparação entre projetado e realizado

---

## 🚀 Plano de Implementação

### Fase 1: Fundamentação (Semanas 1-2)
- [ ] Criar entidades básicas (FinancialSummary, Money, DateRange)
- [ ] Implementar repositório simplificado
- [ ] Criar API básica com métricas essenciais
- [ ] Desenvolver componentes core (cards e filtros)

### Fase 2: Funcionalidades Essenciais (Semanas 3-4)
- [ ] Implementar filtros de período customizado
- [ ] Adicionar cálculo de valores projetados
- [ ] Criar seção de informações de peças
- [ ] Integrar com dashboard do parceiro

### Fase 3: Testes e Deploy (Semana 5)
- [ ] Testes unitários e integração
- [ ] Testes E2E básicos
- [ ] Deploy e monitoramento inicial
- [ ] Ajustes baseados em uso real

---

## ✅ Critérios de Aceitação Gerais

### Funcionalidade
- [ ] Dashboard carrega em menos de 2 segundos
- [ ] Filtros de período customizado funcionam corretamente
- [ ] Métricas calculadas corretamente
- [ ] Interface responsiva em desktop e mobile

### Usabilidade
- [ ] Interface simples e intuitiva
- [ ] Navegação clara para a página financeira
- [ ] Dados apresentados de forma clara
- [ ] Filtros fáceis de usar

### Segurança
- [ ] Controle adequado de permissões
- [ ] Dados financeiros protegidos
- [ ] Auditoria de acessos implementada

### Performance
- [ ] Consultas otimizadas no banco de dados
- [ ] Cache implementado para dados financeiros
- [ ] Interface responsiva e rápida

---

## 📚 Documentação Relacionada

- [Arquitetura do Sistema](../../architecture/README.md)
- [Padrões de UI](../../components/README.md)
- [APIs do Parceiro](../../api/README.md)
- [Segurança](../../security/README.md)

---

**📝 Notas de Implementação:**
- Seguir princípios SOLID e DRY estabelecidos
- Manter consistência com arquitetura existente
- Priorizar experiência do usuário
- Implementar testes desde o início
- Documentar decisões técnicas tomadas</content>
<parameter name="filePath">/home/rafael/workspace/proline-homolog/docs/features/partner-financial-summary/README.md