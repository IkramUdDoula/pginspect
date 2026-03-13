// Audit log routes

import { Hono } from 'hono';
import { authMiddleware, getAuth } from '../middleware/auth';
import { AuditService } from '../services/auditService';
import { logger } from '../utils/logger';
import type { AuditLogFilter } from '../../shared/types';

const audit = new Hono();

// Apply auth middleware to all routes
audit.use('*', authMiddleware);

/**
 * GET /api/audit/logs
 * Get audit logs with filters
 */
audit.get('/logs', async (c) => {
  try {
    const auth = getAuth(c);
    
    // Parse query parameters
    const filters: AuditLogFilter = {
      actionCategory: c.req.query('actionCategory'),
      actionType: c.req.query('actionType'),
      status: c.req.query('status'),
      connectionId: c.req.query('connectionId') ? parseInt(c.req.query('connectionId')!) : undefined,
      databaseName: c.req.query('databaseName'),
      tableName: c.req.query('tableName'),
      dateFrom: c.req.query('dateFrom') ? new Date(c.req.query('dateFrom')!) : undefined,
      dateTo: c.req.query('dateTo') ? new Date(c.req.query('dateTo')!) : undefined,
      searchQuery: c.req.query('searchQuery'),
      limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50,
      offset: c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0,
    };

    const result = await AuditService.getLogs(auth.userId, filters);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to get audit logs', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get audit logs',
    }, 500);
  }
});

/**
 * GET /api/audit/logs/:id
 * Get a specific audit log
 */
audit.get('/logs/:id', async (c) => {
  try {
    const auth = getAuth(c);
    const logId = c.req.param('id');

    const log = await AuditService.getLog(auth.userId, logId);

    if (!log) {
      return c.json({
        success: false,
        error: 'Audit log not found',
      }, 404);
    }

    return c.json({
      success: true,
      data: { log },
    });
  } catch (error) {
    logger.error('Failed to get audit log', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get audit log',
    }, 500);
  }
});

/**
 * GET /api/audit/stats
 * Get audit statistics
 */
audit.get('/stats', async (c) => {
  try {
    const auth = getAuth(c);

    const stats = await AuditService.getStats(auth.userId);

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get audit stats', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get audit stats',
    }, 500);
  }
});

/**
 * POST /api/audit/export
 * Export audit logs
 */
audit.post('/export', async (c) => {
  try {
    const auth = getAuth(c);
    const body = await c.req.json();
    
    const filters: AuditLogFilter = {
      ...body.filters,
      limit: 10000, // Max export limit
      offset: 0,
    };

    const format = body.format || 'json';

    const result = await AuditService.getLogs(auth.userId, filters);

    if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'Timestamp',
        'User Email',
        'Action Type',
        'Action Category',
        'Description',
        'Status',
        'Connection',
        'Database',
        'Table',
        'Rows Affected',
        'Execution Time (ms)',
        'Error Message',
      ];

      const rows = result.logs.map(log => [
        log.timestamp.toISOString(),
        log.userEmail,
        log.actionType,
        log.actionCategory,
        log.actionDescription,
        log.status,
        log.connectionName || '',
        log.databaseName || '',
        log.tableName || '',
        log.rowsAffected?.toString() || '',
        log.executionTimeMs?.toString() || '',
        log.errorMessage || '',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${Date.now()}.csv"`,
      });
    } else {
      // Return as JSON
      return c.json(result.logs, 200, {
        'Content-Disposition': `attachment; filename="audit-logs-${Date.now()}.json"`,
      });
    }
  } catch (error) {
    logger.error('Failed to export audit logs', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export audit logs',
    }, 500);
  }
});

export default audit;
