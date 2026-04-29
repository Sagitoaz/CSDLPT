import { AppError } from "./app-error";

export class ForbiddenError extends AppError {
  constructor(message: string, details?: unknown) {
    super(403, message, details);
    this.name = "ForbiddenError";
  }
}
