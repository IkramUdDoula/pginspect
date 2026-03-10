// Query execution routes

import { Hono } from 'hono';
import { getConnection } from '../services/db';
import { executeQuery, explainQuery } from '../services/queryExecutor';
import { validateQueryRequest } from '../middleware/validator';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const queries = new Hono();

// Apply auth middleware to all routes
queries.use('*', authMiddleware);

// Execute query
queries.post('/execute', validateQueryRequest, async (c) => {
  try {
    const { connectionId, sql: queryText, limit } = await c.req.json();
    const sql = getConnection(connectionId);

    if (!sql) {
      return c.json({ success: false, error: 'Connection not found' }, 404);
    }

    const result = await executeQuery(sql, queryText, limit);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Query execution failed', error);
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
