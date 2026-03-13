import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { logAudit } from '../middleware/audit';
import { getConnection } from '../services/db';
import { logger } from '../utils/logger';
import type { DataInsertRequest, DataUpdateRequest, DataDeleteRequest } from '@/shared/types';

const app = new Hono();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// Insert data
app.post('/insert', async (c) => {
  const startTime = Date.now();
  
  try {
    const body = await c.req.json() as DataInsertRequest;
    const { connectionId, schema, table, data } = body;

    if (!connectionId || !schema || !table || !data) {
      return c.json({
        success: false,
        error: 'Missing required fields: connectionId, schema, table, data',
      }, 400);
    }

    const sql = getConnection(connectionId);
    if (!sql) {
      await logAudit(c, {
        actionType: 'data_insert_failed',
        actionCategory: 'data',
        actionDescription: `Data insert failed: Connection not found`,
        status: 'error',
        errorMessage: 'Connection not found',
        schemaName: schema,
        tableName: table,
        executionTimeMs: Date.now() - startTime,
      });
      
      return c.json({
        success: false,
        error: 'Connection not found',
      }, 404);
    }

    // Build INSERT query
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO "${schema}"."${table}" (${columns.map(col => `"${col}"`).join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    logger.info('Executing INSERT query', { query, values });
    const result = await sql.unsafe(query, values as any[]) as any[];

    await logAudit(c, {
      actionType: 'data_insert',
      actionCategory: 'data',
      actionDescription: `Inserted row into ${schema}.${table}`,
      status: 'success',
      schemaName: schema,
      tableName: table,
      queryText: query,
      queryType: 'INSERT',
      rowsAffected: result.length,
      executionTimeMs: Date.now() - startTime,
      metadata: { columns: columns },
    });

    return c.json({
      success: true,
      data: {
        rowsAffected: result.length,
        row: result[0],
      },
    });
  } catch (error) {
    logger.error('Insert data error', { error });
    
    await logAudit(c, {
      actionType: 'data_insert_failed',
      actionCategory: 'data',
      actionDescription: `Data insert failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Insert failed',
      executionTimeMs: Date.now() - startTime,
    });
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Insert failed',
    }, 500);
  }
});

// Update data
app.post('/update', async (c) => {
  const startTime = Date.now();
  
  try {
    const body = await c.req.json() as DataUpdateRequest;
    const { connectionId, schema, table, where, data } = body;

    if (!connectionId || !schema || !table || !where || !data) {
      return c.json({
        success: false,
        error: 'Missing required fields: connectionId, schema, table, where, data',
      }, 400);
    }

    const sql = getConnection(connectionId);
    if (!sql) {
      await logAudit(c, {
        actionType: 'data_update_failed',
        actionCategory: 'data',
        actionDescription: `Data update failed: Connection not found`,
        status: 'error',
        errorMessage: 'Connection not found',
        schemaName: schema,
        tableName: table,
        executionTimeMs: Date.now() - startTime,
      });
      
      return c.json({
        success: false,
        error: 'Connection not found',
      }, 404);
    }

    // Build UPDATE query
    const dataColumns = Object.keys(data);
    const dataValues = Object.values(data);
    const whereColumns = Object.keys(where);
    const whereValues = Object.values(where);

    const setClause = dataColumns.map((col, i) => `"${col}" = $${i + 1}`).join(', ');
    const whereClause = whereColumns.map((col, i) => `"${col}" = $${dataColumns.length + i + 1}`).join(' AND ');
    
    const query = `
      UPDATE "${schema}"."${table}"
      SET ${setClause}
      WHERE ${whereClause}
      RETURNING *
    `;

    const allValues = [...dataValues, ...whereValues];
    logger.info('Executing UPDATE query', { query, values: allValues });
    const result = await sql.unsafe(query, allValues as any[]) as any[];

    await logAudit(c, {
      actionType: 'data_update',
      actionCategory: 'data',
      actionDescription: `Updated ${result.length} row(s) in ${schema}.${table}`,
      status: 'success',
      schemaName: schema,
      tableName: table,
      queryText: query,
      queryType: 'UPDATE',
      rowsAffected: result.length,
      executionTimeMs: Date.now() - startTime,
      metadata: { 
        updatedColumns: dataColumns,
        whereConditions: whereColumns,
      },
    });

    return c.json({
      success: true,
      data: {
        rowsAffected: result.length,
        row: result[0],
      },
    });
  } catch (error) {
    logger.error('Update data error', { error });
    
    await logAudit(c, {
      actionType: 'data_update_failed',
      actionCategory: 'data',
      actionDescription: `Data update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Update failed',
      executionTimeMs: Date.now() - startTime,
    });
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Update failed',
    }, 500);
  }
});

// Delete data
app.post('/delete', async (c) => {
  const startTime = Date.now();
  
  try {
    const body = await c.req.json() as DataDeleteRequest;
    const { connectionId, schema, table, where } = body;

    if (!connectionId || !schema || !table || !where) {
      return c.json({
        success: false,
        error: 'Missing required fields: connectionId, schema, table, where',
      }, 400);
    }

    const sql = getConnection(connectionId);
    if (!sql) {
      await logAudit(c, {
        actionType: 'data_delete_failed',
        actionCategory: 'data',
        actionDescription: `Data delete failed: Connection not found`,
        status: 'error',
        errorMessage: 'Connection not found',
        schemaName: schema,
        tableName: table,
        executionTimeMs: Date.now() - startTime,
      });
      
      return c.json({
        success: false,
        error: 'Connection not found',
      }, 404);
    }

    // Build DELETE query
    const whereColumns = Object.keys(where);
    const whereValues = Object.values(where);
    const whereClause = whereColumns.map((col, i) => `"${col}" = $${i + 1}`).join(' AND ');
    
    const query = `
      DELETE FROM "${schema}"."${table}"
      WHERE ${whereClause}
      RETURNING *
    `;

    logger.info('Executing DELETE query', { query, values: whereValues });
    const result = await sql.unsafe(query, whereValues as any[]) as any[];

    await logAudit(c, {
      actionType: 'data_delete',
      actionCategory: 'data',
      actionDescription: `Deleted ${result.length} row(s) from ${schema}.${table}`,
      status: 'success',
      schemaName: schema,
      tableName: table,
      queryText: query,
      queryType: 'DELETE',
      rowsAffected: result.length,
      executionTimeMs: Date.now() - startTime,
      metadata: { whereConditions: whereColumns },
    });

    return c.json({
      success: true,
      data: {
        rowsAffected: result.length,
        row: result[0],
      },
    });
  } catch (error) {
    logger.error('Delete data error', { error });
    
    await logAudit(c, {
      actionType: 'data_delete_failed',
      actionCategory: 'data',
      actionDescription: `Data delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Delete failed',
      executionTimeMs: Date.now() - startTime,
    });
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    }, 500);
  }
});

export default app;
