# Fluxo de Status dos Veículos

## 1. Introdução

Este documento descreve os fluxos de status dos veículos no sistema ProLine Hub, detalhando como os veículos transitam entre diferentes estados com base nas ações dos atores envolvidos: Cliente, Administrador e Especialista.

## 2. Atores Envolvidos

- **Cliente**: Proprietário do veículo que interage com o sistema para definir métodos de coleta
- **Administrador**: Responsável por definir valores e datas de coleta
- **Especialista**: Profissional que gerencia a chegada e análise dos veículos no pátio

## 3. Estados do Veículo

1. **AGUARDANDO DEFINIÇÃO DE COLETA** - Status inicial após cadastro do veículo
2. **PONTO DE COLETA SELECIONADO** - Cliente definiu ponto de coleta
3. **AGUARDANDO APROVAÇÃO DA COLETA** - Admin definiu valor, aguardando aprovação do cliente
4. **COLETA APROVADA** - Cliente aprovou a coleta
5. **AGUARDANDO COLETA** - Veículo aprovado, aguardando coleta
6. **AGUARDANDO ENTREGA DO VEÍCULO** - Cliente confirmou que está a caminho
7. **ENTREGA CONFIRMADA** - Especialista confirmou entrega do veículo
8. **EM ANÁLISE** - Veículo em processo de análise
9. **ANÁLISE FINALIZADA** - Análise concluída

## 4. Fluxo Principal de Status

### 4.1 Criação do Veículo

O veículo pode ser criado por dois atores diferentes:

1. **Cliente**: Ao cadastrar um novo veículo no sistema
2. **Administrador**: Ao registrar um veículo para o cliente

Após a criação, o veículo sempre é atribuído ao status **AGUARDANDO DEFINIÇÃO DE COLETA**.

### 4.2 Definição de Coleta pelo Cliente

Quando o veículo está no status **AGUARDANDO DEFINIÇÃO DE COLETA**, o cliente tem duas opções:

1. **Selecionar um ponto de coleta**: 
   - Status muda para **PONTO DE COLETA SELECIONADO**

2. **Levar ao pátio ProLine**:
   - Cliente define uma data estimada de entrega
   - Status muda para **AGUARDANDO ENTREGA DO VEÍCULO**

### 4.3 Definição de Valor pelo Administrador

Quando o veículo está no status **PONTO DE COLETA SELECIONADO**, o administrador:

1. Define um valor para o endereço/ponto de coleta selecionado
2. Define uma data de coleta
3. Status muda para **AGUARDANDO APROVAÇÃO DA COLETA**

### 4.4 Aprovação da Coleta pelo Cliente

Quando o veículo está no status **AGUARDANDO APROVAÇÃO DA COLETA**, o cliente:

1. **Aprova a coleta**:
   - Status muda para **COLETA APROVADA**

2. **Rejeita a coleta**:
   - Status muda para **COLETA REJEITADA**
   - Cliente pode optar por:
     a. Levar o veículo ao pátio ProLine
     b. Retornar ao status **AGUARDANDO DEFINIÇÃO DE COLETA**

### 4.5 Processo de Coleta

Quando o veículo está no status **COLETA APROVADA**:

1. O processo de coleta é iniciado
2. O sistema notifica o cliente para comparecer ao pátio
3. Cliente confirma que está a caminho (status **AGUARDANDO CHEGADA DO VEÍCULO**)
4. Especialista confirma a chegada do veículo (status **CHEGADA CONFIRMADA**)

## 5. Processo de "Análise"

1. Veículo entra em análise quando o especialista inicia o checklist (status **EM ANÁLISE**)
2. Análise é finalizada (status **ANÁLISE FINALIZADA**)

## 6. Fluxos Alternativos

### 6.1 Solicitação de Mudança de Data

1. Cliente solicita mudança de data
2. Administrador recebe a solicitação
3. Administrador propõe nova data
4. Cliente:
   - **Aceita a nova data**: Status retorna para **PONTO DE COLETA SELECIONADO**
   - **Rejeita a nova data**: Status retorna para **AGUARDANDO DEFINIÇÃO DE COLETA**

### 6.2 Rejeição de Coleta

1. Cliente rejeita a coleta proposta
2. Sistema exibe modal "Deseja levar ao pátio ProLine?"
3. Cliente:
   - **Aceita levar ao pátio**: 
     - Define data estimada de entrega
     - Status muda para **AGUARDANDO ENTREGA DO VEÍCULO**
   - **Recusa a opção**:
     - Status muda para **PROPOSTAS RECUSADAS**

## 7. Considerações Finais

Este fluxo de status foi projetado para garantir uma experiência clara e intuitiva para todos os atores envolvidos no processo de coleta de veículos. Cada transição de status representa uma etapa importante no processo, permitindo o acompanhamento adequado de cada veículo em sua jornada pelo sistema.