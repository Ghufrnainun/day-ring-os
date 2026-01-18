/**
 * API Error Codes
 *
 * Format: CATEGORY_SPECIFIC_REASON
 * Used for machine-readable error identification
 */

export const ERROR_CODES = {
  // Authentication & Authorization
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_SESSION_REQUIRED: 'AUTH_SESSION_REQUIRED',

  // Validation
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE: 'VALIDATION_OUT_OF_RANGE',
  VALIDATION_INVALID_TYPE: 'VALIDATION_INVALID_TYPE',
  VALIDATION_CONSTRAINT_VIOLATED: 'VALIDATION_CONSTRAINT_VIOLATED',

  // Resource
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_DELETED: 'RESOURCE_DELETED',

  // Business Logic
  BUSINESS_INSUFFICIENT_BALANCE: 'BUSINESS_INSUFFICIENT_BALANCE',
  BUSINESS_DAILY_LIMIT_EXCEEDED: 'BUSINESS_DAILY_LIMIT_EXCEEDED',
  BUSINESS_INVALID_STATE: 'BUSINESS_INVALID_STATE',
  BUSINESS_OPERATION_NOT_ALLOWED: 'BUSINESS_OPERATION_NOT_ALLOWED',
  BUSINESS_IDEMPOTENCY_CONFLICT: 'BUSINESS_IDEMPOTENCY_CONFLICT',

  // System
  SYSTEM_INTERNAL_ERROR: 'SYSTEM_INTERNAL_ERROR',
  SYSTEM_DATABASE_ERROR: 'SYSTEM_DATABASE_ERROR',
  SYSTEM_EXTERNAL_SERVICE_ERROR: 'SYSTEM_EXTERNAL_SERVICE_ERROR',
  SYSTEM_RATE_LIMITED: 'SYSTEM_RATE_LIMITED',
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

/**
 * User-friendly error messages
 * Follows emotional safety principles: honest, calm, brief
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Auth
  AUTH_UNAUTHORIZED: 'Please sign in to continue.',
  AUTH_TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',
  AUTH_TOKEN_INVALID: 'Your session is invalid. Please sign in again.',
  AUTH_INSUFFICIENT_PERMISSIONS: "You don't have permission for this action.",
  AUTH_SESSION_REQUIRED: 'Please sign in to access this feature.',

  // Validation
  VALIDATION_REQUIRED_FIELD: 'This field is required.',
  VALIDATION_INVALID_FORMAT: 'Please check the format and try again.',
  VALIDATION_OUT_OF_RANGE: 'The value is outside the allowed range.',
  VALIDATION_INVALID_TYPE: 'Please provide a valid value.',
  VALIDATION_CONSTRAINT_VIOLATED: 'This value does not meet the requirements.',

  // Resource
  RESOURCE_NOT_FOUND: 'We could not find what you are looking for.',
  RESOURCE_ALREADY_EXISTS: 'This item already exists.',
  RESOURCE_CONFLICT:
    'This conflicts with existing data. Please refresh and try again.',
  RESOURCE_DELETED: 'This item has been deleted.',

  // Business
  BUSINESS_INSUFFICIENT_BALANCE:
    'This would overdraft your account. Consider adjusting the amount.',
  BUSINESS_DAILY_LIMIT_EXCEEDED:
    "You've reached your daily limit. Try again tomorrow.",
  BUSINESS_INVALID_STATE: 'This action cannot be performed right now.',
  BUSINESS_OPERATION_NOT_ALLOWED: 'This operation is not allowed.',
  BUSINESS_IDEMPOTENCY_CONFLICT: 'This request was already processed.',

  // System
  SYSTEM_INTERNAL_ERROR: 'Something went wrong. Please try again in a moment.',
  SYSTEM_DATABASE_ERROR:
    "We're experiencing technical difficulties. Please try again.",
  SYSTEM_EXTERNAL_SERVICE_ERROR:
    'A service we depend on is temporarily unavailable.',
  SYSTEM_RATE_LIMITED: "You're doing that too often. Please wait a moment.",
  SYSTEM_MAINTENANCE: "We're performing maintenance. Please try again shortly.",
};

/**
 * HTTP status code mapping for error codes
 */
export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  // Auth - 401/403
  AUTH_UNAUTHORIZED: 401,
  AUTH_TOKEN_EXPIRED: 401,
  AUTH_TOKEN_INVALID: 401,
  AUTH_INSUFFICIENT_PERMISSIONS: 403,
  AUTH_SESSION_REQUIRED: 401,

  // Validation - 400
  VALIDATION_REQUIRED_FIELD: 400,
  VALIDATION_INVALID_FORMAT: 400,
  VALIDATION_OUT_OF_RANGE: 400,
  VALIDATION_INVALID_TYPE: 400,
  VALIDATION_CONSTRAINT_VIOLATED: 400,

  // Resource - 404/409
  RESOURCE_NOT_FOUND: 404,
  RESOURCE_ALREADY_EXISTS: 409,
  RESOURCE_CONFLICT: 409,
  RESOURCE_DELETED: 410,

  // Business - 422
  BUSINESS_INSUFFICIENT_BALANCE: 422,
  BUSINESS_DAILY_LIMIT_EXCEEDED: 422,
  BUSINESS_INVALID_STATE: 422,
  BUSINESS_OPERATION_NOT_ALLOWED: 422,
  BUSINESS_IDEMPOTENCY_CONFLICT: 409,

  // System - 500/503/429
  SYSTEM_INTERNAL_ERROR: 500,
  SYSTEM_DATABASE_ERROR: 500,
  SYSTEM_EXTERNAL_SERVICE_ERROR: 503,
  SYSTEM_RATE_LIMITED: 429,
  SYSTEM_MAINTENANCE: 503,
};
