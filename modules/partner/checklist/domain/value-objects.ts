/**
 * Value Objects para o domínio Checklist
 * Objetos imutáveis que representam conceitos de domínio
 */

// Value Object para Item Key
export class ItemKey {
  private constructor(private readonly _value: string) {}

  static create(value: string): ItemKey {
    if (!value || value.trim().length === 0) {
      throw new Error('Item key cannot be empty');
    }
    if (value.length > 100) {
      throw new Error('Item key cannot be longer than 100 characters');
    }
    return new ItemKey(value.trim());
  }

  get value(): string {
    return this._value;
  }

  equals(other: ItemKey): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

// Value Object para Evidence Key
export class EvidenceKey {
  private constructor(private readonly _value: string) {}

  static create(value: string): EvidenceKey {
    if (!value || value.trim().length === 0) {
      throw new Error('Evidence key cannot be empty');
    }
    if (value.length > 100) {
      throw new Error('Evidence key cannot be longer than 100 characters');
    }
    return new EvidenceKey(value.trim());
  }

  get value(): string {
    return this._value;
  }

  equals(other: EvidenceKey): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

// Value Object para Storage Path
export class StoragePath {
  private constructor(private readonly _value: string) {}

  static create(value: string): StoragePath {
    if (!value || value.trim().length === 0) {
      throw new Error('Storage path cannot be empty');
    }
    if (value.length > 500) {
      throw new Error('Storage path cannot be longer than 500 characters');
    }
    return new StoragePath(value.trim());
  }

  get value(): string {
    return this._value;
  }

  equals(other: StoragePath): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

// Value Object para Notes
export class Notes {
  private constructor(private readonly _value?: string) {}

  static create(value?: string): Notes {
    if (value && value.length > 1000) {
      throw new Error('Notes cannot be longer than 1000 characters');
    }
    return new Notes(value?.trim());
  }

  get value(): string | undefined {
    return this._value;
  }

  isEmpty(): boolean {
    return !this._value || this._value.length === 0;
  }

  toString(): string {
    return this._value || '';
  }
}

// Value Object para Media Type
export class MediaType {
  private constructor(private readonly _value?: string) {}

  static create(value?: string): MediaType {
    if (value && value.length > 100) {
      throw new Error('Media type cannot be longer than 100 characters');
    }
    return new MediaType(value?.trim());
  }

  get value(): string | undefined {
    return this._value;
  }

  isImage(): boolean {
    return this._value?.startsWith('image/') ?? false;
  }

  isVideo(): boolean {
    return this._value?.startsWith('video/') ?? false;
  }

  toString(): string {
    return this._value || '';
  }
}

// Value Object para Description
export class Description {
  private constructor(private readonly _value?: string) {}

  static create(value?: string): Description {
    if (value && value.length > 500) {
      throw new Error('Description cannot be longer than 500 characters');
    }
    return new Description(value?.trim());
  }

  get value(): string | undefined {
    return this._value;
  }

  isEmpty(): boolean {
    return !this._value || this._value.length === 0;
  }

  toString(): string {
    return this._value || '';
  }
}
