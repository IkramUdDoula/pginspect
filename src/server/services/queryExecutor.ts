// Safe query execution service

import type postgres from 'postgres';
import { sanitizeSQL } from '../utils/security';
import { logger } from '../utils/logger';
import type { QueryResult } from '../../shared/types';

const QUERY_TIMEOUT = parseInt(process.env.QUERY_TIMEOUT || '30000');

export async function executeQuery(
  sql: postgres.Sql,
  queryText: string,
  limit?: number
): Promise<QueryResult> {
  const startTime = Date.now();

  // Validate SQL
  const validation = sanitizeSQL(queryText);
  if (!validation.safe) {
    throw new Error(validation.reason || 'Invalid SQL query');
  }

  // Use the query as provided - no automatic LIMIT injection
  let finalQuery = queryText.trim();

  try {
    // Execute with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout exceeded')), QUERY_TIMEOUT);
    });

    const queryPromise = sql.unsafe(finalQuery);
    const result = await Promise.race([queryPromise, timeoutPromise]) as any[];

    const executionTime = Date.now() - startTime;

    // Extract column names
    const columns = result.length > 0 ? Object.keys(result[0]) : [];

    logger.info('Query executed successfully', {
      rowCount: result.length,
      executionTime,
      columns: columns.length,
    });

    return {
      columns,
      rows: result,
      rowCount: result.length,
      executionTime,
      isSimulated: false,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Query execution failed', error, { executionTime });
    throw new Error(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function explainQuery(
  sql: postgres.Sql,
  queryText: string
): Promise<string> {
  // Validate SQL
  const validation = sanitizeSQL(queryText);
  if (!validation.safe) {
    throw new Error(validation.reason || 'Invalid SQL query');
  }

  try {
    const result = await sql.unsafe(`EXPLAIN ${queryText}`);
    return result.map((row: any) => row['QUERY PLAN']).join('\n');
  } catch (error) {
    logger.error('EXPLAIN query failed', error);
    throw new Error(`EXPLAIN failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
