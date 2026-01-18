/**
 * API Response Helpers
 *
 * Standardized response functions for consistent API contracts
 */

import type {
  ApiSuccessResponse,
  ApiPaginatedResponse,
  ApiErrorResponse,
  ApiPagination,
} from '@/types/api';
import {
  ERROR_CODES,
  ERROR_MESSAGES,
  ERROR_STATUS_CODES,
  type ErrorCode,
} from './errors';

const API_VERSION = 'v1';

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

/**
 * Create API meta object
 */
function createMeta(requestId?: string) {
  return {
    request_id: requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
    version: API_VERSION,
  };
}

/**
 * Create a successful API response
 */
export function apiSuccess<T>(
  data: T,
  options?: {
    status?: number;
    requestId?: string;
  },
): Response {
  const response: ApiSuccessResponse<T> = {
    data,
    meta: createMeta(options?.requestId),
  };

  return Response.json(response, {
    status: options?.status || 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': response.meta.request_id,
    },
  });
}

/**
 * Create a paginated API response
 */
export function apiPaginated<T>(
  data: T[],
  pagination: Omit<ApiPagination, 'has_more'>,
  options?: {
    requestId?: string;
  },
): Response {
  const meta = createMeta(options?.requestId);

  const response: ApiPaginatedResponse<T> = {
    data,
    meta: {
      ...meta,
      pagination: {
        ...pagination,
        has_more: pagination.page * pagination.per_page < pagination.total,
      },
    },
  };

  return Response.json(response, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': meta.request_id,
    },
  });
}

/**
 * Create an error API response
 * Uses predefined error codes and messages for consistency
 */
export function apiError(
  code: ErrorCode,
  options?: {
    message?: string; // Override default message
    details?: Record<string, unknown>;
    status?: number; // Override default status
    requestId?: string;
  },
): Response {
  const requestId = options?.requestId || generateRequestId();
  const message = options?.message || ERROR_MESSAGES[code];
  const status = options?.status || ERROR_STATUS_CODES[code];

  const response: ApiErrorResponse = {
    error: {
      code: ERROR_CODES[code],
      message,
      details: options?.details,
      request_id: requestId,
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: API_VERSION,
    },
  };

  return Response.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
    },
  });
}

/**
 * Create a validation error with field-specific details
 */
export function apiValidationError(
  fields: Record<string, string>,
  options?: {
    requestId?: string;
  },
): Response {
  return apiError('VALIDATION_REQUIRED_FIELD', {
    message: 'Please check the following fields.',
    details: { fields },
    requestId: options?.requestId,
  });
}

/**
 * Create a 204 No Content response (for successful DELETE)
 */
export function apiNoContent(requestId?: string): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'X-Request-ID': requestId || generateRequestId(),
    },
  });
}

/**
 * Wrap async handler with error catching
 */
export function withErrorHandling(
  handler: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const requestId = generateRequestId();

    try {
      return await handler(req);
    } catch (error) {
      console.error(`[${requestId}] Unhandled error:`, error);

      // Handle known error types
      if (error instanceof Error) {
        // Postgres errors
        if ('code' in error) {
          const pgError = error as Error & { code: string };

          if (pgError.code === '23505') {
            return apiError('RESOURCE_ALREADY_EXISTS', { requestId });
          }
          if (pgError.code === '23503') {
            return apiError('RESOURCE_NOT_FOUND', { requestId });
          }
          if (pgError.code === '42501') {
            return apiError('AUTH_INSUFFICIENT_PERMISSIONS', { requestId });
          }
        }
      }

      // Default to internal error
      return apiError('SYSTEM_INTERNAL_ERROR', { requestId });
    }
  };
}

// Re-export error codes for convenience
export { ERROR_CODES, ERROR_MESSAGES, type ErrorCode } from './errors';
