/**
 * Entidades de domínio para o Checklist
 * Aggregate Roots e entidades que encapsulam regras de negócio
 */

import type { ChecklistStatus, ChecklistItemStatus } from '../interfaces';
import type { ContextId } from '../utils/contextNormalizer';
import { ItemKey, EvidenceKey, StoragePath, Notes, MediaType, Description } from './value-objects';

// Entidade ChecklistItem
export class ChecklistItem {
  private constructor(
    private readonly _id: string,
    private readonly _checklistId: string,
    private readonly _itemKey: ItemKey,
    private _status: ChecklistItemStatus,
    private _notes: Notes,
    private readonly _createdAt: Date
  ) {}

  static create(
    id: string,
    checklistId: string,
    itemKey: ItemKey,
    status: ChecklistItemStatus,
    notes: Notes,
    createdAt: Date
  ): ChecklistItem {
    return new ChecklistItem(id, checklistId, itemKey, status, notes, createdAt);
  }

  static createNew(
    checklistId: string,
    itemKey: ItemKey,
    status: ChecklistItemStatus,
    notes: Notes = Notes.create()
  ): ChecklistItem {
    return new ChecklistItem(crypto.randomUUID(), checklistId, itemKey, status, notes, new Date());
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get checklistId(): string {
    return this._checklistId;
  }

  get itemKey(): ItemKey {
    return this._itemKey;
  }

  get status(): ChecklistItemStatus {
    return this._status;
  }

  get notes(): Notes {
    return this._notes;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // Métodos de negócio
  updateStatus(newStatus: ChecklistItemStatus): void {
    this._status = newStatus;
  }

  updateNotes(newNotes: Notes): void {
    this._notes = newNotes;
  }

  isCompleted(): boolean {
    return this._status !== 'not_applicable';
  }

  needsAttention(): boolean {
    return this._status === 'needs_repair' || this._status === 'needs_replacement';
  }
}

// Entidade Evidence
export class Evidence {
  private constructor(
    private readonly _id: string,
    private readonly _checklistId: string,
    private readonly _evidenceKey: EvidenceKey,
    private readonly _storagePath: StoragePath,
    private readonly _mediaType: MediaType,
    private readonly _description: Description,
    private readonly _createdAt: Date
  ) {}

  static create(
    id: string,
    checklistId: string,
    evidenceKey: EvidenceKey,
    storagePath: StoragePath,
    mediaType: MediaType,
    description: Description,
    createdAt: Date
  ): Evidence {
    return new Evidence(
      id,
      checklistId,
      evidenceKey,
      storagePath,
      mediaType,
      description,
      createdAt
    );
  }

  static createNew(
    checklistId: string,
    evidenceKey: EvidenceKey,
    storagePath: StoragePath,
    mediaType: MediaType = MediaType.create(),
    description: Description = Description.create()
  ): Evidence {
    return new Evidence(
      crypto.randomUUID(),
      checklistId,
      evidenceKey,
      storagePath,
      mediaType,
      description,
      new Date()
    );
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get checklistId(): string {
    return this._checklistId;
  }

  get evidenceKey(): EvidenceKey {
    return this._evidenceKey;
  }

  get storagePath(): StoragePath {
    return this._storagePath;
  }

  get mediaType(): MediaType {
    return this._mediaType;
  }

  get description(): Description {
    return this._description;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // Métodos de negócio
  isImage(): boolean {
    return this._mediaType.isImage();
  }

  isVideo(): boolean {
    return this._mediaType.isVideo();
  }
}

// Aggregate Root Checklist
export class Checklist {
  private _items: ChecklistItem[] = [];
  private _evidences: Evidence[] = [];

  private constructor(
    private readonly _id: string,
    private readonly _vehicleId: string,
    private readonly _contextId: ContextId,
    private readonly _partnerId: string,
    private _status: ChecklistStatus,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {}

  static create(
    id: string,
    vehicleId: string,
    contextId: ContextId,
    partnerId: string,
    status: ChecklistStatus,
    createdAt: Date,
    updatedAt: Date
  ): Checklist {
    return new Checklist(id, vehicleId, contextId, partnerId, status, createdAt, updatedAt);
  }

  static createNew(vehicleId: string, contextId: ContextId, partnerId: string): Checklist {
    const now = new Date();
    return new Checklist(crypto.randomUUID(), vehicleId, contextId, partnerId, 'draft', now, now);
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get vehicleId(): string {
    return this._vehicleId;
  }

  get contextId(): ContextId {
    return this._contextId;
  }

  get partnerId(): string {
    return this._partnerId;
  }

  get status(): ChecklistStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get items(): readonly ChecklistItem[] {
    return [...this._items];
  }

  get evidences(): readonly Evidence[] {
    return [...this._evidences];
  }

  // Métodos de negócio
  addItem(item: ChecklistItem): void {
    if (this._status !== 'draft') {
      throw new Error('Cannot add items to a submitted checklist');
    }
    if (item.checklistId !== this._id) {
      throw new Error('Item does not belong to this checklist');
    }
    this._items.push(item);
    this.updateTimestamp();
  }

  addEvidence(evidence: Evidence): void {
    if (this._status !== 'draft') {
      throw new Error('Cannot add evidences to a submitted checklist');
    }
    if (evidence.checklistId !== this._id) {
      throw new Error('Evidence does not belong to this checklist');
    }
    this._evidences.push(evidence);
    this.updateTimestamp();
  }

  submit(): void {
    if (this._status !== 'draft') {
      throw new Error('Checklist is already submitted');
    }
    if (this._items.length === 0) {
      throw new Error('Cannot submit checklist without items');
    }
    this._status = 'submitted';
    this.updateTimestamp();
  }

  getItemsNeedingAttention(): ChecklistItem[] {
    return this._items.filter(item => item.needsAttention());
  }

  getCompletionPercentage(): number {
    if (this._items.length === 0) return 0;
    const completedItems = this._items.filter(item => item.isCompleted()).length;
    return Math.round((completedItems / this._items.length) * 100);
  }

  private updateTimestamp(): void {
    this._updatedAt = new Date();
  }
}
