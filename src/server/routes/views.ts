// Views management routes

import { Hono } from 'hono';
import { authMiddleware, getAuth } from '../middleware/auth';
import { ViewsService } from '../services/viewsService';
import { getConnection } from '../services/db';
import { logger } from '../utils/logger';
import type { CreateViewRequest, UpdateViewRequest, ViewExecutionRequest } from '../../shared/types';
import postgres from 'postgres';

// Application database connection (not user's target databases)
const getAppDb = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  return postgres(dbUrl, {
    max: 10,
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
      return c.json({
        success: false,
        error: 'Connection not found or access denied',
      }, 404);
    }

    console.log('Backend: Creating view in database...');
    const newView = await ViewsService.createView(auth.userId, viewData);
    console.log('Backend: Created view =', newView);

    logger.info('View created successfully', { userId: auth.userId, viewId: newView.id, viewName: newView.viewName });

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
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create view',
      },
      500
    );
  }
});

// Update an existing view
views.put('/:id', async (c) => {
  try {
    const auth = getAuth(c);
    const viewId = c.req.param('id');
    const updates: UpdateViewRequest = await c.req.json();

    logger.info('Updating view', { userId: auth.userId, viewId });

    // Validate input data
    const validationErrors = ViewsService.validateViewData(updates);
    if (validationErrors.length > 0) {
      return c.json({
        success: false,
        error: validationErrors.join(', '),
      }, 400);
    }

    const updatedView = await ViewsService.updateView(viewId, auth.userId, updates);

    logger.info('View updated successfully', { userId: auth.userId, viewId, viewName: updatedView.viewName });

    return c.json({
      success: true,
      data: { view: updatedView },
      message: 'View updated successfully',
    });
  } catch (error) {
    logger.error('Failed to update view', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update view',
      },
      500
    );
  }
});

// Delete a view
views.delete('/:id', async (c) => {
  try {
    const auth = getAuth(c);
    const viewId = c.req.param('id');

    logger.info('Deleting view', { userId: auth.userId, viewId });

    const deleted = await ViewsService.deleteView(viewId, auth.userId);

    if (!deleted) {
      return c.json({
        success: false,
        error: 'View not found',
      }, 404);
    }

    logger.info('View deleted successfully', { userId: auth.userId, viewId });

    return c.json({
      success: true,
      message: 'View deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete view', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete view',
      },
      500
    );
  }
});

// Execute a view
views.post('/:id/execute', async (c) => {
  try {
    const auth = getAuth(c);
    const viewId = c.req.param('id');

    logger.info('Executing view', { userId: auth.userId, viewId });

    // Get the view
    const view = await ViewsService.getViewById(viewId, auth.userId);
    if (!view) {
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
      return c.json({
        success: false,
        error: 'Failed to connect to database. Please check your connection settings.',
      }, 400);
    }

    // Execute the query
    const startTime = Date.now();
    
    try {
      const result = await connection.unsafe(view.queryText);
      const executionTime = Date.now() - startTime;

      // Format the result
      const columns = result.length > 0 ? Object.keys(result[0]) : [];
      const rows = result.map(row => ({ ...row }));

      logger.info('View executed successfully', { 
        userId: auth.userId, 
        viewId, 
        rowCount: rows.length, 
        executionTime 
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
      return c.json({
        success: false,
        error: queryError instanceof Error ? queryError.message : 'Query execution failed',
      }, 400);
    }
  } catch (error) {
    logger.error('Failed to execute view', error);
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