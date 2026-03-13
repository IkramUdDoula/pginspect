// Query execution routes

import { Hono } from 'hono';
import { getConnection } from '../services/db';
import { executeQuery, explainQuery } from '../services/queryExecutor';
import { validateQueryRequest } from '../middleware/validator';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { logAudit } from '../middleware/audit';
import { AuditService } from '../services/auditService';

const queries = new Hono();

// Apply auth middleware to all routes
queries.use('*', authMiddleware);

// Execute query
queries.post('/execute', validateQueryRequest, async (c) => {
  const startTime = Date.now();
  let queryText = '';
  let queryType = '';
  
  try {
    const { connectionId, sql, limit } = await c.req.json();
    queryText = sql;
    queryType = AuditService.extractQueryType(queryText);
    
    const connection = getConnection(connectionId);

    if (!connection) {
      await logAudit(c, {
        actionType: 'query_execute_failed',
        actionCategory: 'query',
        actionDescription: 'Query execution failed: Connection not found',
        status: 'error',
        errorMessage: 'Connection not found',
        queryText,
        queryType,
        executionTimeMs: Date.now() - startTime,
      });
      
      return c.json({ success: false, error: 'Connection not found' }, 404);
    }

    const result = await executeQuery(connection, queryText, limit);

    // Log successful query execution
    await logAudit(c, {
      actionType: `query_execute_${queryType.toLowerCase()}`,
      actionCategory: 'query',
      actionDescription: `Executed ${queryType} query`,
      status: 'success',
      queryText,
      queryType,
      rowsAffected: result.rowCount,
      executionTimeMs: result.executionTime,
    });

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Query execution failed', error);
    
    // Log failed query execution
    await logAudit(c, {
      actionType: 'query_execute_failed',
      actionCategory: 'query',
      actionDescription: `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Query execution failed',
      queryText,
      queryType,
      executionTimeMs: Date.now() - startTime,
    });
    
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed',
      },
      500
    );
  }
});

// Explain query
queries.post('/explain', validateQueryRequest, async (c) => {
  try {
    const { connectionId, sql: queryText } = await c.req.json();
    const sql = getConnection(connectionId);

    if (!sql) {
      return c.json({ success: false, error: 'Connection not found' }, 404);
    }

    const plan = await explainQuery(sql, queryText);

    return c.json({
      success: true,
      data: { plan },
    });
  } catch (error) {
    logger.error('EXPLAIN query failed', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'EXPLAIN query failed',
      },
      500
    );
  }
});

export default queries;
