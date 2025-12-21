import { FastifyReply } from 'fastify';
import { ZodError } from 'zod';

/**
 * Standard API Error class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, code?: string): ApiError {
    return new ApiError(400, message, code || 'BAD_REQUEST');
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message, 'CONFLICT');
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, message, 'INTERNAL_ERROR');
  }
}

/**
 * Format Zod validation errors into a readable format
 */
export function formatZodError(error: ZodError): string {
  const errors = error.errors.map((e) => {
    const path = e.path.join('.');
    return path ? `${path}: ${e.message}` : e.message;
  });
  return errors.join(', ');
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Handle errors and send appropriate response
 */
export function handleError(
  error: unknown,
  reply: FastifyReply,
  logger?: { error: (obj: unknown) => void }
): FastifyReply {
  // Log the error if logger is provided
  if (logger) {
    logger.error(error);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: formatZodError(error),
      code: 'VALIDATION_ERROR',
    } as ErrorResponse);
  }

  // Handle our custom API errors
  if (error instanceof ApiError) {
    return reply.code(error.statusCode).send({
      error: error.message,
      code: error.code,
    } as ErrorResponse);
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; message?: string; meta?: { target?: string[] } };

    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        const field = prismaError.meta?.target?.[0] || 'field';
        return reply.code(409).send({
          error: `A record with this ${field} already exists`,
          code: 'DUPLICATE_ENTRY',
        } as ErrorResponse);

      case 'P2025': // Record not found
        return reply.code(404).send({
          error: 'Record not found',
          code: 'NOT_FOUND',
        } as ErrorResponse);

      case 'P2003': // Foreign key constraint violation
        return reply.code(400).send({
          error: 'Related record not found',
          code: 'FOREIGN_KEY_ERROR',
        } as ErrorResponse);
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return reply.code(500).send({
      error: error.message || 'Internal server error',
      code: 'INTERNAL_ERROR',
    } as ErrorResponse);
  }

  // Handle unknown errors
  return reply.code(500).send({
    error: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  } as ErrorResponse);
}

/**
 * Wrapper for async route handlers with automatic error handling
 */
export function asyncHandler<T>(
  fn: (request: T, reply: FastifyReply) => Promise<unknown>,
  logger?: { error: (obj: unknown) => void }
) {
  return async (request: T, reply: FastifyReply) => {
    try {
      return await fn(request, reply);
    } catch (error) {
      return handleError(error, reply, logger);
    }
  };
}
