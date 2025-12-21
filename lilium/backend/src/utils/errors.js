"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
exports.formatZodError = formatZodError;
exports.handleError = handleError;
exports.asyncHandler = asyncHandler;
const zod_1 = require("zod");
/**
 * Standard API Error class
 */
class ApiError extends Error {
    constructor(statusCode, message, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'ApiError';
    }
    static badRequest(message, code) {
        return new ApiError(400, message, code || 'BAD_REQUEST');
    }
    static unauthorized(message = 'Unauthorized') {
        return new ApiError(401, message, 'UNAUTHORIZED');
    }
    static forbidden(message = 'Forbidden') {
        return new ApiError(403, message, 'FORBIDDEN');
    }
    static notFound(message = 'Resource not found') {
        return new ApiError(404, message, 'NOT_FOUND');
    }
    static conflict(message) {
        return new ApiError(409, message, 'CONFLICT');
    }
    static internal(message = 'Internal server error') {
        return new ApiError(500, message, 'INTERNAL_ERROR');
    }
}
exports.ApiError = ApiError;
/**
 * Format Zod validation errors into a readable format
 */
function formatZodError(error) {
    const errors = error.errors.map((e) => {
        const path = e.path.join('.');
        return path ? `${path}: ${e.message}` : e.message;
    });
    return errors.join(', ');
}
/**
 * Handle errors and send appropriate response
 */
function handleError(error, reply, logger) {
    // Log the error if logger is provided
    if (logger) {
        logger.error(error);
    }
    // Handle Zod validation errors
    if (error instanceof zod_1.ZodError) {
        return reply.code(400).send({
            error: formatZodError(error),
            code: 'VALIDATION_ERROR',
        });
    }
    // Handle our custom API errors
    if (error instanceof ApiError) {
        return reply.code(error.statusCode).send({
            error: error.message,
            code: error.code,
        });
    }
    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error;
        switch (prismaError.code) {
            case 'P2002': // Unique constraint violation
                const field = prismaError.meta?.target?.[0] || 'field';
                return reply.code(409).send({
                    error: `A record with this ${field} already exists`,
                    code: 'DUPLICATE_ENTRY',
                });
            case 'P2025': // Record not found
                return reply.code(404).send({
                    error: 'Record not found',
                    code: 'NOT_FOUND',
                });
            case 'P2003': // Foreign key constraint violation
                return reply.code(400).send({
                    error: 'Related record not found',
                    code: 'FOREIGN_KEY_ERROR',
                });
        }
    }
    // Handle standard Error objects
    if (error instanceof Error) {
        return reply.code(500).send({
            error: error.message || 'Internal server error',
            code: 'INTERNAL_ERROR',
        });
    }
    // Handle unknown errors
    return reply.code(500).send({
        error: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
    });
}
/**
 * Wrapper for async route handlers with automatic error handling
 */
function asyncHandler(fn, logger) {
    return async (request, reply) => {
        try {
            return await fn(request, reply);
        }
        catch (error) {
            return handleError(error, reply, logger);
        }
    };
}
//# sourceMappingURL=errors.js.map