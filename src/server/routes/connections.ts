// Connection management routes

import { Hono } from 'hono';
import { testConnection, createConnection, closeConnection } from '../services/db';
import { parseConnectionString } from '../../lib/connectionParser.ts';
import { validateConnectionRequest } from '../middleware/validator';
import { authMiddleware, getAuth } from '../middleware/auth';
import { saveUserConnection, getUserConnections, deleteUserConnection } from '../services/userConnections';
import { logger } from '../utils/logger';
import { logAudit } from '../middleware/audit';
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
  const startTime = Date.now();
  
  try {
    const { connectionString } = await c.req.json();
    const parsed = parseConnectionString(connectionString);

    if (parsed.error) {
      await logAudit(c, {
        actionType: 'connection_test_failed',
        actionCategory: 'connection',
        actionDescription: `Connection test failed: ${parsed.error}`,
        status: 'error',
        errorMessage: parsed.error,
        databaseName: parsed.database,
        executionTimeMs: Date.now() - startTime,
        metadata: { host: parsed.host, port: parsed.port },
      });
      
      return c.json({ success: false, error: parsed.error }, 400);
    }

    const result = await testConnection(parsed);

    if (result.success) {
      await logAudit(c, {
        actionType: 'connection_test_success',
        actionCategory: 'connection',
        actionDescription: `Connection test successful to ${parsed.host}:${parsed.port}/${parsed.database}`,
        status: 'success',
        databaseName: parsed.database,
        executionTimeMs: Date.now() - startTime,
        metadata: { 
          host: parsed.host, 
          port: parsed.port,
          serverVersion: result.serverVersion,
        },
      });
    } else {
      await logAudit(c, {
        actionType: 'connection_test_failed',
        actionCategory: 'connection',
        actionDescription: `Connection test failed: ${result.error}`,
        status: 'error',
        errorMessage: result.error,
        databaseName: parsed.database,
        executionTimeMs: Date.now() - startTime,
        metadata: { host: parsed.host, port: parsed.port },
      });
    }

    return c.json({
      success: result.success,
      data: result.success ? { serverVersion: result.serverVersion } : undefined,
      error: result.error,
    });
  } catch (error) {
    logger.error('Connection test failed', error);
    
    await logAudit(c, {
      actionType: 'connection_test_failed',
      actionCategory: 'connection',
      actionDescription: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Connection test failed',
      executionTimeMs: Date.now() - startTime,
    });
    
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
  const startTime = Date.now();
  
  try {
    const auth = getAuth(c);
    const { name, connectionString } = await c.req.json();

    if (!name) {
      return c.json({ success: false, error: 'Connection name is required' }, 400);
    }

    const parsed = parseConnectionString(connectionString);

    if (parsed.error) {
      await logAudit(c, {
        actionType: 'connection_create_failed',
        actionCategory: 'connection',
        actionDescription: `Connection creation failed: ${parsed.error}`,
        status: 'error',
        errorMessage: parsed.error,
        connectionName: name,
        executionTimeMs: Date.now() - startTime,
      });
      
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

    await logAudit(c, {
      actionType: 'connection_create',
      actionCategory: 'connection',
      actionDescription: `Created connection "${name}" to ${parsed.host}:${parsed.port}/${parsed.database}`,
      status: 'success',
      connectionId: savedConnection.id,
      connectionName: name,
      databaseName: parsed.database,
      executionTimeMs: Date.now() - startTime,
      metadata: {
        host: parsed.host,
        port: parsed.port,
        schemasCount: schemas.length,
      },
    });

    return c.json({
      success: true,
      data: {
        connectionId: id,
        savedConnectionId: savedConnection.id,
        schemas,
      },
    });
  } catch (error) {
    logger.error('Connection creation failed', error);
    
    await logAudit(c, {
      actionType: 'connection_create_failed',
      actionCategory: 'connection',
      actionDescription: `Connection creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Connection failed',
      executionTimeMs: Date.now() - startTime,
    });
    
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
  const startTime = Date.now();
  
  try {
    const auth = getAuth(c);
    const name = c.req.param('name');
    
    const deleted = await deleteUserConnection(auth.userId, name);

    if (!deleted) {
      await logAudit(c, {
        actionType: 'connection_delete_failed',
        actionCategory: 'connection',
        actionDescription: `Connection deletion failed: Connection "${name}" not found`,
        status: 'error',
        errorMessage: 'Connection not found',
        connectionName: name,
        executionTimeMs: Date.now() - startTime,
      });
      
      return c.json({
        success: false,
        error: 'Connection not found',
      }, 404);
    }

    await logAudit(c, {
      actionType: 'connection_delete',
      actionCategory: 'connection',
      actionDescription: `Deleted connection "${name}"`,
      status: 'success',
      connectionName: name,
      executionTimeMs: Date.now() - startTime,
    });

    return c.json({
      success: true,
      message: 'Connection deleted',
    });
  } catch (error) {
    logger.error('Connection deletion failed', error);
    
    await logAudit(c, {
      actionType: 'connection_delete_failed',
      actionCategory: 'connection',
      actionDescription: `Connection deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Failed to delete connection',
      executionTimeMs: Date.now() - startTime,
    });
    
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete connection',
      },
      500
    );
  }
});

// Get connection statistics
connections.get('/:id/stats', async (c) => {
  try {
    const auth = getAuth(c);
    const connectionId = c.req.param('id');
    
    logger.info('Fetching connection stats', { userId: auth.userId, connectionId });
    
    // Get the active connection
    const { getConnection } = await import('../services/db');
    const sql = getConnection(connectionId);
    
    if (!sql) {
      return c.json({
        success: false,
        error: 'Connection not found',
      }, 404);
    }

    // Get all schemas
    const schemasResult = await sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name
    `;
    const schemas = schemasResult.map(row => row.schema_name as string);

    // Get aggregate stats across all schemas
    let totalTables = 0;
    let totalRows = 0;
    let totalSize = 0;

    for (const schema of schemas) {
      const tablesResult = await sql`
        SELECT 
          COUNT(*) as table_count,
          COALESCE(SUM(s.n_live_tup), 0) as total_rows,
          COALESCE(SUM(pg_total_relation_size(quote_ident(t.table_schema)||'.'||quote_ident(t.table_name))), 0) as total_size
        FROM information_schema.tables t
        LEFT JOIN pg_stat_user_tables s ON s.schemaname = t.table_schema AND s.relname = t.table_name
        WHERE t.table_schema = ${schema}
          AND t.table_type = 'BASE TABLE'
      `;

      if (tablesResult.length > 0) {
        totalTables += Number(tablesResult[0].table_count) || 0;
        totalRows += Number(tablesResult[0].total_rows) || 0;
        totalSize += Number(tablesResult[0].total_size) || 0;
      }
    }

    return c.json({
      success: true,
      data: {
        schemas: schemas.length,
        tables: totalTables,
        rows: totalRows,
        sizeBytes: totalSize,
      },
    });
  } catch (error) {
    logger.error('Failed to get connection stats', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats',
      },
      500
    );
  }
});

// Close active connection
connections.delete('/:id', async (c) => {
  const startTime = Date.now();
  
  try {
    const id = c.req.param('id');
    await closeConnection(id);

    await logAudit(c, {
      actionType: 'connection_close',
      actionCategory: 'connection',
      actionDescription: `Closed connection ${id}`,
      status: 'success',
      executionTimeMs: Date.now() - startTime,
      metadata: { connectionId: id },
    });

    return c.json({
      success: true,
      message: 'Connection closed',
    });
  } catch (error) {
    logger.error('Connection close failed', error);
    
    await logAudit(c, {
      actionType: 'connection_close_failed',
      actionCategory: 'connection',
      actionDescription: `Connection close failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Failed to close connection',
      executionTimeMs: Date.now() - startTime,
    });
    
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