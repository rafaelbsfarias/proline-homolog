# Diagramas de Sequência dos Fluxos de Status dos Veículos

## 1. Fluxo Principal - Criação e Definição Inicial

```mermaid
sequenceDiagram
    participant Cliente
    participant Admin
    participant Sistema
    participant Especialista

    Note over Cliente,Admin: Veículo é criado por Cliente ou Admin
    
    alt Criação do Veículo
        Cliente->>Sistema: Cadastra novo veículo
        Sistema-->>Cliente: Veículo registrado
        Note right of Sistema: Status: AGUARDANDO DEFINIÇÃO DE COLETA
    else
        Admin->>Sistema: Registra veículo para cliente
        Sistema-->>Admin: Veículo registrado
        Note right of Sistema: Status: AGUARDANDO DEFINIÇÃO DE COLETA
    end
    
    alt Definição de Coleta pelo Cliente
        Cliente->>Sistema: Seleciona ponto de coleta
        Note right of Sistema: Status: PONTO DE COLETA SELECIONADO
        
        Admin->>Sistema: Define valor e data de coleta
        Note right of Sistema: Status: AGUARDANDO APROVAÇÃO DA COLETA
        
        Cliente->>Sistema: Aprova coleta
        Note right of Sistema: Status: COLETA APROVADA
    else
        Cliente->>Sistema: Opta por levar ao pátio
        Cliente->>Sistema: Informa data estimada de entrega
        Note right of Sistema: Status: AGUARDANDO ENTREGA DO VEÍCULO
    end
```

## 2. Fluxo de Coleta e Entrega (Não será implementado no mvp)

No mvp o veículo que estiver com o estado 'Aguardando Coleta' não deve exigir nada do cliente, nenhuma ação de confirmação que o carro foi coletado. O unico agente responsável por indicar que a coleta e entrega foi finalizada é o especialista que confirma o recebimento do veículo no pátio. 

```mermaid
sequenceDiagram
    participant Cliente
    participant Sistema
    participant Especialista

    Note over Cliente,Especialista: Processo de coleta do veículo
    
    Cliente->>Sistema: Confirma que está a caminho
    Note right of Sistema: Status: AGUARDANDO CHEGADA DO VEÍCULO
    
    Especialista->>Sistema: Confirma chegada do veículo
    Note right of Sistema: Status: CHEGADA CONFIRMADA
    
    Especialista->>Sistema: Inicia análise do veículo
    Note right of Sistema: Status: EM ANÁLISE
    
    Especialista->>Sistema: Finaliza análise
    Note right of Sistema: Status: ANÁLISE FINALIZADA
```

## 3. Fluxo de Mudança de Data

```mermaid
sequenceDiagram
    participant Cliente
    participant Admin
    participant Sistema

    Note over Cliente,Admin: Solicitação de mudança de data
    
    Cliente->>Sistema: Solicita mudança de data
    Note right of Sistema: Status: AGUARDANDO APROVAÇÃO DE NOVA DATA
    
    Admin->>Sistema: Propõe nova data
    Note right of Sistema: Status: AGUARDANDO APROVAÇÃO DE NOVA DATA
    
    alt Cliente aceita nova data
        Cliente->>Sistema: Aceita nova data proposta
        Note right of Sistema: Status: PONTO DE COLETA SELECIONADO
        Note over Admin: Processo continua normalmente
    else Cliente rejeita nova data
        Cliente->>Sistema: Rejeita nova data proposta
        Note right of Sistema: Status: AGUARDANDO DEFINIÇÃO DE COLETA
        Note over Cliente: Cliente deve redefinir coleta
    end
```

## 4. Fluxo de Rejeição de Coleta

```mermaid
sequenceDiagram
    participant Cliente
    participant Admin
    participant Sistema

    Note over Cliente,Admin: Rejeição de coleta proposta
    
    Admin->>Sistema: Define valor da coleta
    Note right of Sistema: Status: AGUARDANDO APROVAÇÃO DA COLETA
    
    Cliente->>Sistema: Rejeita proposta de coleta
    Note right of Sistema: Status: COLETA REJEITADA
    
    Sistema-->>Cliente: Exibe modal "Deseja levar ao pátio ProLine?"
    
    alt Cliente aceita levar ao pátio
        Cliente->>Sistema: Confirma que levará ao pátio
        Cliente->>Sistema: Informa data prevista de entrega
        Note right of Sistema: Status: AGUARDANDO ENTREGA DO VEÍCULO
    else Cliente não aceita levar ao pátio
        Cliente->>Sistema: Fecha modal ou recusa opção
        Note right of Sistema: Status: PROPOSTAS RECUSADAS
    end
```

## 5. Fluxo Completo de Aprovação (Caminho Feliz)

```mermaid
sequenceDiagram
    participant Cliente
    participant Admin
    participant Sistema
    participant Especialista

    Note over Cliente,Especialista: Fluxo completo de aprovação
    
    Cliente->>Sistema: Cadastra novo veículo
    activate Sistema
    Sistema-->>Cliente: Veículo cadastrado
    deactivate Sistema
    Note right of Sistema: Status: AGUARDANDO DEFINIÇÃO DE COLETA
    
    Cliente->>Sistema: Associa ponto de coleta
    Note right of Sistema: Status: PONTO DE COLETA SELECIONADO
    
    Admin->>Sistema: Define valor e data da coleta
    Note right of Sistema: Status: AGUARDANDO APROVAÇÃO DA COLETA
    
    Cliente->>Sistema: Aprova proposta de coleta
    Note right of Sistema: Status: COLETA APROVADA
    
    Cliente->>Sistema: Confirma que está a caminho
    Note right of Sistema: Status: AGUARDANDO CHEGADA DO VEÍCULO
    
    Especialista->>Sistema: Confirma entrega do veículo
    Note right of Sistema: Status: CHEGADA CONFIRMADA
    
    Especialista->>Sistema: Inicia análise
    Note right of Sistema: Status: EM ANÁLISE
    
    Especialista->>Sistema: Finaliza análise
    Note right of Sistema: Status: ANÁLISE FINALIZADA
```