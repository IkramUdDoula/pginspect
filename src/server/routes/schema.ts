// Schema inspection routes

import { Hono } from 'hono';
import { getConnection } from '../services/db';
import { getSchemas, getTables, getTableDetails } from '../services/schemaInspector';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const schema = new Hono();

// Apply auth middleware to all routes
schema.use('*', authMiddleware);

// Get all schemas
schema.get('/:connectionId/schemas', async (c) => {
  try {
    const connectionId = c.req.param('connectionId');
    const sql = getConnection(connectionId);

    if (!sql) {
      return c.json({ success: false, error: 'Connection not found' }, 404);
    }

    const schemas = await getSchemas(sql);

    return c.json({
      success: true,
      data: { schemas },
    });
  } catch (error) {
    logger.error('Failed to fetch schemas', error);
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
  try {
    const connectionId = c.req.param('connectionId');
    const schemaName = c.req.param('schemaName');
    
    logger.info('Fetching tables', { connectionId, schemaName });
    
    const sql = getConnection(connectionId);

    if (!sql) {
      logger.error('Connection not found', { connectionId });
      return c.json({ success: false, error: 'Connection not found' }, 404);
    }

    const tables = await getTables(sql, schemaName);
    
    logger.info('Tables fetched successfully', { connectionId, schemaName, tableCount: tables.length });

    return c.json({
      success: true,
      data: { tables },
    });
  } catch (error) {
    logger.error('Failed to fetch tables', error, { connectionId: c.req.param('connectionId'), schemaName: c.req.param('schemaName') });
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
  try {
    const connectionId = c.req.param('connectionId');
    const schemaName = c.req.param('schemaName');
    const tableName = c.req.param('tableName');
    const sql = getConnection(connectionId);

    if (!sql) {
      return c.json({ success: false, error: 'Connection not found' }, 404);
    }

    const table = await getTableDetails(sql, schemaName, tableName);

    return c.json({
      success: true,
      data: { table },
    });
  } catch (error) {
    logger.error('Failed to fetch table details', error);
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
