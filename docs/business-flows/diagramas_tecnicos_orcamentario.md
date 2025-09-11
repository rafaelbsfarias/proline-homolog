# Diagramas Técnicos - Fluxo Orçamentário

Este documento contém diagramas técnicos detalhados para o fluxo orçamentário e execução de serviços.

## Diagrama de Componentes do Sistema

```mermaid
graph TB
    subgraph "Frontend"
        CD[Client Dashboard]
        PD[Partner Dashboard]
        AD[Admin Dashboard]
        SD[Specialist Dashboard]
    end

    subgraph "API Layer"
        CA[Client APIs]
        PA[Partner APIs]
        AA[Admin APIs]
        SA[Specialist APIs]
    end

    subgraph "Business Logic"
        NS[Notification Service]
        MS[Monitoring Service]
        AS[Authorization Service]
        BS[Budget Service]
    end

    subgraph "Data Layer"
        DB[(Database)]
        CACHE[(Redis Cache)]
        STORAGE[(Supabase Storage)]
    end

    CD --> CA
    PD --> PA
    AD --> AA
    SD --> SA

    CA --> NS
    PA --> NS
    AA --> NS
    SA --> NS

    CA --> AS
    PA --> AS
    AA --> AS
    SA --> AS

    NS --> BS
    BS --> MS

    BS --> DB
    MS --> DB
    NS --> CACHE
    BS --> STORAGE
```

## Diagrama de Estados Detalhado - Serviço

```mermaid
stateDiagram-v2
    [*] --> pendente: Serviço criado
    pendente --> em_orcamento: Parceiro associado
    em_orcamento --> aguardando_aprovacao: Orçamento enviado
    aguardando_aprovacao --> aprovado: Admin + Cliente aprovaram
    aguardando_aprovacao --> rejeitado: Rejeitado
    
    aprovado --> aguardando_ordem: Aguardando definição de ordem
    aguardando_ordem --> pronto_execucao: Ordem definida
    pronto_execucao --> em_execucao: Início registrado
    em_execucao --> concluido: Conclusão registrada
    em_execucao --> cancelado: Cancelado durante execução
    
    rejeitado --> [*]
    cancelado --> [*]
    concluido --> [*]
    
    note right of em_execucao
        Monitoramento ativo
        Alertas de atraso
    end note
```

## Diagrama de Sequência - Notificações

```mermaid
sequenceDiagram
    participant S as Sistema
    participant NS as NotificationService
    participant DB as Database
    participant WS as WebSocket
    participant P as Parceiro
    participant A as Administrador
    participant C as Cliente

    S->>NS: novaCotacao(servico, parceiroId)
    NS->>DB: salvarNotificacao()
    NS->>WS: broadcastToPartner(parceiroId)
    WS->>P: receberNotificacao()
    P->>NS: marcarComoLida()

    S->>NS: orcamentoPronto(orcamentoId)
    NS->>DB: salvarNotificacao()
    NS->>WS: broadcastToAdmin()
    WS->>A: receberNotificacao()

    A->>NS: aprovarOrcamento(orcamentoId)
    NS->>DB: salvarNotificacao()
    NS->>WS: broadcastToClient(clienteId)
    WS->>C: receberNotificacao()
```

## Diagrama de Fluxo - Controle de Acesso

```mermaid
flowchart TD
    A[Usuário solicita acesso] --> B{Perfil do usuário?}
    
    B -->|Cliente| C{É dono do veículo?}
    C -->|Sim| D[Acesso concedido]
    C -->|Não| E[Acesso negado]
    
    B -->|Parceiro| F{Veículo associado por especialista?}
    F -->|Sim| G{Acesso apenas leitura}
    F -->|Não| E
    
    B -->|Especialista| H{Acesso total ao veículo}
    
    B -->|Administrador| I[Acesso total ao sistema]
    
    D --> J[Carregar dados]
    G --> J
    H --> J
    I --> J
    E --> K[Retornar erro 403]
```

## Diagrama de Classes - Serviços Técnicos

```mermaid
classDiagram
    class NotificationService {
        +sendNotification(userId, message, type)
        +getUnreadCount(userId)
        +markAsRead(notificationId)
        +broadcastToRole(role, message)
    }

    class MonitoringService {
        +startServiceTimer(serviceId)
        +stopServiceTimer(serviceId)
        +calculateActualTime(serviceId)
        +checkForDelays(serviceId)
        +generateDelayAlert(serviceId)
    }

    class BudgetService {
        +createBudget(vehicleId, services)
        +calculateTotal(services)
        +submitForApproval(budgetId)
        +approveByAdmin(budgetId)
        +approveByClient(budgetId)
        +rejectBudget(budgetId)
    }

    class AuthorizationService {
        +checkVehicleOwnership(userId, vehicleId)
        +checkPartnerAssociation(partnerId, vehicleId)
        +getUserPermissions(userId)
        +validateServiceAccess(userId, serviceId)
    }

    class ImageService {
        +uploadServiceImages(serviceId, images, type)
        +getServiceImages(serviceId, type)
        +generateSignedUrls(paths)
        +validateImageFormat(file)
    }

    NotificationService --> Database
    MonitoringService --> Database
    BudgetService --> Database
    AuthorizationService --> Database
    ImageService --> SupabaseStorage
```

## Diagrama de Implantação

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        MOBILE[Mobile App - Future]
    end

    subgraph "Edge Network"
        CDN[CDN - Vercel]
        WAF[Web Application Firewall]
    end

    subgraph "Application Layer"
        NEXT[Next.js App - Vercel]
        API[API Routes]
    end

    subgraph "Service Layer"
        AUTH[Auth Service - Supabase]
        NOTIF[Notification Service]
        MONITOR[Monitoring Service]
        BUDGET[Budget Service]
    end

    subgraph "Data Layer"
        SUPABASE[(Supabase)]
        REDIS[(Redis Cache)]
        STORAGE[(Supabase Storage)]
    end

    WEB --> CDN
    MOBILE --> CDN
    CDN --> NEXT
    NEXT --> API
    API --> AUTH
    API --> NOTIF
    API --> MONITOR
    API --> BUDGET
    NOTIF --> SUPABASE
    MONITOR --> SUPABASE
    BUDGET --> SUPABASE
    API --> REDIS
    API --> STORAGE
```

## Métricas e Monitoramento

### KPIs Principais
- Tempo médio de resposta às cotações
- Taxa de aprovação de orçamentos
- Tempo médio de execução por serviço
- Taxa de atrasos por parceiro
- Satisfação do cliente (NPS)

### Alertas do Sistema
- Orçamento pendente há mais de 48h
- Serviço em execução há mais tempo que o estimado
- Parceiro sem resposta há 24h
- Cliente sem aprovar orçamento há 72h

---

**Data de criação**: 02/09/2025
**Versão**: 1.0
**Autor**: Sistema de Documentação Automática
