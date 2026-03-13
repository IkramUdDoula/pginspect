// Views management routes

import { Hono } from 'hono';
import { authMiddleware, getAuth } from '../middleware/auth';
import { logAudit } from '../middleware/audit';
import { ViewsService } from '../services/viewsService';
import { getConnection } from '../services/db';
import { logger } from '../utils/logger';
import type { CreateViewRequest, ViewExecutionRequest } from '../../shared/types';
import postgres from 'postgres';

// Application database connection (not user's target databases)
const getAppDb = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  return postgres(dbUrl, {
    max: 3, // Reduced from 10 to avoid connection exhaustion
    idle_timeout: 20,
  });
};

let appDb: postgres.Sql | null = null;

function getDb(): postgres.Sql {
  if (!appDb) {
    appDb = getAppDb();
  }
  return appDb;
}

const views = new Hono();

// Apply auth middleware to all routes
views.use('*', authMiddleware);

// Get views for a connection
views.get('/', async (c) => {
  try {
    const auth = getAuth(c);
    const connectionId = c.req.query('connectionId');

    if (!connectionId) {
      return c.json({
        success: false,
        error: 'Connection ID is required',
      }, 400);
    }

    const connectionIdNum = parseInt(connectionId, 10);
    if (isNaN(connectionIdNum)) {
      return c.json({
        success: false,
        error: 'Invalid connection ID',
      }, 400);
    }

    logger.info('Fetching views for connection', { userId: auth.userId, connectionId: connectionIdNum });

    const userViews = await ViewsService.getUserViews(auth.userId, connectionIdNum);

    logger.info('Views fetched successfully', { userId: auth.userId, connectionId: connectionIdNum, count: userViews.length });

    return c.json({
      success: true,
      data: { views: userViews },
    });
  } catch (error) {
    logger.error('Failed to get views', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get views',
      },
      500
    );
  }
});

// Get a specific view
views.get('/:id', async (c) => {
  try {
    const auth = getAuth(c);
    const viewId = c.req.param('id');

    logger.info('Fetching view by ID', { userId: auth.userId, viewId });

    const view = await ViewsService.getViewById(viewId, auth.userId);

    if (!view) {
      return c.json({
        success: false,
        error: 'View not found',
      }, 404);
    }

    return c.json({
      success: true,
      data: { view },
    });
  } catch (error) {
    logger.error('Failed to get view', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get view',
      },
      500
    );
  }
});

// Create a new view
views.post('/', async (c) => {
  const startTime = Date.now();
  console.log('=== Backend: POST /api/views called ===');
  
  try {
    const auth = getAuth(c);
    console.log('Backend: Auth user =', auth.userId);
    
    const rawBody = await c.req.text();
    console.log('Backend: Raw request body =', rawBody);
    
    let viewData: CreateViewRequest;
    try {
      viewData = JSON.parse(rawBody);
      console.log('Backend: Parsed viewData =', viewData);
    } catch (parseError) {
      console.log('Backend: ERROR - Failed to parse JSON');
      console.error('Backend: Parse error =', parseError);
      return c.json({
        success: false,
        error: 'Invalid JSON in request body',
      }, 400);
    }

    logger.info('Creating new view', { 
      userId: auth.userId, 
      viewName: viewData.viewName, 
      connectionId: viewData.connectionId
    });

    // Validate input data
    console.log('Backend: Validating view data...');
    const validationErrors = ViewsService.validateViewData(viewData);
    console.log('Backend: Validation errors =', validationErrors);
    
    if (validationErrors.length > 0) {
      console.log('Backend: ERROR - Validation failed');
      
      await logAudit(c, {
        actionType: 'view_create_failed',
        actionCategory: 'view',
        actionDescription: `View creation failed: ${validationErrors.join(', ')}`,
        status: 'error',
        errorMessage: validationErrors.join(', '),
        connectionId: viewData.connectionId,
        schemaName: viewData.schemaName,
        resourceName: viewData.viewName,
        executionTimeMs: Date.now() - startTime,
      });
      
      return c.json({
        success: false,
        error: validationErrors.join(', '),
      }, 400);
    }

    // Verify the connection belongs to the user
    console.log('Backend: Checking connection ownership...');
    const sql = getDb();
    const connectionCheck = await sql`
      SELECT id FROM user_connections 
      WHERE id = ${viewData.connectionId} AND user_id = ${auth.userId}
    `;
    console.log('Backend: Connection check result =', connectionCheck);

    if (connectionCheck.length === 0) {
      console.log('Backend: ERROR - Connection not found or access denied');
      
      await logAudit(c, {
        actionType: 'view_create_failed',
        actionCategory: 'view',
        actionDescription: `View creation failed: Connection not found or access denied`,
        status: 'error',
        errorMessage: 'Connection not found or access denied',
        connectionId: viewData.connectionId,
        schemaName: viewData.schemaName,
        resourceName: viewData.viewName,
        executionTimeMs: Date.now() - startTime,
      });
      
      return c.json({
        success: false,
        error: 'Connection not found or access denied',
      }, 404);
    }

    console.log('Backend: Creating view in database...');
    const newView = await ViewsService.createView(auth.userId, viewData);
    console.log('Backend: Created view =', newView);

    logger.info('View created successfully', { userId: auth.userId, viewId: newView.id, viewName: newView.viewName });

    await logAudit(c, {
      actionType: 'view_create',
      actionCategory: 'view',
      actionDescription: `Created view "${viewData.viewName}" in schema "${viewData.schemaName}"`,
      status: 'success',
      connectionId: viewData.connectionId,
      schemaName: viewData.schemaName,
      resourceType: 'view',
      resourceId: newView.id.toString(),
      resourceName: viewData.viewName,
      queryText: viewData.queryText,
      queryType: viewData.queryType,
      executionTimeMs: Date.now() - startTime,
    });

    const response = {
      success: true,
      data: { view: newView },
      message: 'View saved successfully',
    };
    console.log('Backend: Sending response =', response);

    return c.json(response);
  } catch (error) {
    console.log('Backend: ERROR - Exception in view creation');
    console.error('Backend: Exception details =', error);
    logger.error('Failed to create view', error);
    
    await logAudit(c, {
      actionType: 'view_create_failed',
      actionCategory: 'view',
      actionDescription: `View creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Failed to create view',
      executionTimeMs: Date.now() - startTime,
    });
    
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create view',
      },
      500
    );
  }
});

// Delete a view
views.delete('/:id', async (c) => {
  const startTime = Date.now();
  
  try {
    const auth = getAuth(c);
    const viewId = c.req.param('id');

    logger.info('Deleting view', { userId: auth.userId, viewId });

    // Get view details before deleting for audit log
    const view = await ViewsService.getViewById(viewId, auth.userId);
    
    const deleted = await ViewsService.deleteView(viewId, auth.userId);

    if (!deleted) {
      await logAudit(c, {
        actionType: 'view_delete_failed',
        actionCategory: 'view',
        actionDescription: `View deletion failed: View not found`,
        status: 'error',
        errorMessage: 'View not found',
        resourceType: 'view',
        resourceId: viewId,
        executionTimeMs: Date.now() - startTime,
      });
      
      return c.json({
        success: false,
        error: 'View not found',
      }, 404);
    }

    logger.info('View deleted successfully', { userId: auth.userId, viewId });

    await logAudit(c, {
      actionType: 'view_delete',
      actionCategory: 'view',
      actionDescription: `Deleted view "${view?.viewName || viewId}"`,
      status: 'success',
      connectionId: view?.connectionId ? parseInt(view.connectionId as any) : undefined,
      schemaName: view?.schemaName,
      resourceType: 'view',
      resourceId: viewId,
      resourceName: view?.viewName,
      executionTimeMs: Date.now() - startTime,
    });

    return c.json({
      success: true,
      message: 'View deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete view', error);
    
    await logAudit(c, {
      actionType: 'view_delete_failed',
      actionCategory: 'view',
      actionDescription: `View deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Failed to delete view',
      executionTimeMs: Date.now() - startTime,
    });
    
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete view',
      },
      500
    );
  }
});

// Update a view (for auto-refresh interval and other settings)
views.patch('/:id', async (c) => {
  const startTime = Date.now();
  
  try {
    const auth = getAuth(c);
    const viewId = c.req.param('id');

    logger.info('Updating view', { userId: auth.userId, viewId });

    const rawBody = await c.req.text();
    let updateData: Partial<CreateViewRequest>;
    
    try {
      updateData = JSON.parse(rawBody);
    } catch (parseError) {
      return c.json({
        success: false,
        error: 'Invalid JSON in request body',
      }, 400);
    }

    // Update the view
    const updatedView = await ViewsService.updateView(viewId, auth.userId, updateData);

    if (!updatedView) {
      await logAudit(c, {
        actionType: 'view_update_failed',
        actionCategory: 'view',
        actionDescription: `View update failed: View not found`,
        status: 'error',
        errorMessage: 'View not found',
        resourceType: 'view',
        resourceId: viewId,
        executionTimeMs: Date.now() - startTime,
      });
      
      return c.json({
        success: false,
        error: 'View not found',
      }, 404);
    }

    logger.info('View updated successfully', { userId: auth.userId, viewId });

    await logAudit(c, {
      actionType: 'view_update',
      actionCategory: 'view',
      actionDescription: `Updated view "${updatedView.viewName}"`,
      status: 'success',
      connectionId: updatedView.connectionId ? parseInt(updatedView.connectionId as any) : undefined,
      schemaName: updatedView.schemaName,
      resourceType: 'view',
      resourceId: viewId,
      resourceName: updatedView.viewName,
      executionTimeMs: Date.now() - startTime,
      metadata: { updatedFields: Object.keys(updateData) },
    });

    return c.json({
      success: true,
      data: { view: updatedView },
      message: 'View updated successfully',
    });
  } catch (error) {
    logger.error('Failed to update view', error);
    
    await logAudit(c, {
      actionType: 'view_update_failed',
      actionCategory: 'view',
      actionDescription: `View update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Failed to update view',
      executionTimeMs: Date.now() - startTime,
    });
    
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update view',
      },
      500
    );
  }
});

// Execute a view
views.post('/:id/execute', async (c) => {
  const startTime = Date.now();
  
  try {
    const auth = getAuth(c);
    const viewId = c.req.param('id');

    logger.info('Executing view', { userId: auth.userId, viewId });

    // Get the view
    const view = await ViewsService.getViewById(viewId, auth.userId);
    if (!view) {
      await logAudit(c, {
        actionType: 'view_execute_failed',
        actionCategory: 'view',
        actionDescription: `View execution failed: View not found`,
        status: 'error',
        errorMessage: 'View not found',
        resourceType: 'view',
        resourceId: viewId,
        executionTimeMs: Date.now() - startTime,
      });
      
      return c.json({
        success: false,
        error: 'View not found',
      }, 404);
    }

    // Get the saved connection details from the database
    const sql = getDb();
    const connectionResult = await sql`
      SELECT id, name, host, port, database, username, password_encrypted, ssl_mode
      FROM user_connections
      WHERE id = ${view.connectionId} AND user_id = ${auth.userId}
    `;

    if (connectionResult.length === 0) {
      await logAudit(c, {
        actionType: 'view_execute_failed',
        actionCategory: 'view',
        actionDescription: `View execution failed: Connection not found`,
        status: 'error',
        errorMessage: 'Connection not found or access denied',
        connectionId: view.connectionId ? parseInt(view.connectionId as any) : undefined,
        resourceType: 'view',
        resourceId: viewId,
        resourceName: view.viewName,
        executionTimeMs: Date.now() - startTime,
      });
      
      return c.json({
        success: false,
        error: 'Connection not found or access denied',
      }, 404);
    }

    const savedConn = connectionResult[0];
    
    // Import the necessary functions
    const { decrypt } = await import('../../lib/encryption');
    const { createConnection } = await import('../services/db');
    
    // Recreate the connection info
    const connectionInfo = {
      name: savedConn.name as string,
      host: savedConn.host as string,
      port: savedConn.port as number,
      database: savedConn.database as string,
      user: savedConn.username as string,
      password: decrypt(savedConn.password_encrypted as string),
      sslMode: savedConn.ssl_mode as string,
    };

    // Create or get runtime connection
    let connection;
    try {
      const { sql: runtimeConnection } = await createConnection(connectionInfo);
      connection = runtimeConnection;
    } catch (error) {
      logger.error('Failed to create runtime connection for view execution', error);
      
      await logAudit(c, {
        actionType: 'view_execute_failed',
        actionCategory: 'view',
        actionDescription: `View execution failed: Connection error`,
        status: 'error',
        errorMessage: 'Failed to connect to database',
        connectionId: view.connectionId ? parseInt(view.connectionId as any) : undefined,
        connectionName: savedConn.name as string,
        databaseName: savedConn.database as string,
        resourceType: 'view',
        resourceId: viewId,
        resourceName: view.viewName,
        executionTimeMs: Date.now() - startTime,
      });
      
      return c.json({
        success: false,
        error: 'Failed to connect to database. Please check your connection settings.',
      }, 400);
    }

    // Execute the query
    const queryStartTime = Date.now();
    
    try {
      const result = await connection.unsafe(view.queryText);
      const executionTime = Date.now() - queryStartTime;

      // Format the result
      const columns = result.length > 0 ? Object.keys(result[0]) : [];
      const rows = result.map(row => ({ ...row }));

      logger.info('View executed successfully', { 
        userId: auth.userId, 
        viewId, 
        rowCount: rows.length, 
        executionTime 
      });

      await logAudit(c, {
        actionType: 'view_execute',
        actionCategory: 'view',
        actionDescription: `Executed view "${view.viewName}"`,
        status: 'success',
        connectionId: view.connectionId ? parseInt(view.connectionId as any) : undefined,
        connectionName: savedConn.name as string,
        databaseName: savedConn.database as string,
        schemaName: view.schemaName,
        resourceType: 'view',
        resourceId: viewId,
        resourceName: view.viewName,
        queryText: view.queryText,
        rowsAffected: rows.length,
        executionTimeMs: executionTime,
      });

      return c.json({
        success: true,
        data: {
          columns,
          rows,
          rowCount: rows.length,
          executionTime,
          isSimulated: false,
          view: {
            id: view.id,
            name: view.viewName,
            description: view.description,
            connectionId: view.connectionId,
            schemaName: view.schemaName,
          },
        },
      });
    } catch (queryError) {
      logger.error('View query execution failed', { userId: auth.userId, viewId, error: queryError });
      
      await logAudit(c, {
        actionType: 'view_execute_failed',
        actionCategory: 'view',
        actionDescription: `View execution failed: ${queryError instanceof Error ? queryError.message : 'Query error'}`,
        status: 'error',
        errorMessage: queryError instanceof Error ? queryError.message : 'Query execution failed',
        connectionId: view.connectionId ? parseInt(view.connectionId as any) : undefined,
        connectionName: savedConn.name as string,
        databaseName: savedConn.database as string,
        schemaName: view.schemaName,
        resourceType: 'view',
        resourceId: viewId,
        resourceName: view.viewName,
        queryText: view.queryText,
        executionTimeMs: Date.now() - queryStartTime,
      });
      
      return c.json({
        success: false,
        error: queryError instanceof Error ? queryError.message : 'Query execution failed',
      }, 400);
    }
  } catch (error) {
    logger.error('Failed to execute view', error);
    
    await logAudit(c, {
      actionType: 'view_execute_failed',
      actionCategory: 'view',
      actionDescription: `View execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Failed to execute view',
      executionTimeMs: Date.now() - startTime,
    });
    
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute view',
      },
      500
    );
  }
});

export default views;