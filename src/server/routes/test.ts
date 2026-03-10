// Test routes for debugging (no auth required)

import { Hono } from 'hono';
import { testConnection } from '../services/db';
import { parseConnectionString } from '../../lib/connectionParser';
import { logger } from '../utils/logger';

const test = new Hono();

// Test connection without auth (for debugging only)
test.post('/connection', async (c) => {
  try {
    const { connectionString } = await c.req.json();
    
    logger.info('Testing connection (no auth)', { 
      connectionString: connectionString.replace(/:[^:@]*@/, ':***@') 
    });
    
    const parsed = parseConnectionString(connectionString);

    if (parsed.error) {
      logger.error('Connection string parsing failed', { error: parsed.error });
      return c.json({ success: false, error: parsed.error }, 400);
    }

    logger.info('Parsed connection info', {
      host: parsed.host,
      port: parsed.port,
      database: parsed.database,
      user: parsed.user,
      sslMode: parsed.sslMode
    });

    const result = await testConnection(parsed);

    logger.info('Connection test result', { 
      success: result.success, 
      error: result.error,
      serverVersion: result.serverVersion 
    });

    return c.json({
      success: result.success,
      data: result.success ? { serverVersion: result.serverVersion } : undefined,
      error: result.error,
    });
  } catch (error) {
    logger.error('Connection test failed with exception', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      },
      500
    );
  }
});

// Health check
test.get('/health', async (c) => {
  return c.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Test endpoint is working'
  });
});

export default test;