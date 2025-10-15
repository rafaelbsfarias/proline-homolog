/**
 * Eventos de domínio para o Checklist
 * Eventos que representam mudanças significativas no estado do domínio
 */

import type { ContextId } from '../utils/contextNormalizer';

// Evento base
export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  occurredOn: Date;
  eventVersion: number;
}

// Evento de checklist criado
export class ChecklistCreatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventType = 'ChecklistCreated';
  readonly eventVersion = 1;

  constructor(
    readonly aggregateId: string,
    readonly vehicleId: string,
    readonly contextId: ContextId,
    readonly partnerId: string,
    readonly occurredOn: Date = new Date()
  ) {
    this.eventId = crypto.randomUUID();
  }
}

// Evento de checklist submetido
export class ChecklistSubmittedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventType = 'ChecklistSubmitted';
  readonly eventVersion = 1;

  constructor(
    readonly aggregateId: string,
    readonly vehicleId: string,
    readonly contextId: ContextId,
    readonly partnerId: string,
    readonly itemsNeedingAttention: number,
    readonly occurredOn: Date = new Date()
  ) {
    this.eventId = crypto.randomUUID();
  }
}

// Evento de item adicionado ao checklist
export class ChecklistItemAddedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventType = 'ChecklistItemAdded';
  readonly eventVersion = 1;

  constructor(
    readonly aggregateId: string,
    readonly itemId: string,
    readonly itemKey: string,
    readonly status: string,
    readonly occurredOn: Date = new Date()
  ) {
    this.eventId = crypto.randomUUID();
  }
}

// Evento de evidência adicionada ao checklist
export class ChecklistEvidenceAddedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventType = 'ChecklistEvidenceAdded';
  readonly eventVersion = 1;

  constructor(
    readonly aggregateId: string,
    readonly evidenceId: string,
    readonly evidenceKey: string,
    readonly storagePath: string,
    readonly occurredOn: Date = new Date()
  ) {
    this.eventId = crypto.randomUUID();
  }
}

// Union type para todos os eventos do domínio Checklist
export type ChecklistDomainEvent =
  | ChecklistCreatedEvent
  | ChecklistSubmittedEvent
  | ChecklistItemAddedEvent
  | ChecklistEvidenceAddedEvent;
