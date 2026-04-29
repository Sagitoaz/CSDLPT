export class AppError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown) {
    super(404, message, details);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, details);
    this.name = "BadRequestError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(409, message, details);
    this.name = "ConflictError";
  }
}
