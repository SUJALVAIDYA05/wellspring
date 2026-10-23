import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request input", details?: unknown) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, "NOT_FOUND", message);
  }
}

export class SlotConflictError extends AppError {
  constructor(
    message = "This time is no longer available. Please choose another slot."
  ) {
    super(409, "DOCTOR_SLOT_UNAVAILABLE", message);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please try again later.") {
    super(429, "RATE_LIMITED", message);
  }
}

export function formatErrorResponse(error: unknown) {
  // Let Next.js internal prerender / navigation bailouts pass through
  if (
    error &&
    typeof error === "object" &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    ((error as { digest: string }).digest.startsWith("NEXT_") ||
      (error as { digest: string }).digest.startsWith("DYNAMIC_SERVER_USAGE"))
  ) {
    throw error;
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    const formattedErrors = error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: formattedErrors,
        },
      },
      { status: 400 }
    );
  }

  // Check for PostgreSQL exclusion constraint violation (code 23P01)
  if (
    error &&
    typeof error === "object" &&
    ("code" in error || "message" in error)
  ) {
    const err = error as { code?: string; message?: string };
    if (
      err.code === "23P01" ||
      (typeof err.message === "string" &&
        err.message.includes("no_overlapping_blocking_appointments"))
    ) {
      return NextResponse.json(
        {
          error: {
            code: "DOCTOR_SLOT_UNAVAILABLE",
            message:
              "This time is no longer available. Please choose another slot.",
          },
        },
        { status: 409 }
      );
    }
  }

  // Unhandled / Internal Server Error: Redact internal details in production
  console.error("Unhandled API error:", error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      },
    },
    { status: 500 }
  );
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
