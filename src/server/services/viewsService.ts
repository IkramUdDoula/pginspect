// Views service for managing saved views

import postgres from 'postgres';
import { logger } from '../utils/logger';
import type { SavedView, CreateViewRequest, UpdateViewRequest } from '../../shared/types';

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

export class ViewsService {
  /**
   * Get all views for a user and connection
   */
  static async getUserViews(userId: string, connectionId: number): Promise<SavedView[]> {
    const sql = getDb();
    
    try {
      const result = await sql`
        SELECT 
          id,
          user_id,
          connection_id,
          schema_name,
          view_name,
          description,
          query_text,
          query_type,
          created_at,
          updated_at
        FROM saved_views 
        WHERE user_id = ${userId} AND connection_id = ${connectionId}
        ORDER BY updated_at DESC
      `;

      return result.map(row => ({
        id: row.id,
        userId: row.user_id,
        connectionId: row.connection_id,
        schemaName: row.schema_name,
        viewName: row.view_name,
        description: row.description,
        queryText: row.query_text,
        queryType: row.query_type as 'sql' | 'visual',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    } catch (error) {
      logger.error('Failed to get user views', { userId, connectionId, error });
      throw new Error('Failed to retrieve views');
    }
  }

  /**
   * Get a specific view by ID
   */
  static async getViewById(viewId: string, userId: string): Promise<SavedView | null> {
    const sql = getDb();
    
    try {
      const result = await sql`
        SELECT 
          id,
          user_id,
          connection_id,
          schema_name,
          view_name,
          description,
          query_text,
          query_type,
          created_at,
          updated_at
        FROM saved_views 
        WHERE id = ${viewId} AND user_id = ${userId}
      `;

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      return {
        id: row.id,
        userId: row.user_id,
        connectionId: row.connection_id,
        schemaName: row.schema_name,
        viewName: row.view_name,
        description: row.description,
        queryText: row.query_text,
        queryType: row.query_type as 'sql' | 'visual',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    } catch (error) {
      logger.error('Failed to get view by ID', { viewId, userId, error });
      throw new Error('Failed to retrieve view');
    }
  }

  /**
   * Create a new view
   */
  static async createView(userId: string, viewData: CreateViewRequest): Promise<SavedView> {
    console.log('=== ViewsService: createView called ===');
    console.log('ViewsService: userId =', userId);
    console.log('ViewsService: viewData =', viewData);
    
    const sql = getDb();
    
    try {
      // Validate view name uniqueness
      console.log('ViewsService: Checking view name uniqueness...');
      const existing = await sql`
        SELECT id FROM saved_views 
        WHERE user_id = ${userId} 
        AND connection_id = ${viewData.connectionId} 
        AND view_name = ${viewData.viewName}
      `;
      console.log('ViewsService: Existing views with same name =', existing);

      if (existing.length > 0) {
        console.log('ViewsService: ERROR - View name already exists');
        throw new Error('A view with this name already exists for this connection');
      }

      console.log('ViewsService: Inserting new view into database...');
      const result = await sql`
        INSERT INTO saved_views (
          user_id,
          connection_id,
          schema_name,
          view_name,
          description,
          query_text,
          query_type
        ) VALUES (
          ${userId},
          ${viewData.connectionId},
          ${viewData.schemaName},
          ${viewData.viewName},
          ${viewData.description || null},
          ${viewData.queryText},
          ${viewData.queryType}
        )
        RETURNING 
          id,
          user_id,
          connection_id,
          schema_name,
          view_name,
          description,
          query_text,
          query_type,
          created_at,
          updated_at
      `;
      console.log('ViewsService: Insert result =', result);

      const row = result[0];
      const savedView = {
        id: row.id,
        userId: row.user_id,
        connectionId: row.connection_id,
        schemaName: row.schema_name,
        viewName: row.view_name,
        description: row.description,
        queryText: row.query_text,
        queryType: row.query_type as 'sql' | 'visual',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
      
      console.log('ViewsService: Created savedView object =', savedView);
      return savedView;
    } catch (error) {
      console.log('ViewsService: ERROR - Exception in createView');
      console.error('ViewsService: Exception details =', error);
      logger.error('Failed to create view', { userId, viewData, error });
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create view');
    }
  }

  /**
   * Update an existing view
   */
  static async updateView(viewId: string, userId: string, updates: UpdateViewRequest): Promise<SavedView> {
    const sql = getDb();
    
    try {
      // Check if view exists and belongs to user
      const existing = await this.getViewById(viewId, userId);
      if (!existing) {
        throw new Error('View not found');
      }

      // If updating name, check uniqueness
      if (updates.viewName && updates.viewName !== existing.viewName) {
        const nameCheck = await sql`
          SELECT id FROM saved_views 
          WHERE user_id = ${userId} 
          AND connection_id = ${existing.connectionId} 
          AND view_name = ${updates.viewName}
          AND id != ${viewId}
        `;

        if (nameCheck.length > 0) {
          throw new Error('A view with this name already exists for this connection');
        }
      }

      const result = await sql`
        UPDATE saved_views 
        SET 
          view_name = COALESCE(${updates.viewName}, view_name),
          description = COALESCE(${updates.description}, description),
          query_text = COALESCE(${updates.queryText}, query_text),
          query_type = COALESCE(${updates.queryType}, query_type),
          updated_at = NOW()
        WHERE id = ${viewId} AND user_id = ${userId}
        RETURNING 
          id,
          user_id,
          connection_id,
          schema_name,
          view_name,
          description,
          query_text,
          query_type,
          created_at,
          updated_at
      `;

      if (result.length === 0) {
        throw new Error('View not found');
      }

      const row = result[0];
      return {
        id: row.id,
        userId: row.user_id,
        connectionId: row.connection_id,
        schemaName: row.schema_name,
        viewName: row.view_name,
        description: row.description,
        queryText: row.query_text,
        queryType: row.query_type as 'sql' | 'visual',
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    } catch (error) {
      logger.error('Failed to update view', { viewId, userId, updates, error });
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update view');
    }
  }

  /**
   * Delete a view
   */
  static async deleteView(viewId: string, userId: string): Promise<boolean> {
    const sql = getDb();
    
    try {
      const result = await sql`
        DELETE FROM saved_views 
        WHERE id = ${viewId} AND user_id = ${userId}
      `;

      return result.count > 0;
    } catch (error) {
      logger.error('Failed to delete view', { viewId, userId, error });
      throw new Error('Failed to delete view');
    }
  }

  /**
   * Validate view data
   */
  static validateViewData(data: CreateViewRequest | UpdateViewRequest): string[] {
    const errors: string[] = [];

    if ('viewName' in data && data.viewName !== undefined) {
      if (!data.viewName || data.viewName.trim().length === 0) {
        errors.push('View name is required');
      } else if (data.viewName.length > 255) {
        errors.push('View name must be 255 characters or less');
      } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(data.viewName)) {
        errors.push('View name can only contain letters, numbers, spaces, hyphens, and underscores');
      }
    }

    if ('description' in data && data.description !== undefined && data.description !== null) {
      if (data.description.length > 1000) {
        errors.push('Description must be 1000 characters or less');
      }
    }

    if ('queryText' in data && data.queryText !== undefined) {
      if (!data.queryText || data.queryText.trim().length === 0) {
        errors.push('Query text is required');
      }
    }

    if ('queryType' in data && data.queryType !== undefined) {
      if (!['sql', 'visual'].includes(data.queryType)) {
        errors.push('Query type must be either "sql" or "visual"');
      }
    }

    if ('connectionId' in data && data.connectionId !== undefined) {
      if (!Number.isInteger(data.connectionId) || data.connectionId <= 0) {
        errors.push('Connection ID must be a positive integer');
      }
    }

    return errors;
  }
}

// Cleanup on shutdown
process.on('SIGTERM', async () => {
  if (appDb) {
    await appDb.end();
  }
});