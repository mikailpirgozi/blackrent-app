"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createForbiddenError = exports.createUnauthorizedError = exports.createValidationError = exports.createNotFoundError = exports.ApiErrorWithCode = void 0;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
/**
 * Vytvorí štandardizovanú API error response
 */
function createApiError(code, message, requestId, details) {
    return {
        code,
        message,
        details,
        requestId,
    };
}
/**
 * Mapuje error na správny HTTP status kód
 */
function getHttpStatusFromErrorCode(code) {
    switch (code) {
        case 'VALIDATION_ERROR':
            return 400;
        case 'UNAUTHORIZED':
            return 401;
        case 'FORBIDDEN':
            return 403;
        case 'NOT_FOUND':
            return 404;
        case 'INTERNAL':
        default:
            return 500;
    }
}
/**
 * Error handler middleware - zachytáva všetky chyby a vracia jednotný JSON formát
 */
function errorHandler(err, req, res, next) {
    const requestId = req.requestId || 'no-request-id';
    // Log chybu s kontextom
    (0, logger_1.log)('error', {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
    }, 'Request error occurred', {
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
    let apiError;
    // Spracuj rôzne typy chýb
    if (err instanceof ApiErrorWithCode) {
        // Custom API errors s kódom
        apiError = createApiError(err.code, err.message, requestId, err.details);
    }
    else if (err instanceof zod_1.ZodError) {
        // Zod validation errors
        apiError = createApiError('VALIDATION_ERROR', 'Validation failed', requestId, {
            validationErrors: err.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message,
                code: issue.code,
            })),
        });
    }
    else if (err.name === 'NotFoundError' || err.status === 404) {
        // Not found errors
        apiError = createApiError('NOT_FOUND', err.message || 'Resource not found', requestId);
    }
    else if (err.name === 'UnauthorizedError' || err.status === 401) {
        // Unauthorized errors
        apiError = createApiError('UNAUTHORIZED', err.message || 'Unauthorized access', requestId);
    }
    else if (err.name === 'ForbiddenError' || err.status === 403) {
        // Forbidden errors
        apiError = createApiError('FORBIDDEN', err.message || 'Access forbidden', requestId);
    }
    else {
        // Internal server errors
        apiError = createApiError('INTERNAL', process.env.NODE_ENV === 'development'
            ? err.message
            : 'Internal server error', requestId, process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined);
    }
    const httpStatus = getHttpStatusFromErrorCode(apiError.code);
    // Nastav X-Request-Id header ak ešte nie je nastavený
    if (!res.getHeader('X-Request-Id')) {
        res.setHeader('X-Request-Id', requestId);
    }
    res.status(httpStatus).json(apiError);
}
/**
 * Helper pre vytvorenie custom error s kódom
 */
class ApiErrorWithCode extends Error {
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'ApiErrorWithCode';
    }
}
exports.ApiErrorWithCode = ApiErrorWithCode;
/**
 * Helper funkcie pre časté chyby
 */
const createNotFoundError = (message, details) => new ApiErrorWithCode('NOT_FOUND', message, details);
exports.createNotFoundError = createNotFoundError;
const createValidationError = (message, details) => new ApiErrorWithCode('VALIDATION_ERROR', message, details);
exports.createValidationError = createValidationError;
const createUnauthorizedError = (message, details) => new ApiErrorWithCode('UNAUTHORIZED', message, details);
exports.createUnauthorizedError = createUnauthorizedError;
const createForbiddenError = (message, details) => new ApiErrorWithCode('FORBIDDEN', message, details);
exports.createForbiddenError = createForbiddenError;
//# sourceMappingURL=errorHandler.js.map