export class ApiError extends Error {
  readonly status: number;

  readonly details?: unknown;

  readonly code?: string;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.code =
      details &&
      typeof details === "object" &&
      "code" in details &&
      typeof details.code === "string"
        ? details.code
        : undefined;
  }
}

export const isUnauthorizedError = (error: unknown) =>
  error instanceof ApiError && error.status === 401;
