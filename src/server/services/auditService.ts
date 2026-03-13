// Audit logging service

import postgres from 'postgres';
import { logger } from '../utils/logger';
import type { AuditLog, AuditLogFilter, AuditLogStats, CreateAuditLogRequest } from '../../shared/types';

// Application database connection (not user's target databases)
const getAppDb = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return postgres(dbUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
};

interface AuditContext {
  userId: string;
  userEmail: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

const MAX_QUERY_LENGTH = 5000;

export class AuditService {
  /**
   * Create an audit log entry
   */
  static async createLog(
    context: AuditContext,
    request: CreateAuditLogRequest
  ): Promise<void> {
    try {
      const db = getAppDb();
      
      // Truncate query text if too long
      const queryText = request.queryText 
        ? request.queryText.substring(0, MAX_QUERY_LENGTH)
        : null;

      // Convert undefined to null for postgres.js
      const toNull = (value: any) => value === undefined ? null : value;

      await db`
        INSERT INTO audit_logs (
          user_id, user_email, user_name,
          action_type, action_category, action_description,
          connection_id, connection_name, database_name, schema_name, table_name,
          resource_type, resource_id, resource_name,
          query_text, query_type, rows_affected, execution_time_ms,
          status, error_message,
          ip_address, user_agent, request_id,
          metadata
        ) VALUES (
          ${context.userId}, ${context.userEmail}, ${toNull(context.userName)},
          ${request.actionType}, ${request.actionCategory}, ${request.actionDescription},
          ${toNull(request.connectionId)}, ${toNull(request.connectionName)}, ${toNull(request.databaseName)}, 
          ${toNull(request.schemaName)}, ${toNull(request.tableName)},
          ${toNull(request.resourceType)}, ${toNull(request.resourceId)}, ${toNull(request.resourceName)},
          ${queryText}, ${toNull(request.queryType)}, ${toNull(request.rowsAffected)}, ${toNull(request.executionTimeMs)},
          ${request.status}, ${toNull(request.errorMessage)},
          ${toNull(context.ipAddress)}, ${toNull(context.userAgent)}, ${toNull(context.requestId)},
          ${request.metadata ? db.json(request.metadata) : null}
        )
      `;

      logger.info('Audit log created', {
        userId: context.userId,
        actionType: request.actionType,
        status: request.status,
      });
    } catch (error) {
      // Don't throw - audit logging should not break the main operation
      logger.error('Failed to create audit log', error, {
        userId: context.userId,
        actionType: request.actionType,
      });
    }
  }

  /**
   * Get audit logs with filters
   */
  static async getLogs(
    userId: string,
    filters: AuditLogFilter = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const db = getAppDb();
    
    // Build dynamic WHERE conditions
    const whereConditions: any[] = [];
    const whereParts: string[] = ['user_id = $1'];
    const params: any[] = [userId];
    let paramIndex = 2;

    if (filters.actionCategory) {
      whereParts.push(`action_category = $${paramIndex++}`);
      params.push(filters.actionCategory);
    }

    if (filters.actionType) {
      whereParts.push(`action_type = $${paramIndex++}`);
      params.push(filters.actionType);
    }

    if (filters.status) {
      whereParts.push(`status = $${paramIndex++}`);
      params.push(filters.status);
    }

    if (filters.connectionId) {
      whereParts.push(`connection_id = $${paramIndex++}`);
      params.push(filters.connectionId);
    }

    if (filters.databaseName) {
      whereParts.push(`database_name = $${paramIndex++}`);
      params.push(filters.databaseName);
    }

    if (filters.tableName) {
      whereParts.push(`table_name = $${paramIndex++}`);
      params.push(filters.tableName);
    }

    if (filters.dateFrom) {
      whereParts.push(`timestamp >= $${paramIndex++}`);
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      whereParts.push(`timestamp <= $${paramIndex++}`);
      params.push(filters.dateTo);
    }

    if (filters.searchQuery) {
      whereParts.push(`(
        action_description ILIKE $${paramIndex} OR
        query_text ILIKE $${paramIndex} OR
        resource_name ILIKE $${paramIndex} OR
        error_message ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.searchQuery}%`);
      paramIndex++;
    }

    const whereClause = whereParts.join(' AND ');

    // Get total count
    const countResult = await db.unsafe(
      `SELECT COUNT(*) as total FROM audit_logs WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].total);

    // Get logs with pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const logsResult = await db.unsafe(
      `SELECT * FROM audit_logs 
       WHERE ${whereClause}
       ORDER BY timestamp DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const logs: AuditLog[] = logsResult.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      userName: row.user_name,
      actionType: row.action_type,
      actionCategory: row.action_category,
      actionDescription: row.action_description,
      timestamp: new Date(row.timestamp),
      connectionId: row.connection_id,
      connectionName: row.connection_name,
      databaseName: row.database_name,
      schemaName: row.schema_name,
      tableName: row.table_name,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      resourceName: row.resource_name,
      queryText: row.query_text,
      queryType: row.query_type,
      rowsAffected: row.rows_affected,
      executionTimeMs: row.execution_time_ms,
      status: row.status,
      errorMessage: row.error_message,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      requestId: row.request_id,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
    }));

    return { logs, total };
  }

  /**
   * Get a single audit log by ID
   */
  static async getLog(userId: string, logId: string): Promise<AuditLog | null> {
    const db = getAppDb();
    
    const result = await db`
      SELECT * FROM audit_logs WHERE id = ${logId} AND user_id = ${userId}
    `;

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      userName: row.user_name,
      actionType: row.action_type,
      actionCategory: row.action_category,
      actionDescription: row.action_description,
      timestamp: new Date(row.timestamp),
      connectionId: row.connection_id,
      connectionName: row.connection_name,
      databaseName: row.database_name,
      schemaName: row.schema_name,
      tableName: row.table_name,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      resourceName: row.resource_name,
      queryText: row.query_text,
      queryType: row.query_type,
      rowsAffected: row.rows_affected,
      executionTimeMs: row.execution_time_ms,
      status: row.status,
      errorMessage: row.error_message,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      requestId: row.request_id,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
    };
  }

  /**
   * Get audit statistics
   */
  static async getStats(userId: string): Promise<AuditLogStats> {
    const db = getAppDb();

    // Get counts by status
    const statusResult = await db`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count,
        SUM(CASE WHEN status = 'warning' THEN 1 ELSE 0 END) as warning_count
       FROM audit_logs
       WHERE user_id = ${userId}
    `;

    const statusRow = statusResult[0];

    // Get counts by category
    const categoryResult = await db`
      SELECT action_category, COUNT(*) as count
       FROM audit_logs
       WHERE user_id = ${userId}
       GROUP BY action_category
    `;

    const categoryCounts: Record<string, number> = {};
    categoryResult.forEach((row: any) => {
      categoryCounts[row.action_category] = parseInt(row.count);
    });

    // Get top actions
    const topActionsResult = await db`
      SELECT action_type, COUNT(*) as count
       FROM audit_logs
       WHERE user_id = ${userId}
       GROUP BY action_type
       ORDER BY count DESC
       LIMIT 10
    `;

    const topActions = topActionsResult.map((row: any) => ({
      actionType: row.action_type,
      count: parseInt(row.count),
    }));

    // Get recent activity
    const recentResult = await db`
      SELECT * FROM audit_logs
       WHERE user_id = ${userId}
       ORDER BY timestamp DESC
       LIMIT 10
    `;

    const recentActivity: AuditLog[] = recentResult.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      userName: row.user_name,
      actionType: row.action_type,
      actionCategory: row.action_category,
      actionDescription: row.action_description,
      timestamp: new Date(row.timestamp),
      connectionId: row.connection_id,
      connectionName: row.connection_name,
      databaseName: row.database_name,
      schemaName: row.schema_name,
      tableName: row.table_name,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      resourceName: row.resource_name,
      queryText: row.query_text,
      queryType: row.query_type,
      rowsAffected: row.rows_affected,
      executionTimeMs: row.execution_time_ms,
      status: row.status,
      errorMessage: row.error_message,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      requestId: row.request_id,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
    }));

    return {
      totalLogs: parseInt(statusRow.total),
      successCount: parseInt(statusRow.success_count),
      errorCount: parseInt(statusRow.error_count),
      warningCount: parseInt(statusRow.warning_count),
      categoryCounts,
      topActions,
      recentActivity,
    };
  }

  /**
   * Helper to extract query type from SQL
   */
  static extractQueryType(sql: string): string {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT')) return 'SELECT';
    if (trimmed.startsWith('INSERT')) return 'INSERT';
    if (trimmed.startsWith('UPDATE')) return 'UPDATE';
    if (trimmed.startsWith('DELETE')) return 'DELETE';
    if (trimmed.startsWith('CREATE')) return 'CREATE';
    if (trimmed.startsWith('ALTER')) return 'ALTER';
    if (trimmed.startsWith('DROP')) return 'DROP';
    if (trimmed.startsWith('TRUNCATE')) return 'TRUNCATE';
    return 'OTHER';
  }
}
