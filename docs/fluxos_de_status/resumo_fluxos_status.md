# Resumo dos Fluxos de Status dos Veículos

## 1. Visão Geral

Este documento apresenta uma visão consolidada dos fluxos de status dos veículos no sistema ProLine Hub, com diagramas de sequência que ilustram as interações entre os diferentes atores envolvidos no processo.

## 2. Atores do Sistema

- **Cliente**: Proprietário do veículo que interage com o sistema para definir métodos de coleta
- **Administrador**: Responsável por definir valores e datas de coleta
- **Especialista**: Profissional que gerencia a chegada e análise dos veículos no pátio

## 3. Estados do Veículo

Os veículos transitam por 9 estados principais:

1. **AGUARDANDO DEFINIÇÃO DE COLETA** (inicial)
2. **PONTO DE COLETA SELECIONADO**
3. **AGUARDANDO APROVAÇÃO DA COLETA**
4. **COLETA APROVADA**
5. **AGUARDANDO COLETA**
6. **AGUARDANDO ENTREGA DO VEÍCULO**
7. **ENTREGA CONFIRMADA**
8. **EM ANÁLISE**
9. **ANÁLISE FINALIZADA**

## 4. Fluxos Principais

### 4.1 Criação do Veículo

O veículo pode ser criado por dois atores diferentes:
- Cliente (autocadastro)
- Administrador (cadastro em nome do cliente)

Após a criação, o veículo sempre inicia no status **AGUARDANDO DEFINIÇÃO DE COLETA**.

### 4.2 Definição de Coleta

O cliente pode optar por:
1. **Selecionar um ponto de coleta** - Status muda para **PONTO DE COLETA SELECIONADO**
2. **Levar ao pátio ProLine** - Status muda para **AGUARDANDO ENTREGA DO VEÍCULO**

### 4.3 Processo de Aprovação

1. Administrador define valor e data de coleta → Status: **AGUARDANDO APROVAÇÃO DA COLETA**
2. Cliente aprova a coleta → Status: **COLETA APROVADA**

### 4.4 Processo de Coleta e Entrega

1. Cliente confirma ida ao pátio → Status: **AGUARDANDO CHEGADA DO VEÍCULO**
2. Especialista confirma chegada → Status: **CHEGADA CONFIRMADA**
3. Veículo entra em análise → Status: **EM ANÁLISE**
4. Análise finalizada → Status: **ANÁLISE FINALIZADA**

## 5. Fluxos Alternativos

### 5.1 Mudança de Data

Permite ao cliente solicitar uma data diferente da proposta pelo administrador:
- Cliente solicita mudança de data
- Administrador propõe nova data
- Cliente pode aceitar (continua processo) ou rejeitar (reinicia definição)

### 5.2 Rejeição de Coleta

Quando o cliente rejeita a coleta proposta:
- Sistema oferece opção de levar ao pátio ProLine
- Cliente pode aceitar (define data de entrega) ou recusar (processo é encerrado)

## 6. Documentos Complementares

Para detalhes completos, consulte os documentos complementares:
- [Fluxo de Status dos Veículos](fluxo_status_veiculos.md) - Documentação completa dos estados e transições
- [Diagramas de Sequência](diagramas_sequencia.md) - Ilustrações visuais das interações entre atores

## 7. Considerações Finais

O sistema de fluxos de status foi projetado para garantir:
- Transparência no processo para todos os atores
- Controle adequado das etapas de coleta
- Flexibilidade para tratamento de exceções
- Acompanhamento eficiente de cada veículo em sua jornada