// Connection management routes

import { Hono } from 'hono';
import { testConnection, createConnection, closeConnection } from '../services/db';
import { parseConnectionString } from '../../lib/connectionParser.ts';
import { validateConnectionRequest } from '../middleware/validator';
import { authMiddleware, getAuth } from '../middleware/auth';
import { saveUserConnection, getUserConnections, deleteUserConnection } from '../services/userConnections';
import { logger } from '../utils/logger';
import type { ConnectionInfo } from '../../shared/types';

const connections = new Hono();

// Apply auth middleware to all routes
connections.use('*', authMiddleware);

// Get user's saved connections
connections.get('/', async (c) => {
  try {
    const auth = getAuth(c);
    logger.info('Fetching saved connections', { userId: auth.userId });
    
    const userConnections = await getUserConnections(auth.userId);
    
    logger.info('Saved connections fetched', { userId: auth.userId, count: userConnections.length });

    return c.json({
      success: true,
      data: { connections: userConnections },
    });
  } catch (error) {
    logger.error('Failed to get user connections', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get connections',
      },
      500
    );
  }
});

// Test connection
connections.post('/test', validateConnectionRequest, async (c) => {
  try {
    const { connectionString } = await c.req.json();
    const parsed = parseConnectionString(connectionString);

    if (parsed.error) {
      return c.json({ success: false, error: parsed.error }, 400);
    }

    const result = await testConnection(parsed);

    return c.json({
      success: result.success,
      data: result.success ? { serverVersion: result.serverVersion } : undefined,
      error: result.error,
    });
  } catch (error) {
    logger.error('Connection test failed', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      },
      500
    );
  }
});

// Create connection
connections.post('/connect', validateConnectionRequest, async (c) => {
  try {
    const auth = getAuth(c);
    const { name, connectionString } = await c.req.json();

    if (!name) {
      return c.json({ success: false, error: 'Connection name is required' }, 400);
    }

    const parsed = parseConnectionString(connectionString);

    if (parsed.error) {
      return c.json({ success: false, error: parsed.error }, 400);
    }

    const connectionInfo: ConnectionInfo = {
      name,
      ...parsed,
    };

    // Save connection to database first
    const savedConnection = await saveUserConnection(auth.userId, connectionInfo);

    const { id, sql } = await createConnection(connectionInfo);

    // Get available schemas
    const schemasResult = await sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name
    `;

    const schemas = schemasResult.map(row => row.schema_name as string);

    return c.json({
      success: true,
      data: {
        connectionId: id,
        savedConnectionId: savedConnection.id, // Add the saved connection ID
        schemas,
      },
    });
  } catch (error) {
    logger.error('Connection creation failed', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      },
      500
    );
  }
});

// Delete saved connection
connections.delete('/saved/:name', async (c) => {
  try {
    const auth = getAuth(c);
    const name = c.req.param('name');
    
    const deleted = await deleteUserConnection(auth.userId, name);

    if (!deleted) {
      return c.json({
        success: false,
        error: 'Connection not found',
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Connection deleted',
    });
  } catch (error) {
    logger.error('Connection deletion failed', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete connection',
      },
      500
    );
  }
});

// Close active connection
connections.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await closeConnection(id);

    return c.json({
      success: true,
      message: 'Connection closed',
    });
  } catch (error) {
    logger.error('Connection close failed', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to close connection',
      },
      500
    );
  }
});

export default connections;
