// Audit middleware for automatic logging

import { Context, Next } from 'hono';
import { AuditService } from '../services/auditService';
import { logger } from '../utils/logger';
import type { CreateAuditLogRequest } from '../../shared/types';

/**
 * Helper to create audit context from request
 */
export async function createAuditContext(c: Context) {
  const auth = c.get('auth');
  
  if (!auth) {
    return null;
  }

  // Get user details from database
  let userEmail = 'unknown';
  let userName: string | null = null;
  
  try {
    const { getAppDb } = await import('../services/supabaseDb');
    const db = getAppDb();
    const result = await db`
      SELECT email, name FROM users WHERE id = ${auth.userId} LIMIT 1
    `;
    
    if (result.length > 0) {
      userEmail = result[0].email || 'unknown';
      userName = result[0].name || null;
    }
  } catch (error) {
    // Silently fail - we'll use 'unknown' as fallback
    logger.debug('Could not fetch user details for audit log', { userId: auth.userId });
  }

  // Extract IP address
  const ipAddress = 
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    c.req.header('x-real-ip') ||
    'unknown';

  // Extract user agent
  const userAgent = c.req.header('user-agent') || 'unknown';

  // Generate request ID
  const requestId = c.req.header('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    userId: auth.userId,
    userEmail,
    userName,
    ipAddress,
    userAgent,
    requestId,
  };
}

/**
 * Helper to log audit entry
 */
export async function logAudit(
  c: Context,
  request: CreateAuditLogRequest
): Promise<void> {
  const context = await createAuditContext(c);
  
  if (!context) {
    logger.warn('Cannot create audit log: no user context');
    return;
  }

  await AuditService.createLog(context, request);
}

/**
 * Middleware to automatically log certain operations
 * This is optional - most logging will be done explicitly in route handlers
 */
export async function auditMiddleware(c: Context, next: Next) {
  const startTime = Date.now();
  
  // Continue with request
  await next();
  
  const executionTime = Date.now() - startTime;
  const user = c.get('user');
  
  // Only log authenticated requests
  if (!user) {
    return;
  }

  const method = c.req.method;
  const path = c.req.path;
  const status = c.res.status;

  // Log specific operations based on path and method
  // This is a basic implementation - most logging should be done in route handlers
  // where we have more context about the operation
  
  // Skip health checks and static assets
  if (path === '/api/health' || !path.startsWith('/api/')) {
    return;
  }

  // Log errors
  if (status >= 400) {
    const context = await createAuditContext(c);
    if (context) {
      await AuditService.createLog(context, {
        actionType: 'api_error',
        actionCategory: 'system',
        actionDescription: `API error: ${method} ${path}`,
        status: 'error',
        errorMessage: `HTTP ${status}`,
        executionTimeMs: executionTime,
        metadata: {
          method,
          path,
          statusCode: status,
        },
      });
    }
  }
}
