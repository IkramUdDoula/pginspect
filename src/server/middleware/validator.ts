// Request validation middleware

import type { Context, Next } from 'hono';
import { validateConnectionString } from '../utils/security';

export async function validateConnectionRequest(c: Context, next: Next) {
  const body = await c.req.json();

  if (!body.connectionString) {
    return c.json({ success: false, error: 'Connection string is required' }, 400);
  }

  const validation = validateConnectionString(body.connectionString);
  if (!validation.valid) {
    return c.json({ success: false, error: validation.reason }, 400);
  }

  await next();
}

export async function validateQueryRequest(c: Context, next: Next) {
  const body = await c.req.json();

  if (!body.connectionId) {
    return c.json({ success: false, error: 'Connection ID is required' }, 400);
  }

  if (!body.sql) {
    return c.json({ success: false, error: 'SQL query is required' }, 400);
  }

  await next();
}
