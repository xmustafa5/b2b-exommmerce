import { FastifyReply } from 'fastify';
import { ZodError } from 'zod';
/**
 * Standard API Error class
 */
export declare class ApiError extends Error {
    statusCode: number;
    code?: string;
    constructor(statusCode: number, message: string, code?: string);
    static badRequest(message: string, code?: string): ApiError;
    static unauthorized(message?: string): ApiError;
    static forbidden(message?: string): ApiError;
    static notFound(message?: string): ApiError;
    static conflict(message: string): ApiError;
    static internal(message?: string): ApiError;
}
/**
 * Format Zod validation errors into a readable format
 */
export declare function formatZodError(error: ZodError): string;
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
export declare function handleError(error: unknown, reply: FastifyReply, logger?: {
    error: (obj: unknown) => void;
}): FastifyReply;
/**
 * Wrapper for async route handlers with automatic error handling
 */
export declare function asyncHandler<T>(fn: (request: T, reply: FastifyReply) => Promise<unknown>, logger?: {
    error: (obj: unknown) => void;
}): (request: T, reply: FastifyReply) => Promise<unknown>;
//# sourceMappingURL=errors.d.ts.map