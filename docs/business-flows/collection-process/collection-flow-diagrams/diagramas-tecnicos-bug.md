
# Diagramas Técnicos - Estados e Transições do Sistema de Coleta

Este documento apresenta diagramas técnicos que detalham o comportamento interno do sistema durante mudanças de data de coleta, incluindo o cenário que causa o bug identificado.

## 1. Diagrama de Estados das Tabelas

```mermaid
stateDiagram-v2
    state "Estado Inicial" as inicial {
        state "vehicles" as v1
        state "vehicle_collections" as vc1
        
        v1 : status: PONTO_COLETA_SELECIONADO
        v1 : estimated_arrival_date: 2025-01-15
        
        vc1 : (não existe ainda)
    }
    
    state "Admin Propõe Data" as admin_prop {
        state "vehicles" as v2
        state "vehicle_collections" as vc2
        
        v2 : status: SOLICITACAO_MUDANCA_DATA
        v2 : estimated_arrival_date: 2025-01-15 (⚠️)
        
        vc2 : collection_date: 2025-01-20
        vc2 : collection_fee: 100.00
        vc2 : status: requested
    }
    
    state "Cliente Muda Data" as cliente_muda {
        state "vehicles" as v3
        state "vehicle_collections" as vc3
        
        v3 : status: APROVACAO_NOVA_DATA
        v3 : estimated_arrival_date: 2025-01-25
        
        vc3 : collection_date: 2025-01-20 (❌)
        vc3 : collection_fee: 100.00
        vc3 : status: requested
    }
    
    state "Bug Ocorre" as bug {
        state "Busca por Data" as busca
        state "Resultado" as resultado
        
        busca : SELECT * FROM vehicle_collections
        busca : WHERE collection_date = '2025-01-25'
        
        resultado : ❌ Nenhum registro encontrado
        resultado : (registro tem collection_date = '2025-01-20')
    }
    
    inicial --> admin_prop : Admin define preço + nova data
    admin_prop --> cliente_muda : Cliente propõe data diferente
    cliente_muda --> bug : Admin tenta aceitar data
```

## 2. Fluxograma de Decisão da API `accept-client-proposed-date`

```mermaid
flowchart TD
    Start([Admin clica 'Aceitar Data']) --> GetVehicles[Buscar veículos com status APROVACAO_NOVA_DATA]
    
    GetVehicles --> GetDate{Extrair data proposta dos veículos}
    GetDate --> |proposedDate = '2025-01-25'| SearchCollection[Buscar vehicle_collections com esta data]
    
    SearchCollection --> FoundWithDate{Encontrou registro?}
    
    FoundWithDate --> |SIM| ValidateFee{Fee válido > 0?}
    FoundWithDate --> |NÃO| Fallback1[Buscar sem filtro de data]
    
    Fallback1 --> FoundWithoutDate{Encontrou registro?}
    FoundWithoutDate --> |SIM| ValidateFee2{Fee válido > 0?}
    FoundWithoutDate --> |NÃO| Fallback2[Buscar com ILIKE no endereço]
    
    Fallback2 --> FoundWithILike{Encontrou registro?}
    FoundWithILike --> |SIM| ValidateFee3{Fee válido > 0?}
    FoundWithILike --> |NÃO| Error1[❌ Erro: Precificação ausente]
    
    ValidateFee --> |SIM| Success[✅ Atualizar status para AGUARDANDO_APROVACAO]
    ValidateFee --> |NÃO| Error2[❌ Erro: Fee inválido]
    
    ValidateFee2 --> |SIM| Success
    ValidateFee2 --> |NÃO| Error2
    
    ValidateFee3 --> |SIM| Success
    ValidateFee3 --> |NÃO| Error2
    
    Success --> End([Sucesso])
    Error1 --> End
    Error2 --> End
    
    style FoundWithDate fill:#ffcccc
    style Error1 fill:#ff6b6b
    style Error2 fill:#ff6b6b
    style Success fill:#51cf66
```

## 3. Diagrama de Sequência - Análise Detalhada do Bug

```mermaid
sequenceDiagram
    participant Admin
    participant API as accept-client-proposed-date
    participant DB_V as vehicles table
    participant DB_VC as vehicle_collections table
    
    Note over Admin,DB_VC: Estado atual: vehicles.date=2025-01-25, collections.date=2025-01-20
    
    Admin->>API: POST /accept-client-proposed-date
    activate API
    
    API->>DB_V: SELECT * WHERE status = 'APROVACAO_NOVA_DATA'
    DB_V-->>API: [{estimated_arrival_date: '2025-01-25', ...}]
    
    Note over API: proposedDate = '2025-01-25'
    
    API->>DB_VC: SELECT * WHERE collection_date = '2025-01-25'
    DB_VC-->>API: [] (nenhum resultado)
    
    Note over API: Primeira busca falhou, tentando fallback...
    
    API->>DB_VC: SELECT * WHERE client_id = ? AND status IN ('requested', 'approved')
    DB_VC-->>API: [{collection_date: '2025-01-20', fee: 100, ...}]
    
    Note over API: Encontrou registro, mas com data diferente
    
    alt Se fee > 0
        Note over API: ✅ Prossegue (funciona por sorte)
        API->>DB_V: UPDATE status = 'AGUARDANDO_APROVACAO'
        API-->>Admin: Success
    else Se fee inválido ou registro não encontrado  
        Note over API: ❌ Bug manifesta
        API-->>Admin: Error: "Precificação ausente"
    end
    
    deactivate API
```

## 4. Matriz de Estados e Transições

```mermaid
graph TD
    subgraph "Tabela: vehicles"
        V1[AGUARDANDO_DEFINICAO] --> V2[PONTO_COLETA_SELECIONADO]
        V2 --> V3[SOLICITACAO_MUDANCA_DATA]
        V3 --> V4[APROVACAO_NOVA_DATA]
        V4 --> V2
        V4 --> V5[AGUARDANDO_APROVACAO]
    end
    
    subgraph "Tabela: vehicle_collections"
        VC1[Não existe] --> VC2[status: requested, date: admin_date]
        VC2 --> VC3[status: requested, date: admin_date]
        VC3 --> VC4[status: approved]
    end
    
    subgraph "Problema Identificado"
        SYNC1[vehicles.date = client_date]
        SYNC2[collections.date = admin_date]
        SYNC1 -.-> BUG[❌ DESSINCRONIA]
        SYNC2 -.-> BUG
    end
    
    V4 -.-> SYNC1
    VC3 -.-> SYNC2
    
    style BUG fill:#ff6b6b
    style V4 fill:#ffcccc
    style VC3 fill:#ffcccc
```

## 5. Diagrama de Componentes e APIs Envolvidas

```mermaid
graph TB
    subgraph "Frontend - Admin Dashboard"
        UI[DatePendingUnifiedSection.tsx]
        HOOK[useClientOverview.ts]
    end
    
    subgraph "APIs Backend"
        API1[/api/admin/propose-collection-date]
        API2[/api/admin/accept-client-proposed-date]
        API3[/api/admin/reject-client-proposed-date]
        API4[/api/client/reschedule-collection]
    end
    
    subgraph "Base de Dados"
        DB1[(vehicles)]
        DB2[(vehicle_collections)]
        DB3[(addresses)]
    end
    
    subgraph "Serviços"
        SERVICE1[buildRescheduleGroups]
        SERVICE2[getClientCollectionsSummary]
    end
    
    UI --> HOOK
    HOOK --> SERVICE2
    SERVICE2 --> SERVICE1
    
    UI --> API2
    UI --> API3
    
    API1 --> DB1
    API1 --> DB2
    
    API2 --> DB1
    API2 --> DB2
    API2 --> DB3
    
    API4 --> DB1
    
    SERVICE1 --> DB1
    SERVICE1 --> DB2
    SERVICE1 --> DB3
    
    style API2 fill:#ffcccc
    style DB1 fill:#fff2cc
    style DB2 fill:#fff2cc
```

## 6. Cronograma de Inconsistências

```mermaid
gantt
    title Timeline do Bug - Inconsistências de Estado
    dateFormat X
    axisFormat %s
    
    section vehicles table
    PONTO_COLETA_SELECIONADO (date: 2025-01-15) :done, v1, 0, 1
    SOLICITACAO_MUDANCA_DATA (date: 2025-01-15) :done, v2, 1, 2
    APROVACAO_NOVA_DATA (date: 2025-01-25) :done, v3, 2, 3
    
    section vehicle_collections table
    Não existe :done, vc0, 0, 1
    requested (date: 2025-01-20) :done, vc1, 1, 3
    
    section Estado de Sincronia
    ✅ Sincronizado :done, sync1, 0, 1
    ⚠️ Primeira inconsistência :done, warn, 1, 2
    ❌ Bug crítico :crit, bug, 2, 3
```

## 7. Mapa de Calor - Pontos de Falha

```mermaid
graph TD
    subgraph "Pontos de Falha Identificados"
        F1[🔥 Busca por data específica]
        F2[🔥 Falta de sincronização entre tabelas]
        F3[🟡 Formatação inconsistente de endereços]
        F4[🟡 Fallback insuficiente]
        F5[🔴 Logs de debug inadequados]
    end
    
    subgraph "Impacto"
        I1[Admin bloqueado]
        I2[Cliente aguardando]
        I3[Processo interrompido]
    end
    
    F1 --> I1
    F2 --> I1
    F2 --> I2
    F1 --> I3
    F2 --> I3
    
    style F1 fill:#ff6b6b
    style F2 fill:#ff6b6b
    style F5 fill:#ff9999
    style I1 fill:#ffeaa7
    style I2 fill:#ffeaa7
    style I3 fill:#ffeaa7
```
````
