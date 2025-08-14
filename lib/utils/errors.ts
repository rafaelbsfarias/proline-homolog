export class AuthError extends Error {
  constructor(m: string = 'Unauthorized') {
    super(m);
    this.name = 'AuthError';
  }
}
export class ForbiddenError extends Error {
  constructor(m: string = 'Forbidden') {
    super(m);
    this.name = 'ForbiddenError';
  }
}
export class NotFoundError extends Error {
  constructor(m: string = 'Not Found') {
    super(m);
    this.name = 'NotFoundError';
  }
}
export class DomainError extends Error {
  constructor(m: string = 'Domain Error') {
    super(m);
    this.name = 'DomainError';
  }
}
export class ConflictError extends Error {
  constructor(m: string = 'Conflict') {
    super(m);
    this.name = 'ConflictError';
  }
}
export class ValidationError extends Error {
  constructor(m: string = 'Validation Error') {
    super(m);
    this.name = 'ValidationError';
  }
}
export class DatabaseError extends Error {
  constructor(m: string = 'Database Error') {
    super(m);
    this.name = 'DatabaseError';
  }
}
export class AppError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}
