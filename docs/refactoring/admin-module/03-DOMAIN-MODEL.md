# 03 - Modelo de Domínio (Domain Model)

## 📚 Visão Geral

O Domain Model é o coração da aplicação, contendo toda a lógica de negócio e regras da aplicação de forma independente de tecnologias externas. Este documento detalha todos os elementos do domínio do módulo admin.

## 🧱 Building Blocks do DDD

### 1. **Entities** (Entidades)

Objetos com identidade única que persiste ao longo do tempo, mesmo que seus atributos mudem.

#### 1.1 User (AdminUser)

```typescript
// modules/admin/domain/entities/User.ts
import { Entity } from '@/modules/admin/shared/Entity';
import { UserId } from '@/modules/admin/domain/value-objects/UserId';
import { PersonName } from '@/modules/admin/domain/value-objects/PersonName';
import { Email } from '@/modules/admin/domain/value-objects/Email';
import { UserRole } from '@/modules/admin/domain/enums/UserRole';
import { UserStatus } from '@/modules/admin/domain/enums/UserStatus';
import { Result } from '@/modules/admin/shared/Result';

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

  // Business logic: Activation
  activate(): Result<void> {
    if (this.status === UserStatus.SUSPENDED) {
      return Result.fail(
        new Error('Cannot activate a suspended user. Please unsuspend first.')
      );
    }

    if (this.status === UserStatus.ACTIVE) {
      return Result.fail(new Error('User is already active'));
    }

    this.status = UserStatus.ACTIVE;
    return Result.ok();
  }

  // Business logic: Deactivation
  deactivate(): Result<void> {
    if (this.status === UserStatus.INACTIVE) {
      return Result.fail(new Error('User is already inactive'));
    }

    if (this.status === UserStatus.SUSPENDED) {
      return Result.fail(
        new Error('Cannot deactivate suspended user. Please unsuspend first.')
      );
    }

    this.status = UserStatus.INACTIVE;
    return Result.ok();
  }

  // Business logic: Suspension
  suspend(reason: string): Result<void> {
    if (!reason || reason.trim().length === 0) {
      return Result.fail(new Error('Suspension reason is required'));
    }

    if (this.status === UserStatus.SUSPENDED) {
      return Result.fail(new Error('User is already suspended'));
    }

    this.status = UserStatus.SUSPENDED;
    return Result.ok();
  }

  // Business logic: Unsuspend
  unsuspend(): Result<void> {
    if (this.status !== UserStatus.SUSPENDED) {
      return Result.fail(new Error('User is not suspended'));
    }

    this.status = UserStatus.ACTIVE;
    return Result.ok();
  }

  // Query methods
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isPending(): boolean {
    return this.status === UserStatus.PENDING_APPROVAL;
  }

  isSuspended(): boolean {
    return this.status === UserStatus.SUSPENDED;
  }

  canBeDeleted(): boolean {
    // Business rule: Cannot delete active users with dependencies
    return this.status === UserStatus.INACTIVE || this.status === UserStatus.PENDING_APPROVAL;
  }

  // Getters
  getName(): PersonName {
    return this.name;
  }

  getEmail(): Email {
    return this.email;
  }

  getRole(): UserRole {
    return this.role;
  }

  getStatus(): UserStatus {
    return this.status;
  }

  // Update methods
  updateName(newName: PersonName): void {
    this.name = newName;
  }

  updateEmail(newEmail: Email): Result<void> {
    // Business rule: Email cannot be changed if user has pending operations
    if (this.status === UserStatus.PENDING_APPROVAL) {
      return Result.fail(new Error('Cannot change email of pending user'));
    }

    this.email = newEmail;
    return Result.ok();
  }
}
```

#### 1.2 Client

```typescript
// modules/admin/domain/entities/Client.ts
export class Client extends Entity<ClientId> {
  private name: PersonName;
  private email: Email;
  private company: CompanyName;
  private document: DocumentNumber;
  private specialists: SpecialistId[];

  constructor(
    id: ClientId,
    name: PersonName,
    email: Email,
    company: CompanyName,
    document: DocumentNumber,
    specialists: SpecialistId[] = []
  ) {
    super(id);
    this.name = name;
    this.email = email;
    this.company = company;
    this.document = document;
    this.specialists = specialists;
  }

  // Business logic: Assign specialist
  assignSpecialist(specialistId: SpecialistId): Result<void> {
    if (this.hasSpecialist(specialistId)) {
      return Result.fail(new Error('Specialist is already assigned to this client'));
    }

    // Business rule: Client can have max 5 specialists
    if (this.specialists.length >= 5) {
      return Result.fail(new Error('Client cannot have more than 5 specialists'));
    }

    this.specialists.push(specialistId);
    return Result.ok();
  }

  // Business logic: Remove specialist
  removeSpecialist(specialistId: SpecialistId): Result<void> {
    if (!this.hasSpecialist(specialistId)) {
      return Result.fail(new Error('Specialist is not assigned to this client'));
    }

    // Business rule: Client must have at least 1 specialist
    if (this.specialists.length === 1) {
      return Result.fail(new Error('Client must have at least one specialist'));
    }

    this.specialists = this.specialists.filter(
      (id) => !id.equals(specialistId)
    );
    return Result.ok();
  }

  // Query methods
  hasSpecialist(specialistId: SpecialistId): boolean {
    return this.specialists.some((id) => id.equals(specialistId));
  }

  getSpecialistsCount(): number {
    return this.specialists.length;
  }

  canAddMoreSpecialists(): boolean {
    return this.specialists.length < 5;
  }

  // Getters
  getName(): PersonName {
    return this.name;
  }

  getEmail(): Email {
    return this.email;
  }

  getCompany(): CompanyName {
    return this.company;
  }

  getDocument(): DocumentNumber {
    return this.document;
  }

  getSpecialists(): SpecialistId[] {
    return [...this.specialists]; // Return copy to prevent mutation
  }
}
```

#### 1.3 Partner

```typescript
// modules/admin/domain/entities/Partner.ts
export class Partner extends Entity<PartnerId> {
  private company: CompanyName;
  private cnpj: CNPJ;
  private email: Email;
  private category: ServiceCategory;
  private services: Service[];

  constructor(
    id: PartnerId,
    company: CompanyName,
    cnpj: CNPJ,
    email: Email,
    category: ServiceCategory,
    services: Service[] = []
  ) {
    super(id);
    this.company = company;
    this.cnpj = cnpj;
    this.email = email;
    this.category = category;
    this.services = services;
  }

  // Business logic: Add service
  addService(service: Service): Result<void> {
    if (this.hasService(service.getId())) {
      return Result.fail(new Error('Service already exists'));
    }

    // Business rule: Service must match partner category
    if (service.getCategory() !== this.category) {
      return Result.fail(new Error('Service category does not match partner category'));
    }

    this.services.push(service);
    return Result.ok();
  }

  // Business logic: Remove service
  removeService(serviceId: ServiceId): Result<void> {
    if (!this.hasService(serviceId)) {
      return Result.fail(new Error('Service not found'));
    }

    // Business rule: Partner must have at least 1 service
    if (this.services.length === 1) {
      return Result.fail(new Error('Partner must have at least one service'));
    }

    this.services = this.services.filter((s) => !s.getId().equals(serviceId));
    return Result.ok();
  }

  // Query methods
  hasService(serviceId: ServiceId): boolean {
    return this.services.some((s) => s.getId().equals(serviceId));
  }

  getActiveServicesCount(): number {
    return this.services.filter((s) => s.isActive()).length;
  }

  // Getters
  getCompany(): CompanyName {
    return this.company;
  }

  getCNPJ(): CNPJ {
    return this.cnpj;
  }

  getEmail(): Email {
    return this.email;
  }

  getCategory(): ServiceCategory {
    return this.category;
  }

  getServices(): Service[] {
    return [...this.services];
  }
}
```

#### 1.4 Vehicle

```typescript
// modules/admin/domain/entities/Vehicle.ts
export class Vehicle extends Entity<VehicleId> {
  private plate: Plate;
  private brand: string;
  private model: string;
  private year: number;
  private ownerId: ClientId;
  private status: VehicleStatus;

  constructor(
    id: VehicleId,
    plate: Plate,
    brand: string,
    model: string,
    year: number,
    ownerId: ClientId,
    status: VehicleStatus = VehicleStatus.REGISTERED
  ) {
    super(id);
    this.plate = plate;
    this.brand = brand;
    this.model = model;
    this.year = year;
    this.ownerId = ownerId;
    this.status = status;
  }

  // Business logic: Status transitions
  updateStatus(newStatus: VehicleStatus): Result<void> {
    const validTransitions = this.getValidTransitions();

    if (!validTransitions.includes(newStatus)) {
      return Result.fail(
        new Error(`Invalid status transition from ${this.status} to ${newStatus}`)
      );
    }

    this.status = newStatus;
    return Result.ok();
  }

  // Business rule: Valid status transitions
  private getValidTransitions(): VehicleStatus[] {
    switch (this.status) {
      case VehicleStatus.REGISTERED:
        return [VehicleStatus.IN_ANALYSIS];
      case VehicleStatus.IN_ANALYSIS:
        return [VehicleStatus.BUDGETING, VehicleStatus.REGISTERED];
      case VehicleStatus.BUDGETING:
        return [VehicleStatus.APPROVED, VehicleStatus.IN_ANALYSIS];
      case VehicleStatus.APPROVED:
        return [VehicleStatus.IN_EXECUTION];
      case VehicleStatus.IN_EXECUTION:
        return [VehicleStatus.COMPLETED];
      case VehicleStatus.COMPLETED:
        return []; // Terminal state
      default:
        return [];
    }
  }

  // Business logic: Transfer ownership
  transferOwnership(newOwnerId: ClientId): Result<void> {
    // Business rule: Cannot transfer if vehicle is in execution
    if (this.status === VehicleStatus.IN_EXECUTION) {
      return Result.fail(new Error('Cannot transfer vehicle during execution'));
    }

    if (this.ownerId.equals(newOwnerId)) {
      return Result.fail(new Error('New owner is the same as current owner'));
    }

    this.ownerId = newOwnerId;
    return Result.ok();
  }

  // Query methods
  canBeDeleted(): boolean {
    return this.status === VehicleStatus.REGISTERED;
  }

  isInProgress(): boolean {
    return (
      this.status === VehicleStatus.IN_ANALYSIS ||
      this.status === VehicleStatus.BUDGETING ||
      this.status === VehicleStatus.IN_EXECUTION
    );
  }

  // Getters
  getPlate(): Plate {
    return this.plate;
  }

  getBrand(): string {
    return this.brand;
  }

  getModel(): string {
    return this.model;
  }

  getYear(): number {
    return this.year;
  }

  getOwnerId(): ClientId {
    return this.ownerId;
  }

  getStatus(): VehicleStatus {
    return this.status;
  }
}
```

---

### 2. **Value Objects**

Objetos imutáveis identificados por seus valores, usados para encapsular validações e comportamentos.

#### 2.1 Email

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

    if (!email || email.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }

    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }

    if (email.length > 255) {
      throw new Error('Email is too long (max 255 characters)');
    }
  }

  getValue(): string {
    return this.value;
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }

  getLocalPart(): string {
    return this.value.split('@')[0];
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
```

#### 2.2 CPF

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

    // Check for known invalid CPFs (all same digit)
    if (/^(\d)\1{10}$/.test(cpf)) {
      throw new Error('Invalid CPF: all digits are the same');
    }

    // Validate check digits
    if (!this.isValidCheckDigit(cpf)) {
      throw new Error('Invalid CPF check digit');
    }
  }

  private isValidCheckDigit(cpf: string): boolean {
    // First check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let checkDigit = 11 - (sum % 11);
    if (checkDigit >= 10) checkDigit = 0;
    if (checkDigit !== parseInt(cpf.charAt(9))) return false;

    // Second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    checkDigit = 11 - (sum % 11);
    if (checkDigit >= 10) checkDigit = 0;
    if (checkDigit !== parseInt(cpf.charAt(10))) return false;

    return true;
  }

  getValue(): string {
    return this.value;
  }

  getFormatted(): string {
    return `${this.value.slice(0, 3)}.${this.value.slice(3, 6)}.${this.value.slice(
      6,
      9
    )}-${this.value.slice(9, 11)}`;
  }

  equals(other: CPF): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.getFormatted();
  }
}
```

#### 2.3 CNPJ

```typescript
// modules/admin/domain/value-objects/CNPJ.ts
export class CNPJ extends ValueObject {
  private readonly value: string;

  constructor(cnpj: string) {
    super();
    const cleaned = this.removeFormatting(cnpj);
    this.validate(cleaned);
    this.value = cleaned;
  }

  private removeFormatting(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
  }

  private validate(cnpj: string): void {
    if (cnpj.length !== 14) {
      throw new Error('CNPJ must have 14 digits');
    }

    // Check for known invalid CNPJs (all same digit)
    if (/^(\d)\1{13}$/.test(cnpj)) {
      throw new Error('Invalid CNPJ: all digits are the same');
    }

    // Validate check digits
    if (!this.isValidCheckDigit(cnpj)) {
      throw new Error('Invalid CNPJ check digit');
    }
  }

  private isValidCheckDigit(cnpj: string): boolean {
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    // First check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights1[i];
    }
    let checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (checkDigit !== parseInt(cnpj.charAt(12))) return false;

    // Second check digit
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights2[i];
    }
    checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (checkDigit !== parseInt(cnpj.charAt(13))) return false;

    return true;
  }

  getValue(): string {
    return this.value;
  }

  getFormatted(): string {
    return `${this.value.slice(0, 2)}.${this.value.slice(2, 5)}.${this.value.slice(
      5,
      8
    )}/${this.value.slice(8, 12)}-${this.value.slice(12, 14)}`;
  }

  equals(other: CNPJ): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.getFormatted();
  }
}
```

#### 2.4 PersonName

```typescript
// modules/admin/domain/value-objects/PersonName.ts
export class PersonName extends ValueObject {
  private readonly value: string;

  constructor(name: string) {
    super();
    this.validate(name);
    this.value = name.trim();
  }

  private validate(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }

    if (name.trim().length < 3) {
      throw new Error('Name must have at least 3 characters');
    }

    if (name.trim().length > 100) {
      throw new Error('Name is too long (max 100 characters)');
    }

    // Must have at least first and last name
    const parts = name.trim().split(/\s+/);
    if (parts.length < 2) {
      throw new Error('Name must include first and last name');
    }

    // Check for invalid characters
    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(name)) {
      throw new Error('Name contains invalid characters');
    }
  }

  getValue(): string {
    return this.value;
  }

  getFirstName(): string {
    return this.value.split(/\s+/)[0];
  }

  getLastName(): string {
    const parts = this.value.split(/\s+/);
    return parts[parts.length - 1];
  }

  getInitials(): string {
    const parts = this.value.split(/\s+/);
    return parts.map((part) => part[0].toUpperCase()).join('');
  }

  equals(other: PersonName): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  toString(): string {
    return this.value;
  }
}
```

#### 2.5 Plate (Placa de Veículo)

```typescript
// modules/admin/domain/value-objects/Plate.ts
export class Plate extends ValueObject {
  private readonly value: string;
  private readonly format: 'old' | 'mercosul';

  constructor(plate: string) {
    super();
    const cleaned = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    this.validate(cleaned);
    this.value = cleaned;
    this.format = this.detectFormat(cleaned);
  }

  private validate(plate: string): void {
    if (!plate || plate.length === 0) {
      throw new Error('Plate cannot be empty');
    }

    const oldFormat = /^[A-Z]{3}[0-9]{4}$/; // ABC1234
    const mercosulFormat = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/; // ABC1D23

    if (!oldFormat.test(plate) && !mercosulFormat.test(plate)) {
      throw new Error('Invalid plate format. Expected ABC1234 or ABC1D23');
    }
  }

  private detectFormat(plate: string): 'old' | 'mercosul' {
    return /^[A-Z]{3}[0-9]{4}$/.test(plate) ? 'old' : 'mercosul';
  }

  getValue(): string {
    return this.value;
  }

  getFormatted(): string {
    return `${this.value.slice(0, 3)}-${this.value.slice(3)}`;
  }

  getFormat(): 'old' | 'mercosul' {
    return this.format;
  }

  isMercosul(): boolean {
    return this.format === 'mercosul';
  }

  equals(other: Plate): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.getFormatted();
  }
}
```

---

### 3. **Enums**

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

// modules/admin/domain/enums/VehicleStatus.ts
export enum VehicleStatus {
  REGISTERED = 'registered',
  IN_ANALYSIS = 'in_analysis',
  BUDGETING = 'budgeting',
  APPROVED = 'approved',
  IN_EXECUTION = 'in_execution',
  COMPLETED = 'completed',
}

// modules/admin/domain/enums/ServiceCategory.ts
export enum ServiceCategory {
  MECHANICS = 'mechanics',
  BODYWORK = 'bodywork',
  PAINTING = 'painting',
  CLEANING = 'cleaning',
  TIRES = 'tires',
  STORE = 'store',
  YARD = 'yard',
}
```

---

### 4. **Repository Interfaces** (Domain Layer)

```typescript
// modules/admin/domain/repositories/IUserRepository.ts
export interface IUserRepository {
  findById(id: UserId): Promise<Result<User | null>>;
  findByEmail(email: Email): Promise<Result<User | null>>;
  findByRole(role: UserRole): Promise<Result<User[]>>;
  findByStatus(status: UserStatus): Promise<Result<User[]>>;
  countByStatus(status: UserStatus): Promise<Result<number>>;
  save(user: User): Promise<Result<User>>;
  update(user: User): Promise<Result<User>>;
  delete(id: UserId): Promise<Result<void>>;
}

// Similar interfaces for Client, Partner, Specialist, Vehicle
```

---

## 🧩 Domain Services

Quando a lógica de negócio envolve múltiplas entidades ou não pertence naturalmente a uma entidade específica.

```typescript
// modules/admin/domain/services/ClientSpecialistAssignmentService.ts
export class ClientSpecialistAssignmentService {
  canAssign(client: Client, specialist: Specialist): Result<void> {
    // Business rule: Client cannot have more than 5 specialists
    if (!client.canAddMoreSpecialists()) {
      return Result.fail(new Error('Client already has maximum number of specialists'));
    }

    // Business rule: Specialist cannot have more than 20 clients
    if (specialist.getClientsCount() >= 20) {
      return Result.fail(new Error('Specialist already has maximum number of clients'));
    }

    return Result.ok();
  }
}
```

---

## 📊 Aggregate Roots

Agregados são clusters de objetos (entidades + value objects) tratados como uma unidade para modificações de dados.

### User Aggregate

```
User (Root)
  ├─ UserId (Value Object)
  ├─ PersonName (Value Object)
  ├─ Email (Value Object)
  ├─ UserRole (Enum)
  └─ UserStatus (Enum)
```

### Client Aggregate

```
Client (Root)
  ├─ ClientId (Value Object)
  ├─ PersonName (Value Object)
  ├─ Email (Value Object)
  ├─ CompanyName (Value Object)
  ├─ DocumentNumber (Value Object)
  │   └─ CPF or CNPJ
  └─ SpecialistId[] (References)
```

### Vehicle Aggregate

```
Vehicle (Root)
  ├─ VehicleId (Value Object)
  ├─ Plate (Value Object)
  ├─ ClientId (Reference to owner)
  └─ VehicleStatus (Enum)
```

---

## ✅ Business Rules Summary

| Entidade | Regra de Negócio |
|----------|------------------|
| **User** | Não pode ativar usuário suspenso diretamente |
| **User** | Email não pode ser alterado se usuário está pendente |
| **User** | Usuário só pode ser deletado se inativo ou pendente |
| **Client** | Cliente pode ter no máximo 5 especialistas |
| **Client** | Cliente deve ter no mínimo 1 especialista |
| **Partner** | Serviços devem corresponder à categoria do parceiro |
| **Partner** | Parceiro deve ter no mínimo 1 serviço ativo |
| **Vehicle** | Transições de status devem seguir fluxo específico |
| **Vehicle** | Não pode transferir propriedade durante execução |
| **Specialist** | Especialista pode ter no máximo 20 clientes |

---

## 🔗 Próximos Passos

Ver documentos:
- **04-COMPONENT-DESIGN.md**: Design dos componentes React
- **05-IMPLEMENTATION-PHASES.md**: Fases de implementação
- **diagrams/class-domain-model.mmd**: Diagrama visual do modelo
