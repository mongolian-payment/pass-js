import type { BaseError } from "./types.js";

export class PassError extends Error {
  public readonly code?: string;
  public readonly level?: string;
  public readonly body?: string;
  public readonly statusCode?: number;
  public readonly response?: unknown;

  constructor(
    message: string,
    options?: {
      baseError?: BaseError;
      statusCode?: number;
      response?: unknown;
    }
  ) {
    super(message);
    this.name = "PassError";
    this.code = options?.baseError?.code;
    this.level = options?.baseError?.level;
    this.body = options?.baseError?.body;
    this.statusCode = options?.statusCode;
    this.response = options?.response;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
