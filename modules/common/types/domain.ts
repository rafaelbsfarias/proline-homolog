// ========================================================================================
// DOMAIN TYPES - ENTIDADES E VALUE OBJECTS COMPARTILHADOS
// ========================================================================================
// Seguindo Clean Architecture e Object Calisthenics - Domain Layer
// ========================================================================================

/**
 * Base Entity Interface
 * Todas as entidades devem implementar esta interface
 */
export interface Entity {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Value Object Interface
 * Objetos de valor devem ser imutáveis e comparáveis por valor
 */
export interface ValueObject<T> {
  readonly value: T;
  equals(other: ValueObject<T>): boolean;
}

/**
 * Repository Pattern Interface
 * Abstração para acesso a dados
 */
export interface Repository<T extends Entity> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

/**
 * Use Case Interface
 * Casos de uso devem implementar esta interface
 */
export interface UseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<Result<TResponse>>;
}

/**
 * Service Interface
 * Serviços de domínio
 */
export interface DomainService {
  readonly name: string;
}

/**
 * Event Interface
 * Eventos de domínio
 */
export interface DomainEvent {
  readonly eventName: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
}

/**
 * Command Interface
 * Comandos do sistema
 */
export interface Command {
  readonly commandName: string;
  readonly timestamp: Date;
}

/**
 * Query Interface
 * Consultas do sistema
 */
export interface Query {
  readonly queryName: string;
  readonly parameters: Record<string, unknown>;
}

/**
 * Result Pattern
 * Para tratamento de erros funcionais
 */
export type Result<T, E = Error> =
  | {
      readonly success: true;
      readonly data: T;
    }
  | {
      readonly success: false;
      readonly error: E;
    };

/**
 * Helper para criar Result success
 */
export function createSuccess<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Helper para criar Result error
 */
export function createError<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Aggregation Root
 * Raiz de agregação no DDD
 */
export interface AggregateRoot extends Entity {
  readonly version: number;
  readonly domainEvents: DomainEvent[];
}
