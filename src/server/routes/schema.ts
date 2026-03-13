// Schema inspection routes

import { Hono } from 'hono';
import { getConnection } from '../services/db';
import { getSchemas, getTables, getTableDetails } from '../services/schemaInspector';
import { authMiddleware } from '../middleware/auth';
import { logAudit } from '../middleware/audit';
import { logger } from '../utils/logger';

const schema = new Hono();

// Apply auth middleware to all routes
schema.use('*', authMiddleware);

// Get all schemas
schema.get('/:connectionId/schemas', async (c) => {
  const startTime = Date.now();
  
  try {
    const connectionId = c.req.param('connectionId');
    const sql = getConnection(connectionId);

    if (!sql) {
      await logAudit(c, {
        actionType: 'schema_list_failed',
        actionCategory: 'schema',
        actionDescription: 'Schema list failed: Connection not found',
        status: 'error',
        errorMessage: 'Connection not found',
        executionTimeMs: Date.now() - startTime,
      });
      
      return c.json({ success: false, error: 'Connection not found' }, 404);
    }

    const schemas = await getSchemas(sql);

    await logAudit(c, {
      actionType: 'schema_list',
      actionCategory: 'schema',
      actionDescription: `Listed ${schemas.length} schema(s)`,
      status: 'success',
      executionTimeMs: Date.now() - startTime,
      metadata: { schemasCount: schemas.length },
    });

    return c.json({
      success: true,
      data: { schemas },
    });
  } catch (error) {
    logger.error('Failed to fetch schemas', error);
    
    await logAudit(c, {
      actionType: 'schema_list_failed',
      actionCategory: 'schema',
      actionDescription: `Schema list failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Failed to fetch schemas',
      executionTimeMs: Date.now() - startTime,
    });
    
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch schemas',
      },
      500
    );
  }
});

// Get tables in schema
schema.get('/:connectionId/:schemaName/tables', async (c) => {
  const startTime = Date.now();
  
  try {
    const connectionId = c.req.param('connectionId');
    const schemaName = c.req.param('schemaName');
    
    logger.info('Fetching tables', { connectionId, schemaName });
    
    const sql = getConnection(connectionId);

    if (!sql) {
      logger.error('Connection not found', { connectionId });
      
      await logAudit(c, {
        actionType: 'schema_tables_list_failed',
        actionCategory: 'schema',
        actionDescription: `Tables list failed: Connection not found`,
        status: 'error',
        errorMessage: 'Connection not found',
        schemaName,
        executionTimeMs: Date.now() - startTime,
      });
      
      return c.json({ success: false, error: 'Connection not found' }, 404);
    }

    const tables = await getTables(sql, schemaName);
    
    logger.info('Tables fetched successfully', { connectionId, schemaName, tableCount: tables.length });

    await logAudit(c, {
      actionType: 'schema_tables_list',
      actionCategory: 'schema',
      actionDescription: `Listed ${tables.length} table(s) in schema ${schemaName}`,
      status: 'success',
      schemaName,
      executionTimeMs: Date.now() - startTime,
      metadata: { tablesCount: tables.length },
    });

    return c.json({
      success: true,
      data: { tables },
    });
  } catch (error) {
    logger.error('Failed to fetch tables', error, { connectionId: c.req.param('connectionId'), schemaName: c.req.param('schemaName') });
    
    await logAudit(c, {
      actionType: 'schema_tables_list_failed',
      actionCategory: 'schema',
      actionDescription: `Tables list failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Failed to fetch tables',
      schemaName: c.req.param('schemaName'),
      executionTimeMs: Date.now() - startTime,
    });
    
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tables',
      },
      500
    );
  }
});

// Get table details
schema.get('/:connectionId/:schemaName/:tableName', async (c) => {
  const startTime = Date.now();
  
  try {
    const connectionId = c.req.param('connectionId');
    const schemaName = c.req.param('schemaName');
    const tableName = c.req.param('tableName');
    const sql = getConnection(connectionId);

    if (!sql) {
      await logAudit(c, {
        actionType: 'schema_table_inspect_failed',
        actionCategory: 'schema',
        actionDescription: `Table inspect failed: Connection not found`,
        status: 'error',
        errorMessage: 'Connection not found',
        schemaName,
        tableName,
        executionTimeMs: Date.now() - startTime,
      });
      
      return c.json({ success: false, error: 'Connection not found' }, 404);
    }

    const table = await getTableDetails(sql, schemaName, tableName);

    await logAudit(c, {
      actionType: 'schema_table_inspect',
      actionCategory: 'schema',
      actionDescription: `Inspected table ${schemaName}.${tableName}`,
      status: 'success',
      schemaName,
      tableName,
      executionTimeMs: Date.now() - startTime,
      metadata: {
        columnsCount: table.columns?.length || 0,
        indexesCount: table.indexes?.length || 0,
        foreignKeysCount: table.foreignKeys?.length || 0,
      },
    });

    return c.json({
      success: true,
      data: { table },
    });
  } catch (error) {
    logger.error('Failed to fetch table details', error);
    
    await logAudit(c, {
      actionType: 'schema_table_inspect_failed',
      actionCategory: 'schema',
      actionDescription: `Table inspect failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Failed to fetch table details',
      schemaName: c.req.param('schemaName'),
      tableName: c.req.param('tableName'),
      executionTimeMs: Date.now() - startTime,
    });
    
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch table details',
      },
      500
    );
  }
});

export default schema;
