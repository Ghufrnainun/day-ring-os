/**
 * API Request Logger Middleware
 *
 * Provides request_id generation and structured logging for API routes.
 * Integrates with the API response helpers from lib/api/response.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateRequestId } from './response';

export interface RequestContext {
  requestId: string;
  startTime: number;
  method: string;
  path: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Create request context for logging and tracing
 */
export function createRequestContext(req: NextRequest): RequestContext {
  return {
    requestId: generateRequestId(),
    startTime: Date.now(),
    method: req.method,
    path: req.nextUrl.pathname,
    userAgent: req.headers.get('user-agent') || undefined,
    ip:
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      undefined,
  };
}

/**
 * Log incoming request
 */
export function logRequest(
  ctx: RequestContext,
  extra?: Record<string, unknown>,
): void {
  console.log(
    JSON.stringify({
      type: 'request',
      request_id: ctx.requestId,
      method: ctx.method,
      path: ctx.path,
      timestamp: new Date().toISOString(),
      ...extra,
    }),
  );
}

/**
 * Log outgoing response
 */
export function logResponse(
  ctx: RequestContext,
  status: number,
  extra?: Record<string, unknown>,
): void {
  const duration = Date.now() - ctx.startTime;

  console.log(
    JSON.stringify({
      type: 'response',
      request_id: ctx.requestId,
      method: ctx.method,
      path: ctx.path,
      status,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      ...extra,
    }),
  );
}

/**
 * Log error
 */
export function logError(
  ctx: RequestContext,
  error: Error | unknown,
  extra?: Record<string, unknown>,
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(
    JSON.stringify({
      type: 'error',
      request_id: ctx.requestId,
      method: ctx.method,
      path: ctx.path,
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
      ...extra,
    }),
  );
}

/**
 * Wrap API handler with request logging
 */
export function withRequestLogging<T extends NextRequest>(
  handler: (req: T, ctx: RequestContext) => Promise<NextResponse>,
): (req: T) => Promise<NextResponse> {
  return async (req: T) => {
    const ctx = createRequestContext(req);

    logRequest(ctx);

    try {
      const response = await handler(req, ctx);

      logResponse(ctx, response.status);

      // Add request_id header to response
      const headers = new Headers(response.headers);
      headers.set('X-Request-ID', ctx.requestId);

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      logError(ctx, error);
      throw error;
    }
  };
}

/**
 * Audit log entry for sensitive actions
 */
export interface AuditLogEntry {
  userId: string;
  action: string;
  tableName: string;
  recordId?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  requestId: string;
  ip?: string;
}

/**
 * Log audit entry for sensitive actions
 * This should be called for finance edits, exports, settings changes
 */
export async function logAudit(
  supabase: any, // Supabase client with service role
  entry: AuditLogEntry,
): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    user_id: entry.userId,
    action: entry.action,
    table_name: entry.tableName,
    record_id: entry.recordId,
    changes: entry.changes,
    request_id: entry.requestId,
    ip_address: entry.ip,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[AUDIT] Failed to log audit entry:', {
      request_id: entry.requestId,
      error: error.message,
    });
  }
}
