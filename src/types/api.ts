/**
 * API Response Types
 *
 * Standard response envelopes for consistent API contracts
 */

/**
 * Meta information included in all responses
 */
export interface ApiMeta {
  request_id: string;
  timestamp: string;
  version: string;
}

/**
 * Pagination info for list responses
 */
export interface ApiPagination {
  page: number;
  per_page: number;
  total: number;
  has_more: boolean;
}

/**
 * Standard success response envelope
 */
export interface ApiSuccessResponse<T> {
  data: T;
  meta: ApiMeta;
}

/**
 * Paginated list response envelope
 */
export interface ApiPaginatedResponse<T> {
  data: T[];
  meta: ApiMeta & {
    pagination: ApiPagination;
  };
}

/**
 * Error detail structure
 */
export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  request_id: string;
}

/**
 * Standard error response envelope
 */
export interface ApiErrorResponse {
  error: ApiErrorDetail;
  meta: Omit<ApiMeta, 'request_id'>;
}

/**
 * Union type for any API response
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: unknown): response is ApiErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as ApiErrorResponse).error === 'object'
  );
}

/**
 * Type guard to check if response is successful
 */
export function isApiSuccess<T>(
  response: ApiResponse<T>,
): response is ApiSuccessResponse<T> {
  return 'data' in response && !('error' in response);
}
