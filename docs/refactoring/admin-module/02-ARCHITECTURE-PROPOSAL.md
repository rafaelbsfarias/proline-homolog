# 02 - Proposta de Arquitetura

## 📐 Visão Geral da Arquitetura

A refatoração do módulo admin seguirá os princípios da **Clean Architecture** combinada com **Domain-Driven Design (DDD)**. Esta abordagem garante:

- ✅ **Separação de Concerns**: Cada camada tem responsabilidade única
- ✅ **Dependency Inversion**: Camadas internas não conhecem camadas externas
- ✅ **Testabilidade**: Fácil criar mocks e testes isolados
- ✅ **Manutenibilidade**: Código organizado e previsível
- ✅ **Escalabilidade**: Fácil adicionar novos recursos

## 🏗️ Camadas da Arquitetura

### 1. **Domain Layer** (Núcleo da Aplicação)

**Responsabilidade**: Contém a lógica de negócio pura, sem dependências externas.

**Componentes**:

#### 1.1 Entities (Entidades)
Objetos de negócio com identidade única e ciclo de vida.

```typescript
// modules/admin/domain/entities/User.ts
export class User extends Entity<UserId> {
  private name: PersonName;
  private email: Email;
  private role: UserRole;
  private status: UserStatus;

  constructor(
    id: UserId,
    name: PersonName,
    email: Email,
    role: UserRole,
    status: UserStatus
  ) {
    super(id);
    this.name = name;
    this.email = email;
    this.role = role;
    this.status = status;
  }

  // Business logic methods
  activate(): Result<void> {
    if (this.status === UserStatus.SUSPENDED) {
      return Result.fail(new Error('Cannot activate suspended user'));
    }
    this.status = UserStatus.ACTIVE;
    return Result.ok();
  }

  suspend(reason: string): Result<void> {
    if (this.status === UserStatus.INACTIVE) {
      return Result.fail(new Error('User is already inactive'));
    }
    this.status = UserStatus.SUSPENDED;
    return Result.ok();
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  // Getters
  getName(): PersonName { return this.name; }
  getEmail(): Email { return this.email; }
  getRole(): UserRole { return this.role; }
  getStatus(): UserStatus { return this.status; }
}
```

#### 1.2 Value Objects
Objetos imutáveis identificados por seus valores, não por ID.

```typescript
// modules/admin/domain/value-objects/Email.ts
export class Email extends ValueObject {
  private readonly value: string;

  constructor(email: string) {
    super();
    this.validate(email);
    this.value = email.toLowerCase().trim();
  }

  private validate(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email: ${email}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
```

```typescript
// modules/admin/domain/value-objects/CPF.ts
export class CPF extends ValueObject {
  private readonly value: string;

  constructor(cpf: string) {
    super();
    const cleaned = this.removeFormatting(cpf);
    this.validate(cleaned);
    this.value = cleaned;
  }

  private removeFormatting(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  private validate(cpf: string): void {
    if (cpf.length !== 11) {
      throw new Error('CPF must have 11 digits');
    }

    // Validação do dígito verificador
    if (!this.isValidCheckDigit(cpf)) {
      throw new Error('Invalid CPF check digit');
    }
  }

  private isValidCheckDigit(cpf: string): boolean {
    // Implementação real da validação do CPF
    // ... algoritmo de validação
    return true; // Simplificado
  }

  getValue(): string {
    return this.value;
  }

  getFormatted(): string {
    return `${this.value.slice(0, 3)}.${this.value.slice(3, 6)}.${this.value.slice(6, 9)}-${this.value.slice(9, 11)}`;
  }

  equals(other: CPF): boolean {
    return this.value === other.value;
  }
}
```

#### 1.3 Repository Interfaces
Contratos para persistência, definidos pelo domínio.

```typescript
// modules/admin/domain/repositories/IUserRepository.ts
export interface IUserRepository {
  findById(id: UserId): Promise<Result<User>>;
  findByEmail(email: Email): Promise<Result<User>>;
  findByRole(role: UserRole): Promise<Result<User[]>>;
  findByStatus(status: UserStatus): Promise<Result<User[]>>;
  countByStatus(status: UserStatus): Promise<Result<number>>;
  save(user: User): Promise<Result<User>>;
  update(user: User): Promise<Result<User>>;
  delete(id: UserId): Promise<Result<void>>;
}
```

#### 1.4 Enums e Constants

```typescript
// modules/admin/domain/enums/UserRole.ts
export enum UserRole {
  ADMIN = 'admin',
  CLIENT = 'client',
  PARTNER = 'partner',
  SPECIALIST = 'specialist',
}

// modules/admin/domain/enums/UserStatus.ts
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_APPROVAL = 'pending_approval',
}
```

---

### 2. **Application Layer** (Casos de Uso)

**Responsabilidade**: Orquestra a lógica de negócio através de use cases.

**Componentes**:

#### 2.1 Use Cases

```typescript
// modules/admin/application/use-cases/user/CreateUserUseCase.ts
export class CreateUserUseCase implements IUseCase<CreateUserRequest, UserDTO> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService,
    private readonly logger: ILogger
  ) {}

  async execute(request: CreateUserRequest): Promise<Result<UserDTO>> {
    try {
      // 1. Validação do request
      const validationResult = this.validateRequest(request);
      if (validationResult.isFailure()) {
        return Result.fail(validationResult.getError());
      }

      // 2. Criar value objects
      const nameOrError = Result.safeTry(() => new PersonName(request.name));
      const emailOrError = Result.safeTry(() => new Email(request.email));

      if (nameOrError.isFailure()) return Result.fail(nameOrError.getError());
      if (emailOrError.isFailure()) return Result.fail(emailOrError.getError());

      const name = nameOrError.getValue();
      const email = emailOrError.getValue();

      // 3. Verificar unicidade do email
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser.isOk() && existingUser.getValue() !== null) {
        return Result.fail(new Error('Email already in use'));
      }

      // 4. Criar entidade User
      const user = new User(
        UserId.create(),
        name,
        email,
        request.role,
        UserStatus.PENDING_APPROVAL
      );

      // 5. Persistir
      const savedUserResult = await this.userRepository.save(user);
      if (savedUserResult.isFailure()) {
        return Result.fail(savedUserResult.getError());
      }

      const savedUser = savedUserResult.getValue();

      // 6. Enviar email de boas-vindas (side effect)
      await this.emailService.sendWelcomeEmail(savedUser.getEmail().getValue());

      // 7. Log
      this.logger.info(`User created: ${savedUser.getId().getValue()}`);

      // 8. Retornar DTO
      return Result.ok(UserMapper.toDTO(savedUser));
    } catch (error) {
      this.logger.error('CreateUserUseCase failed', error);
      return Result.fail(error);
    }
  }

  private validateRequest(request: CreateUserRequest): Result<void> {
    if (!request.name || request.name.trim().length === 0) {
      return Result.fail(new Error('Name is required'));
    }
    if (!request.email || request.email.trim().length === 0) {
      return Result.fail(new Error('Email is required'));
    }
    if (!Object.values(UserRole).includes(request.role)) {
      return Result.fail(new Error('Invalid role'));
    }
    return Result.ok();
  }
}
```

```typescript
// modules/admin/application/use-cases/dashboard/GetDashboardStatsUseCase.ts
export class GetDashboardStatsUseCase implements IUseCase<void, DashboardStatsDTO> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly clientRepository: IClientRepository,
    private readonly partnerRepository: IPartnerRepository,
    private readonly specialistRepository: ISpecialistRepository,
    private readonly vehicleRepository: IVehicleRepository
  ) {}

  async execute(): Promise<Result<DashboardStatsDTO>> {
    try {
      // Fetch all counts in parallel
      const [
        totalUsersResult,
        pendingUsersResult,
        totalClientsResult,
        totalPartnersResult,
        totalSpecialistsResult,
        totalVehiclesResult,
      ] = await Promise.all([
        this.userRepository.countByStatus(UserStatus.ACTIVE),
        this.userRepository.countByStatus(UserStatus.PENDING_APPROVAL),
        this.clientRepository.count(),
        this.partnerRepository.count(),
        this.specialistRepository.count(),
        this.vehicleRepository.count(),
      ]);

      // Check for errors
      if (totalUsersResult.isFailure()) return Result.fail(totalUsersResult.getError());
      if (pendingUsersResult.isFailure()) return Result.fail(pendingUsersResult.getError());
      if (totalClientsResult.isFailure()) return Result.fail(totalClientsResult.getError());
      if (totalPartnersResult.isFailure()) return Result.fail(totalPartnersResult.getError());
      if (totalSpecialistsResult.isFailure()) return Result.fail(totalSpecialistsResult.getError());
      if (totalVehiclesResult.isFailure()) return Result.fail(totalVehiclesResult.getError());

      // Create DTO
      const stats: DashboardStatsDTO = {
        totalUsers: totalUsersResult.getValue(),
        pendingUsers: pendingUsersResult.getValue(),
        totalClients: totalClientsResult.getValue(),
        totalPartners: totalPartnersResult.getValue(),
        totalSpecialists: totalSpecialistsResult.getValue(),
        totalVehicles: totalVehiclesResult.getValue(),
      };

      return Result.ok(stats);
    } catch (error) {
      return Result.fail(error);
    }
  }
}
```

#### 2.2 DTOs (Data Transfer Objects)

```typescript
// modules/admin/application/dto/UserDTO.ts
export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// modules/admin/application/dto/DashboardStatsDTO.ts
export interface DashboardStatsDTO {
  totalUsers: number;
  pendingUsers: number;
  totalClients: number;
  totalPartners: number;
  totalSpecialists: number;
  totalVehicles: number;
}
```

---

### 3. **Infrastructure Layer** (Implementações Externas)

**Responsabilidade**: Implementa as interfaces definidas pelo domínio, integrando com tecnologias externas (Supabase, APIs, etc).

**Componentes**:

#### 3.1 Repository Implementations

```typescript
// modules/admin/infrastructure/repositories/SupabaseUserRepository.ts
export class SupabaseUserRepository implements IUserRepository {
  constructor(
    private readonly supabaseClient: SupabaseClient,
    private readonly mapper: UserMapper
  ) {}

  async findById(id: UserId): Promise<Result<User>> {
    try {
      const { data, error } = await this.supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('id', id.getValue())
        .single();

      if (error) return this.handleError(error);
      if (!data) return Result.ok(null);

      return this.mapper.toDomain(data);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async findByEmail(email: Email): Promise<Result<User>> {
    try {
      const { data, error } = await this.supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('email', email.getValue())
        .single();

      if (error) return this.handleError(error);
      if (!data) return Result.ok(null);

      return this.mapper.toDomain(data);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async countByStatus(status: UserStatus): Promise<Result<number>> {
    try {
      const { count, error } = await this.supabaseClient
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);

      if (error) return this.handleError(error);

      return Result.ok(count ?? 0);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async save(user: User): Promise<Result<User>> {
    try {
      const persistenceData = this.mapper.toPersistence(user);

      const { data, error } = await this.supabaseClient
        .from('user_profiles')
        .insert(persistenceData)
        .select()
        .single();

      if (error) return this.handleError(error);

      return this.mapper.toDomain(data);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async update(user: User): Promise<Result<User>> {
    try {
      const persistenceData = this.mapper.toPersistence(user);

      const { data, error } = await this.supabaseClient
        .from('user_profiles')
        .update(persistenceData)
        .eq('id', user.getId().getValue())
        .select()
        .single();

      if (error) return this.handleError(error);

      return this.mapper.toDomain(data);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(id: UserId): Promise<Result<void>> {
    try {
      const { error } = await this.supabaseClient
        .from('user_profiles')
        .delete()
        .eq('id', id.getValue());

      if (error) return this.handleError(error);

      return Result.ok();
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): Result<never> {
    return Result.fail(new Error(`Database error: ${error.message}`));
  }
}
```

#### 3.2 Mappers

```typescript
// modules/admin/infrastructure/mappers/UserMapper.ts
export class UserMapper {
  static toDomain(raw: any): Result<User> {
    try {
      const id = new UserId(raw.id);
      const name = new PersonName(raw.name);
      const email = new Email(raw.email);
      const role = raw.role as UserRole;
      const status = raw.status as UserStatus;

      const user = new User(id, name, email, role, status);

      return Result.ok(user);
    } catch (error) {
      return Result.fail(error);
    }
  }

  static toPersistence(user: User): any {
    return {
      id: user.getId().getValue(),
      name: user.getName().getValue(),
      email: user.getEmail().getValue(),
      role: user.getRole(),
      status: user.getStatus(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  static toDTO(user: User): UserDTO {
    return {
      id: user.getId().getValue(),
      name: user.getName().getValue(),
      email: user.getEmail().getValue(),
      role: user.getRole(),
      status: user.getStatus(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
```

---

### 4. **Presentation Layer** (React Components)

**Responsabilidade**: Renderiza a interface e interage com o usuário.

**Componentes**:

#### 4.1 Pages (Containers)

```typescript
// modules/admin/presentation/pages/AdminDashboard.tsx
export function AdminDashboard() {
  // Hooks centralizados
  const loadingOrchestrator = useLoadingOrchestrator();
  const modalManager = useModalManager();
  const { stats, loading, error, refetch } = useDashboardStats();

  return (
    <div className="admin-dashboard">
      {/* Toolbar com ações */}
      <Toolbar
        onCreateUser={() => modalManager.open('createUser')}
        onAssignSpecialist={() => modalManager.open('assignSpecialist')}
      />

      {/* Stats section */}
      <DashboardStats stats={stats} loading={loading} error={error} />

      {/* Vehicles section */}
      <VehiclesTable />

      {/* Partners section */}
      <PartnersCard />

      {/* Modals */}
      <Modal isOpen={modalManager.activeModal === 'createUser'} onClose={modalManager.close}>
        <CreateUserModal onSuccess={refetch} onClose={modalManager.close} />
      </Modal>

      <Modal isOpen={modalManager.activeModal === 'assignSpecialist'} onClose={modalManager.close}>
        <AssignSpecialistModal
          clientId={modalManager.getModalData()?.clientId}
          onSuccess={refetch}
          onClose={modalManager.close}
        />
      </Modal>
    </div>
  );
}
```

#### 4.2 Smart Components

```typescript
// modules/admin/presentation/components/dashboard/DashboardStats.tsx
export function DashboardStats({ stats, loading, error }: DashboardStatsProps) {
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className="grid grid-cols-5 gap-4">
      <BaseCounter title="Total Users" value={stats?.totalUsers} loading={loading} />
      <BaseCounter title="Pending" value={stats?.pendingUsers} loading={loading} />
      <BaseCounter title="Clients" value={stats?.totalClients} loading={loading} />
      <BaseCounter title="Partners" value={stats?.totalPartners} loading={loading} />
      <BaseCounter title="Vehicles" value={stats?.totalVehicles} loading={loading} />
    </div>
  );
}
```

#### 4.3 Dumb Components (Presentational)

```typescript
// modules/admin/presentation/components/shared/BaseCounter.tsx
export function BaseCounter({ title, value, loading, icon, onClick }: BaseCounterProps) {
  return (
    <div className="base-counter" onClick={onClick}>
      {icon && <div className="icon">{icon}</div>}
      <h3>{title}</h3>
      {loading ? <Skeleton /> : <p className="value">{value}</p>}
    </div>
  );
}
```

#### 4.4 Custom Hooks

```typescript
// modules/admin/presentation/hooks/useDashboardStats.ts
export function useDashboardStats() {
  const [state, setState] = useState<{
    stats: DashboardStatsDTO | null;
    loading: boolean;
    error: Error | null;
  }>({
    stats: null,
    loading: true,
    error: null,
  });

  const getDashboardStatsUseCase = useInjection<GetDashboardStatsUseCase>(TYPES.GetDashboardStatsUseCase);

  const fetchStats = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    const result = await getDashboardStatsUseCase.execute();

    if (result.isOk()) {
      setState({ stats: result.getValue(), loading: false, error: null });
    } else {
      setState({ stats: null, loading: false, error: result.getError() });
    }
  }, [getDashboardStatsUseCase]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats: state.stats,
    loading: state.loading,
    error: state.error,
    refetch: fetchStats,
  };
}
```

---

### 5. **Dependency Injection**

**Responsabilidade**: Conectar as camadas e injetar dependências.

```typescript
// modules/admin/di/container.ts
import { Container } from 'inversify';

export const adminContainer = new Container();

// Repositories
adminContainer.bind<IUserRepository>(TYPES.IUserRepository).to(SupabaseUserRepository);
adminContainer.bind<IClientRepository>(TYPES.IClientRepository).to(SupabaseClientRepository);
adminContainer.bind<IPartnerRepository>(TYPES.IPartnerRepository).to(SupabasePartnerRepository);
adminContainer.bind<ISpecialistRepository>(TYPES.ISpecialistRepository).to(SupabaseSpecialistRepository);
adminContainer.bind<IVehicleRepository>(TYPES.IVehicleRepository).to(SupabaseVehicleRepository);

// Use Cases
adminContainer.bind<CreateUserUseCase>(TYPES.CreateUserUseCase).to(CreateUserUseCase);
adminContainer.bind<GetDashboardStatsUseCase>(TYPES.GetDashboardStatsUseCase).to(GetDashboardStatsUseCase);
adminContainer.bind<AssignSpecialistToClientUseCase>(TYPES.AssignSpecialistToClientUseCase).to(AssignSpecialistToClientUseCase);

// Services
adminContainer.bind<IEmailService>(TYPES.IEmailService).to(EmailService);
adminContainer.bind<ILogger>(TYPES.ILogger).to(Logger);

// External
adminContainer.bind<SupabaseClient>(TYPES.SupabaseClient).toConstantValue(createClient(...));
```

---

## 🔄 Fluxo de Dados

```
User Interaction (Presentation)
    ↓
Custom Hook (useDashboardStats)
    ↓
Use Case (GetDashboardStatsUseCase)
    ↓
Repository Interface (IUserRepository, IClientRepository, ...)
    ↓
Repository Implementation (SupabaseUserRepository, SupabaseClientRepository, ...)
    ↓
Supabase Database
```

---

## ✅ Benefícios da Arquitetura

1. **Testabilidade**: Cada camada pode ser testada isoladamente com mocks
2. **Manutenibilidade**: Código organizado e fácil de navegar
3. **Escalabilidade**: Fácil adicionar novos recursos sem quebrar existentes
4. **Flexibilidade**: Trocar infraestrutura (Supabase → PostgreSQL direto) sem afetar domínio
5. **Clareza**: Fluxo de dados explícito e previsível

---

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Camadas** | Presentation + Service (2) | Presentation + Application + Domain + Infrastructure (4) |
| **Acoplamento** | Alto (componentes → Supabase direto) | Baixo (interfaces + DI) |
| **Testabilidade** | Difícil (dependências concretas) | Fácil (mocks via interfaces) |
| **Lógica de Negócio** | Espalhada (componentes + services) | Centralizada (domain + use cases) |
| **Validações** | Duplicadas | Centralizadas (value objects) |
| **Código Duplicado** | ~1200 LOC | ~0 LOC (componentes reutilizáveis) |
| **Complexidade Loading** | O(7) estados | O(1) estado centralizado |

---

## 🔗 Próximos Passos

Ver documentos:
- **03-DOMAIN-MODEL.md**: Detalhamento completo do modelo de domínio
- **04-COMPONENT-DESIGN.md**: Design detalhado dos componentes React
- **05-IMPLEMENTATION-PHASES.md**: Fases de implementação
- **06-MIGRATION-STRATEGY.md**: Estratégia de migração gradual
- **07-TESTING-STRATEGY.md**: Estratégia de testes
