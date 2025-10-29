# 📐 Diagramas - Refatoração Admin Module

## 📊 Índice de Diagramas

Este diretório contém todos os diagramas relacionados à refatoração do módulo admin.

## 📋 Lista de Diagramas

### 🔄 Diagramas de Sequência

1. **sequence-current-dashboard-loading.mmd** ✅
   - Fluxo atual de carregamento do dashboard
   - Demonstra 7 estados de loading separados
   - Mostra callbacks manuais
   
2. **sequence-proposed-dashboard-loading.mmd** ✅
   - Fluxo proposto com LoadingOrchestrator
   - Demonstra centralização de estado
   - Auto-registro de componentes

3. **sequence-counter-fetch-current.mmd** ✅
   - Fluxo atual de busca de contadores
   - Múltiplas requisições individuais
   - 4+ network roundtrips
   
4. **sequence-counter-fetch-refactored.mmd** ✅
   - Fluxo refatorado com agregação
   - Single use case para dashboard stats
   - Promise.all para execução paralela
   
5. **sequence-modal-management-current.mmd** ✅
   - Gestão atual de modais (no Toolbar)
   - Estado distribuído
   - Sem refresh automático
   
6. **sequence-modal-management-refactored.mmd** ✅
   - Gestão centralizada com useModalManager
   - Single source of truth
   - Refresh automático após ações
   
7. **sequence-assign-specialist.mmd** ✅
   - Fluxo completo de atribuição de especialista
   - Demonstra use case + repository pattern
   - Business rules no domain entity

### 📊 Diagramas de Classes

8. **class-domain-model.mmd** ✅
   - Entities e Value Objects
   - Base classes (Entity, ValueObject)
   - IDs tipados (UserId, ClientId, etc)
   - Enums (UserRole, UserStatus, VehicleStatus, etc)
   
9. **class-repositories.mmd** ✅
   - Interfaces de repositórios (IRepository, IUserRepository, etc)
   - Implementações Supabase (SupabaseUserRepository, etc)
   - Mappers (UserMapper, ClientMapper, etc)
   - Result type para error handling
   
10. **class-use-cases.mmd** ✅
    - Casos de uso da aplicação (CreateUserUseCase, AssignSpecialistUseCase, etc)
    - DTOs e Request/Response objects
    - IUseCase interface genérica

### 🏗️ Diagramas de Componentes

11. **component-composition.mmd** ✅
    - Pattern de composição de componentes
    - Smart vs Dumb components
    - Reusabilidade (BaseCounter, CollapsibleCard, Modal)
    - Métricas de redução (64% menos código)

### 🗄️ Diagramas ER (Entity-Relationship)

12. **er-admin-tables.mmd** ✅
    - Tabelas do módulo admin (users, user_profiles, vehicles, etc)
    - Relacionamentos no banco
    - Foreign keys e constraints

### 🔀 Diagramas de Estado

13. **state-loading-orchestrator.mmd** ✅
    - Estados do LoadingOrchestrator (Idle, Registering, Loading, Reloading, Unregistering)
    - Transições de estado
    - API exposta (register, unregister, executeAll, reload)
    
14. **state-modal-manager.mmd** ✅
    - Estados do ModalManager (NoModalOpen, CreateUserModal, AssignSpecialistModal, DeleteUserModal)
    - Fluxo de abertura/fechamento
    - Estados internos de cada modal (FormFilling, Submitting, Success, Error)

### 🏛️ Diagramas de Arquitetura

15. **architecture-layers.mmd** ✅
    - Comparação Current vs Proposed
    - Camadas da Clean Architecture (Presentation, Application, Domain, Infrastructure)
    - Dependency Inversion
    - DI Container
    
16. **architecture-module-structure.mmd** ✅
    - Estrutura de pastas do módulo
    - Organização de arquivos por camada
    - Separação de responsabilidades### 🏗️ Diagramas de Classe

8. **[class-domain-model.mmd](./class-domain-model.mmd)**
   - Modelo de domínio completo
   - Entities, Value Objects, Aggregates

9. **[class-repositories.mmd](./class-repositories.mmd)**
   - Interfaces de repositórios
   - Implementações concretas

10. **[class-use-cases.mmd](./class-use-cases.mmd)**
    - Application layer
    - Use cases e seus DTOs

### 🧩 Diagramas de Componentes

11. **[component-architecture-current.mmd](./component-architecture-current.mmd)**
    - Arquitetura atual de componentes

12. **[component-architecture-proposed.mmd](./component-architecture-proposed.mmd)**
    - Arquitetura proposta

13. **[component-composition.mmd](./component-composition.mmd)**
    - Padrão de composição proposto

### 🗄️ Diagramas ER (Entity-Relationship)

14. **[er-admin-tables.mmd](./er-admin-tables.mmd)**
    - Tabelas relacionadas ao módulo admin
    - Relacionamentos

### 📊 Diagramas de Estado

15. **[state-loading-orchestrator.mmd](./state-loading-orchestrator.mmd)**
    - Estados do Loading Orchestrator

16. **[state-modal-manager.mmd](./state-modal-manager.mmd)**
    - Estados do Modal Manager

### 🏛️ Diagramas de Arquitetura

17. **[architecture-layers.mmd](./architecture-layers.mmd)**
    - Camadas da arquitetura hexagonal
    - Fluxo de dependências

18. **[architecture-module-structure.mmd](./architecture-module-structure.mmd)**
    - Estrutura de pastas proposta

## 📝 Convenções

### Notação

- **Mermaid.js**: Usado para versionamento e renderização
- **UML 2.0**: Padrão de notação
- **Cores**: 
  - 🔴 Vermelho: Problemas/violações
  - 🟡 Amarelo: Warnings/melhorias
  - 🟢 Verde: Soluções/correto
  - 🔵 Azul: Informação

### Como Visualizar

#### No GitHub
Os arquivos `.mmd` são automaticamente renderizados no GitHub.

#### Localmente

```bash
# Instalar Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Gerar PNG
mmdc -i sequence-current-dashboard-loading.mmd -o sequence-current-dashboard-loading.png

# Gerar SVG
mmdc -i sequence-current-dashboard-loading.mmd -o sequence-current-dashboard-loading.svg
```

#### VS Code Extension
- Instalar: `Markdown Preview Mermaid Support`
- Abrir preview: `Ctrl+Shift+V` (Windows/Linux) ou `Cmd+Shift+V` (Mac)

#### Online
- [Mermaid Live Editor](https://mermaid.live/)
- Copiar conteúdo do arquivo `.mmd` e colar no editor

## 🔗 Referências

- [Mermaid.js Documentation](https://mermaid-js.github.io/)
- [UML 2.0 Specification](https://www.omg.org/spec/UML/)
- [C4 Model](https://c4model.com/)
