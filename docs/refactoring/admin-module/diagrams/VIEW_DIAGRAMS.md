# 📊 Visualizador de Diagramas - Refatoração Admin Module

Use este arquivo para visualizar todos os diagramas Mermaid da refatoração.

## 🎯 Como Usar

1. **Abra este arquivo no VS Code**
2. **Pressione**: `Ctrl+Shift+V` (ou `Cmd+Shift+V` no Mac)
3. **Ou clique** no ícone 📖 no canto superior direito
4. **Navegue** pelos diagramas abaixo

---

## 🏗️ Arquitetura - Camadas (Current vs Proposed)

**Arquivo**: [architecture-layers.mmd](./architecture-layers.mmd)

Comparação entre arquitetura atual (problemática) e arquitetura proposta (Clean Architecture + DDD).

```mermaid
graph TB
    subgraph Current["🔴 CURRENT ARCHITECTURE"]
        direction TB
        CurrentDashboard["AdminDashboard.tsx<br/>142 LOC, 5 responsibilities"]
        CurrentService["AdminService<br/>Tight coupling"]
        CurrentSupabase["SupabaseService"]
        
        CurrentDashboard -->|direct fetch| CurrentService
        CurrentService -->|tight coupling| CurrentSupabase
        
        CurrentProblems["❌ PROBLEMS:<br/>• No domain layer<br/>• Tight coupling<br/>• 1200 LOC duplicated<br/>• 7 loading states"]
    end
    
    subgraph Proposed["🟢 PROPOSED ARCHITECTURE"]
        direction TB
        
        subgraph Presentation["📱 Presentation"]
            Dashboard["AdminDashboard<br/>~60 LOC"]
        end
        
        subgraph Application["🎯 Application"]
            UseCase["Use Cases"]
        end
        
        subgraph Domain["💎 Domain"]
            Entities["Entities"]
            IRepo["Repository Interfaces"]
        end
        
        subgraph Infrastructure["🔧 Infrastructure"]
            RepoImpl["Repository Implementations"]
            Supabase["Supabase Client"]
        end
        
        Dashboard -->|uses| UseCase
        UseCase -->|depends on| IRepo
        IRepo <|..|implements| RepoImpl
        RepoImpl -->|uses| Supabase
        
        ProposedBenefits["✅ BENEFITS:<br/>• Separation of concerns<br/>• DDD + Clean Architecture<br/>• 60% code reduction"]
    end
    
    style Current fill:#ffebee
    style CurrentProblems fill:#c62828,color:#fff
    style Proposed fill:#e8f5e9
    style Presentation fill:#bbdefb
    style Application fill:#c5cae9
    style Domain fill:#fff9c4
    style Infrastructure fill:#d7ccc8
    style ProposedBenefits fill:#2e7d32,color:#fff
```

---

## 🏛️ Arquitetura - Estrutura de Módulo

**Arquivo**: [architecture-module-structure.mmd](./architecture-module-structure.mmd)

Estrutura de pastas proposta para o módulo admin seguindo Clean Architecture.

```mermaid
graph TB
    subgraph AdminModule["📦 modules/admin/"]
        subgraph Domain["domain/"]
            DomainEntities["entities/<br/>User.ts, Client.ts, Vehicle.ts"]
            DomainVO["value-objects/<br/>Email.ts, CPF.ts, Plate.ts"]
            DomainRepo["repositories/<br/>IUserRepository.ts"]
        end
        
        subgraph Application["application/"]
            UseCases["use-cases/<br/>CreateUserUseCase.ts"]
            DTOs["dto/<br/>UserDTO.ts"]
        end
        
        subgraph Infrastructure["infrastructure/"]
            RepoImpl["repositories/<br/>SupabaseUserRepository.ts"]
            Mappers["mappers/<br/>UserMapper.ts"]
        end
        
        subgraph Presentation["presentation/"]
            Pages["pages/<br/>AdminDashboard.tsx"]
            Components["components/<br/>BaseCounter.tsx"]
            Hooks["hooks/<br/>useDashboardStats.ts"]
        end
        
        Application -->|uses| Domain
        Infrastructure -->|implements| Domain
        Presentation -->|uses| Application
    end
    
    style AdminModule fill:#e3f2fd
    style Domain fill:#fff9c4
    style Application fill:#c5cae9
    style Infrastructure fill:#d7ccc8
    style Presentation fill:#bbdefb
```

---

## 🔄 Sequência - Dashboard Loading (Current)

**Arquivo**: [sequence-current-dashboard-loading.mmd](./sequence-current-dashboard-loading.mmd)

Fluxo atual com 7 estados de loading separados.

```mermaid
sequenceDiagram
    participant User
    participant AdminDashboard
    participant UsersCounter
    participant ClientsCounter
    participant AdminService
    participant Supabase
    
    User->>AdminDashboard: Opens dashboard
    
    Note over AdminDashboard: ❌ 7 separate loading states
    
    AdminDashboard->>UsersCounter: Mount
    UsersCounter->>AdminService: fetchUsersCount()
    AdminService->>Supabase: SELECT COUNT(*)
    Supabase-->>AdminService: 150
    AdminService-->>UsersCounter: 150
    
    AdminDashboard->>ClientsCounter: Mount
    ClientsCounter->>AdminService: fetchClientsCount()
    AdminService->>Supabase: SELECT COUNT(*)
    Supabase-->>AdminService: 75
    AdminService-->>ClientsCounter: 75
    
    Note over AdminDashboard: ❌ Multiple network roundtrips<br/>❌ Duplicated code<br/>❌ O(7) loading complexity
```

---

## 🔄 Sequência - Dashboard Loading (Proposed)

**Arquivo**: [sequence-proposed-dashboard-loading.mmd](./sequence-proposed-dashboard-loading.mmd)

Fluxo proposto com LoadingOrchestrator e agregação de dados.

```mermaid
sequenceDiagram
    participant User
    participant AdminDashboard
    participant UseLoadingOrchestrator
    participant UseDashboardStats
    participant GetDashboardStatsUC
    participant Repositories
    
    User->>AdminDashboard: Opens dashboard
    
    AdminDashboard->>UseLoadingOrchestrator: Auto-register
    AdminDashboard->>UseDashboardStats: useDashboardStats()
    
    Note over UseDashboardStats: ✅ Single loading state
    
    UseDashboardStats->>GetDashboardStatsUC: execute()
    
    Note over GetDashboardStatsUC: Parallel execution
    
    par Fetch all counts in parallel
        GetDashboardStatsUC->>Repositories: countUsers()
        GetDashboardStatsUC->>Repositories: countClients()
        GetDashboardStatsUC->>Repositories: countPartners()
        GetDashboardStatsUC->>Repositories: countVehicles()
    end
    
    Repositories-->>GetDashboardStatsUC: All counts
    GetDashboardStatsUC-->>UseDashboardStats: DashboardStatsDTO
    UseDashboardStats-->>AdminDashboard: { stats, loading: false }
    
    Note over AdminDashboard: ✅ Single network roundtrip<br/>✅ Reusable components<br/>✅ O(1) loading complexity
```

---

## 🔄 Sequência - Counter Fetch (Current)

**Arquivo**: [sequence-counter-fetch-current.mmd](./sequence-counter-fetch-current.mmd)

```mermaid
sequenceDiagram
    participant User
    participant AdminDashboard
    participant Counter1
    participant Counter2
    participant Counter3
    participant AdminService
    participant Supabase
    
    User->>AdminDashboard: Opens page
    
    AdminDashboard->>Counter1: Mount UsersCounter
    Counter1->>AdminService: fetchUsersCount()
    AdminService->>Supabase: SELECT COUNT(*) FROM users
    Supabase-->>Counter1: 150
    
    AdminDashboard->>Counter2: Mount ClientsCounter
    Counter2->>AdminService: fetchClientsCount()
    AdminService->>Supabase: SELECT COUNT(*) FROM clients
    Supabase-->>Counter2: 75
    
    AdminDashboard->>Counter3: Mount PartnersCounter
    Counter3->>AdminService: fetchPartnersCount()
    AdminService->>Supabase: SELECT COUNT(*) FROM partners
    Supabase-->>Counter3: 25
    
    Note over AdminDashboard: ❌ 4+ separate requests<br/>❌ ~320 LOC of duplicated code
```

---

## 🔄 Sequência - Counter Fetch (Refactored)

**Arquivo**: [sequence-counter-fetch-refactored.mmd](./sequence-counter-fetch-refactored.mmd)

```mermaid
sequenceDiagram
    participant User
    participant AdminDashboard
    participant UseDashboardStats
    participant GetDashboardStatsUC
    participant Repositories
    participant DashboardStats
    participant BaseCounter
    
    User->>AdminDashboard: Opens page
    
    AdminDashboard->>UseDashboardStats: useDashboardStats()
    UseDashboardStats->>GetDashboardStatsUC: execute()
    
    par Parallel fetch
        GetDashboardStatsUC->>Repositories: countUsers()
        GetDashboardStatsUC->>Repositories: countClients()
        GetDashboardStatsUC->>Repositories: countPartners()
        GetDashboardStatsUC->>Repositories: countVehicles()
    end
    
    Repositories-->>GetDashboardStatsUC: All counts
    GetDashboardStatsUC-->>UseDashboardStats: DashboardStatsDTO
    UseDashboardStats-->>AdminDashboard: stats
    
    AdminDashboard->>DashboardStats: Render with stats
    
    DashboardStats->>BaseCounter: <BaseCounter title="Users" value={150} />
    DashboardStats->>BaseCounter: <BaseCounter title="Clients" value={75} />
    DashboardStats->>BaseCounter: <BaseCounter title="Partners" value={25} />
    
    Note over DashboardStats: ✅ Single request<br/>✅ ~30 LOC (reused 5x)<br/>✅ 64% code reduction
```

---

## 🔄 Sequência - Modal Management (Current)

**Arquivo**: [sequence-modal-management-current.mmd](./sequence-modal-management-current.mmd)

```mermaid
sequenceDiagram
    participant User
    participant AdminDashboard
    participant Toolbar
    participant CreateUserModal
    
    User->>AdminDashboard: Opens dashboard
    AdminDashboard->>Toolbar: Render
    
    Note over Toolbar: ❌ Modal state inside Toolbar
    Toolbar->>Toolbar: useState(isCreateUserModalOpen)
    
    User->>Toolbar: Clicks "Create User"
    Toolbar->>Toolbar: setIsCreateUserModalOpen(true)
    Toolbar->>CreateUserModal: Render modal
    
    User->>CreateUserModal: Submits form
    CreateUserModal->>CreateUserModal: Create user
    CreateUserModal->>Toolbar: onClose()
    Toolbar->>Toolbar: setIsCreateUserModalOpen(false)
    
    Note over AdminDashboard: ❌ Dashboard unaware of changes<br/>❌ Manual refresh required
```

---

## 🔄 Sequência - Modal Management (Refactored)

**Arquivo**: [sequence-modal-management-refactored.mmd](./sequence-modal-management-refactored.mmd)

```mermaid
sequenceDiagram
    participant User
    participant AdminDashboard
    participant UseModalManager
    participant Toolbar
    participant Modal
    participant CreateUserModal
    participant CreateUserUC
    participant UseDashboardStats
    
    User->>AdminDashboard: Opens dashboard
    
    AdminDashboard->>UseModalManager: useModalManager()
    Note over UseModalManager: ✅ Centralized modal state
    
    AdminDashboard->>Toolbar: Render
    User->>Toolbar: Clicks "Create User"
    Toolbar->>UseModalManager: open('createUser')
    UseModalManager->>Modal: Render CreateUserModal
    
    User->>CreateUserModal: Submits form
    CreateUserModal->>CreateUserUC: execute({ name, email, role })
    CreateUserUC-->>CreateUserModal: Success
    
    CreateUserModal->>UseModalManager: close()
    CreateUserModal->>UseDashboardStats: refetch()
    
    Note over AdminDashboard: ✅ Automatic refresh<br/>✅ No manual intervention needed
    
    UseDashboardStats-->>AdminDashboard: Updated stats
```

---

## 🔄 Sequência - Assign Specialist

**Arquivo**: [sequence-assign-specialist.mmd](./sequence-assign-specialist.mmd)

```mermaid
sequenceDiagram
    participant User
    participant AdminDashboard
    participant ClientsTable
    participant UseModalManager
    participant AssignSpecialistModal
    participant AssignSpecialistUC
    participant IClientRepo
    participant ClientEntity
    
    User->>ClientsTable: Clicks "Assign Specialist"
    ClientsTable->>UseModalManager: open('assignSpecialist', { clientId })
    UseModalManager->>AssignSpecialistModal: Render modal
    
    AssignSpecialistModal->>AssignSpecialistModal: Load specialists
    User->>AssignSpecialistModal: Selects specialist & submits
    
    AssignSpecialistModal->>AssignSpecialistUC: execute({ clientId, specialistId })
    
    AssignSpecialistUC->>IClientRepo: findById(clientId)
    IClientRepo-->>AssignSpecialistUC: Client entity
    
    AssignSpecialistUC->>ClientEntity: client.assignSpecialist(specialistId)
    
    Note over ClientEntity: ✅ Business rules validation:<br/>• Max 5 specialists<br/>• No duplicates
    
    ClientEntity-->>AssignSpecialistUC: Success
    
    AssignSpecialistUC->>IClientRepo: update(client)
    IClientRepo-->>AssignSpecialistUC: Updated client
    
    AssignSpecialistUC-->>AssignSpecialistModal: Success
    AssignSpecialistModal->>UseModalManager: close()
    AssignSpecialistModal->>AdminDashboard: refetch()
    
    Note over AdminDashboard: ✅ Dashboard automatically refreshes
```

---

## 📊 Classes - Domain Model

**Arquivo**: [class-domain-model.mmd](./class-domain-model.mmd)

Modelo de domínio completo com Entities e Value Objects.

```mermaid
classDiagram
    class Entity~TId~ {
        <<abstract>>
        #id: TId
        #createdAt: Date
        +equals(other): boolean
        +getId(): TId
    }
    
    class ValueObject {
        <<abstract>>
        +equals(other): boolean
        +getValue(): any
    }
    
    class User {
        -name: PersonName
        -email: Email
        -role: UserRole
        -status: UserStatus
        +activate(): Result~void~
        +suspend(): Result~void~
        +isActive(): boolean
    }
    
    class Email {
        -value: string
        +constructor(email: string)
        +getValue(): string
        +getDomain(): string
    }
    
    class CPF {
        -value: string
        +constructor(cpf: string)
        +getValue(): string
        +getFormatted(): string
        -validate(): void
    }
    
    class PersonName {
        -value: string
        +getFirstName(): string
        +getLastName(): string
        +getInitials(): string
    }
    
    Entity <|-- User
    ValueObject <|-- Email
    ValueObject <|-- CPF
    ValueObject <|-- PersonName
    User o-- Email
    User o-- PersonName
    
    note for Entity "Base class para todas as entidades<br/>Garante identidade única"
    note for ValueObject "Imutáveis e comparáveis por valor<br/>Encapsulam validações"
```

---

## 📊 Classes - Repositories

**Arquivo**: [class-repositories.mmd](./class-repositories.mmd)

```mermaid
classDiagram
    class IUserRepository {
        <<interface>>
        +findById(id): Promise~Result~User~~
        +findByEmail(email): Promise~Result~User~~
        +save(user): Promise~Result~User~~
        +update(user): Promise~Result~User~~
    }
    
    class SupabaseUserRepository {
        -supabaseClient: SupabaseClient
        -mapper: UserMapper
        +findById(id): Promise~Result~User~~
        +save(user): Promise~Result~User~~
        -toDomain(data): Result~User~
        -toPersistence(user): any
    }
    
    class UserMapper {
        <<utility>>
        +toDomain(raw): Result~User~
        +toPersistence(user): any
        +toDTO(user): UserDTO
    }
    
    class Result~T~ {
        <<value object>>
        -isSuccess: boolean
        -error?: Error
        -value?: T
        +static ok~T~(value): Result~T~
        +static fail~T~(error): Result~T~
        +isOk(): boolean
        +getValue(): T
    }
    
    IUserRepository <|.. SupabaseUserRepository
    SupabaseUserRepository --> UserMapper
    SupabaseUserRepository ..> Result
    
    note for IUserRepository "Interface definida no Domain Layer<br/>Implementação no Infrastructure Layer"
    note for Result "Railway-oriented programming<br/>Type-safe error handling"
```

---

## 📊 Classes - Use Cases

**Arquivo**: [class-use-cases.mmd](./class-use-cases.mmd)

```mermaid
classDiagram
    class IUseCase~TRequest, TResponse~ {
        <<interface>>
        +execute(request): Promise~Result~TResponse~~
    }
    
    class CreateUserUseCase {
        -userRepository: IUserRepository
        -emailService: IEmailService
        +execute(request): Promise~Result~UserDTO~~
        -validateRequest(request): Result~void~
        -checkEmailUniqueness(email): Promise~Result~void~~
    }
    
    class GetDashboardStatsUseCase {
        -userRepository: IUserRepository
        -clientRepository: IClientRepository
        -partnerRepository: IPartnerRepository
        +execute(): Promise~Result~DashboardStatsDTO~~
    }
    
    class CreateUserRequest {
        +name: string
        +email: string
        +role: UserRole
    }
    
    class UserDTO {
        +id: string
        +name: string
        +email: string
        +role: string
        +status: string
    }
    
    IUseCase <|.. CreateUserUseCase
    IUseCase <|.. GetDashboardStatsUseCase
    CreateUserUseCase ..> CreateUserRequest
    CreateUserUseCase ..> UserDTO
    
    note for IUseCase "Single responsibility<br/>One use case = one business operation"
    note for GetDashboardStatsUseCase "Aggregates data from multiple repositories<br/>Replaces 7 separate API calls"
```

---

## 🧩 Component Composition

**Arquivo**: [component-composition.mmd](./component-composition.mmd)

```mermaid
graph TB
    subgraph Container["Container (Page)"]
        AdminDashboard["AdminDashboard.tsx<br/>~60 LOC<br/>Composition only"]
    end
    
    subgraph Smart["Smart Components"]
        DashboardStats["DashboardStats.tsx<br/>~40 LOC<br/>Uses useDashboardStats hook"]
        VehiclesTable["VehiclesTable.tsx<br/>~50 LOC<br/>Uses useVehicles hook"]
    end
    
    subgraph Dumb["Dumb Components"]
        BaseCounter["BaseCounter.tsx<br/>~30 LOC<br/>Props: title, value, loading, icon"]
        CollapsibleCard["CollapsibleCard.tsx<br/>~40 LOC<br/>Props: title, children, defaultOpen"]
    end
    
    subgraph Hooks["Custom Hooks"]
        UseDashboardStats["useDashboardStats()<br/>Returns: stats, loading, error, refetch"]
        UseLoadingOrchestrator["useLoadingOrchestrator()<br/>Returns: isLoading, register, executeAll"]
    end
    
    AdminDashboard -->|composes| DashboardStats
    AdminDashboard -->|composes| VehiclesTable
    AdminDashboard -->|uses| UseLoadingOrchestrator
    
    DashboardStats -->|uses| UseDashboardStats
    DashboardStats -->|renders 5x| BaseCounter
    
    VehiclesTable -->|wraps with| CollapsibleCard
    
    style Container fill:#fff9c4
    style Smart fill:#c5cae9
    style Dumb fill:#bbdefb
    style Hooks fill:#b2dfdb
    
    Benefits["✅ BENEFITS:<br/>• Loose coupling<br/>• Highly reusable<br/>• Easy to test<br/>• 64% code reduction"]
    style Benefits fill:#2e7d32,color:#fff
```

---

## 🗄️ Entity-Relationship Diagram

**Arquivo**: [er-admin-tables.mmd](./er-admin-tables.mmd)

```mermaid
erDiagram
    users ||--o{ user_profiles : "has profile"
    user_profiles ||--o{ vehicles : "owns"
    user_profiles ||--o{ client_specialists : "client"
    user_profiles ||--o{ client_specialists : "specialist"
    
    users {
        uuid id PK
        varchar email UK
        varchar encrypted_password
        timestamptz created_at
    }
    
    user_profiles {
        uuid id PK
        uuid user_id FK
        varchar name
        varchar company
        varchar document "CPF or CNPJ"
        varchar role "admin, client, partner, specialist"
        varchar status "active, inactive, suspended, pending_approval"
        timestamptz created_at
    }
    
    vehicles {
        uuid id PK
        uuid client_id FK
        varchar plate UK
        varchar brand
        varchar model
        integer year
        varchar status "registered, in_analysis, budgeting, approved, in_execution, completed"
        timestamptz created_at
    }
    
    client_specialists {
        uuid id PK
        uuid client_id FK
        uuid specialist_id FK
        timestamptz assigned_at
    }
```

---

## 🔀 State - Loading Orchestrator

**Arquivo**: [state-loading-orchestrator.mmd](./state-loading-orchestrator.mmd)

```mermaid
stateDiagram-v2
    [*] --> Idle
    
    state "🟢 Idle" as Idle
    state "🔵 Registering" as Registering
    state "⏳ Loading" as Loading
    state "🔄 Reloading" as Reloading
    
    Idle --> Registering: register(key, fn)
    Idle --> Loading: executeAll()
    Idle --> Reloading: reload(key)
    
    Registering --> Idle: Registration complete
    Registering --> Loading: autoExecuteOnMount
    
    Loading --> Idle: All complete
    Reloading --> Idle: Single loader complete
    
    Idle --> [*]: Component unmounts
    
    note right of Idle
        Hook State:
        • loaders: Map<string, () => Promise<void>>
        • isLoading: boolean
        • errors: Record<string, Error>
        
        Exposed API:
        • register(key, fn)
        • executeAll()
        • reload(key)
        • isLoading
    end note
```

---

## 🔀 State - Modal Manager

**Arquivo**: [state-modal-manager.mmd](./state-modal-manager.mmd)

```mermaid
stateDiagram-v2
    [*] --> NoModalOpen
    
    state "🔒 No Modal Open" as NoModalOpen
    state "📋 Create User Modal" as CreateUserModal
    state "👤 Assign Specialist Modal" as AssignSpecialistModal
    
    NoModalOpen --> CreateUserModal: open('createUser')
    NoModalOpen --> AssignSpecialistModal: open('assignSpecialist')
    
    CreateUserModal --> NoModalOpen: close() or Success
    AssignSpecialistModal --> NoModalOpen: close() or Success
    
    state CreateUserModal {
        [*] --> FormFilling
        FormFilling --> Submitting: Submit
        Submitting --> Success: User created
        Submitting --> FormFilling: Error
        Success --> [*]
    }
    
    state AssignSpecialistModal {
        [*] --> LoadingSpecialists
        LoadingSpecialists --> Selection: Data loaded
        Selection --> Assigning: Assign
        Assigning --> Success: Assigned
        Assigning --> Selection: Error
        Success --> [*]
    }
    
    note right of NoModalOpen
        Hook State:
        • activeModal: string | null
        • modalData: Record<string, any>
        
        Exposed API:
        • open(modalId, data?)
        • close()
        • activeModal
    end note
```

---

## 📖 Navegação Rápida

### Documentos
- [README Principal](../README.md)
- [00-OVERVIEW.md](../00-OVERVIEW.md) - Visão geral
- [01-CURRENT-STATE-ANALYSIS.md](../01-CURRENT-STATE-ANALYSIS.md) - Análise atual
- [02-ARCHITECTURE-PROPOSAL.md](../02-ARCHITECTURE-PROPOSAL.md) - Arquitetura proposta
- [03-DOMAIN-MODEL.md](../03-DOMAIN-MODEL.md) - Modelo de domínio

### Diagramas Completos (Arquivos .mmd)
Para ver os diagramas completos e detalhados, abra os arquivos diretamente:

**Sequência:**
- [sequence-current-dashboard-loading.mmd](./sequence-current-dashboard-loading.mmd)
- [sequence-proposed-dashboard-loading.mmd](./sequence-proposed-dashboard-loading.mmd)
- [sequence-counter-fetch-current.mmd](./sequence-counter-fetch-current.mmd)
- [sequence-counter-fetch-refactored.mmd](./sequence-counter-fetch-refactored.mmd)
- [sequence-modal-management-current.mmd](./sequence-modal-management-current.mmd)
- [sequence-modal-management-refactored.mmd](./sequence-modal-management-refactored.mmd)
- [sequence-assign-specialist.mmd](./sequence-assign-specialist.mmd)

**Classes:**
- [class-domain-model.mmd](./class-domain-model.mmd)
- [class-repositories.mmd](./class-repositories.mmd)
- [class-use-cases.mmd](./class-use-cases.mmd)

**Outros:**
- [component-composition.mmd](./component-composition.mmd)
- [er-admin-tables.mmd](./er-admin-tables.mmd)
- [state-loading-orchestrator.mmd](./state-loading-orchestrator.mmd)
- [state-modal-manager.mmd](./state-modal-manager.mmd)
- [architecture-layers.mmd](./architecture-layers.mmd)
- [architecture-module-structure.mmd](./architecture-module-structure.mmd)

---

## 🎨 Dicas de Visualização

### No VS Code
1. **Preview Markdown**: `Ctrl+Shift+V` (este arquivo)
2. **Preview Mermaid**: `Ctrl+K V` (arquivos .mmd)
3. **Side-by-side**: Abra o .mmd e este arquivo lado a lado

### Online
- **Mermaid Live Editor**: https://mermaid.live/
- Copie o conteúdo de qualquer arquivo .mmd
- Cole no editor online
- Baixe como PNG/SVG se necessário

### Exportar para Imagem
```bash
# Instalar CLI (apenas uma vez)
npm install -g @mermaid-js/mermaid-cli

# Gerar PNG de um diagrama
mmdc -i architecture-layers.mmd -o architecture-layers.png

# Gerar SVG
mmdc -i architecture-layers.mmd -o architecture-layers.svg
```

---

*💡 **Dica**: Mantenha este arquivo aberto em preview mode enquanto edita os diagramas para ver mudanças em tempo real!*

*📚 **Documentação Mermaid**: https://mermaid.js.org/intro/*
