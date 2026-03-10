// Global error handler middleware

import type { Context } from 'hono';
import { logger } from '../utils/logger';

export async function errorHandler(err: Error, c: Context) {
  logger.error('Request error', err, {
    path: c.req.path,
    method: c.req.method,
  });

  const status = (err as any).status || 500;
  const message = err.message || 'Internal server error';

  return c.json(
    {
      success: false,
      error: message,
    },
    status
  );
}
