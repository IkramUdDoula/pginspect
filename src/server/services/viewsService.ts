import postgres from 'postgres';
import type { CreateViewRequest, SavedView } from '../../shared/types';
import { logger } from '../utils/logger';

// Application database connection (not user's target databases)
const getAppDb = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  return postgres(dbUrl, {
    max: 3,
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
   * Get all views for a specific user and connection
   */
  static async getUserViews(userId: string, connectionId: number): Promise<SavedView[]> {
    try {
      const sql = getDb();
      const views = await sql<SavedView[]>`
        SELECT 
          id,
          user_id as "userId",
          connection_id as "connectionId",
          schema_name as "schemaName",
          view_name as "viewName",
          description,
          query_text as "queryText",
          query_type as "queryType",
          query_blocks as "queryBlocks",
          auto_refresh_interval as "autoRefreshInterval",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM saved_views
        WHERE user_id = ${userId} AND connection_id = ${connectionId}
        ORDER BY updated_at DESC
      `;
      return views;
    } catch (error) {
      logger.error('Error fetching user views', { userId, connectionId, error });
      throw error;
    }
  }

  /**
   * Get a specific view by ID
   */
  static async getViewById(viewId: string, userId: string): Promise<SavedView | null> {
    try {
      const sql = getDb();
      const views = await sql<SavedView[]>`
        SELECT 
          id,
          user_id as "userId",
          connection_id as "connectionId",
          schema_name as "schemaName",
          view_name as "viewName",
          description,
          query_text as "queryText",
          query_type as "queryType",
          query_blocks as "queryBlocks",
          auto_refresh_interval as "autoRefreshInterval",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM saved_views
        WHERE id = ${viewId} AND user_id = ${userId}
      `;
      return views.length > 0 ? views[0] : null;
    } catch (error) {
      logger.error('Error fetching view by ID', { viewId, userId, error });
      throw error;
    }
  }

  /**
   * Create a new view
   */
  static async createView(userId: string, viewData: CreateViewRequest): Promise<SavedView> {
    try {
      const sql = getDb();
      
      const result = await sql<SavedView[]>`
        INSERT INTO saved_views (
          user_id,
          connection_id,
          schema_name,
          view_name,
          description,
          query_text,
          query_type,
          query_blocks,
          auto_refresh_interval,
          created_at,
          updated_at
        ) VALUES (
          ${userId},
          ${viewData.connectionId},
          ${viewData.schemaName},
          ${viewData.viewName},
          ${viewData.description || null},
          ${viewData.queryText},
          ${viewData.queryType},
          ${viewData.queryBlocks || null},
          ${viewData.autoRefreshInterval || null},
          NOW(),
          NOW()
        )
        RETURNING 
          id,
          user_id as "userId",
          connection_id as "connectionId",
          schema_name as "schemaName",
          view_name as "viewName",
          description,
          query_text as "queryText",
          query_type as "queryType",
          query_blocks as "queryBlocks",
          auto_refresh_interval as "autoRefreshInterval",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
      
      return result[0];
    } catch (error) {
      logger.error('Error creating view', { userId, viewData, error });
      throw error;
    }
  }

  /**
   * Update an existing view
   */
  static async updateView(
    viewId: string,
    userId: string,
    updateData: Partial<CreateViewRequest>
  ): Promise<SavedView | null> {
    try {
      const sql = getDb();
      
      // Build dynamic update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updateData.viewName !== undefined) {
        updates.push(`view_name = $${paramIndex}`);
        values.push(updateData.viewName);
        paramIndex++;
      }
      if (updateData.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(updateData.description);
        paramIndex++;
      }
      if (updateData.queryText !== undefined) {
        updates.push(`query_text = $${paramIndex}`);
        values.push(updateData.queryText);
        paramIndex++;
      }
      if (updateData.queryType !== undefined) {
        updates.push(`query_type = $${paramIndex}`);
        values.push(updateData.queryType);
        paramIndex++;
      }
      if (updateData.queryBlocks !== undefined) {
        updates.push(`query_blocks = $${paramIndex}`);
        values.push(updateData.queryBlocks);
        paramIndex++;
      }
      if (updateData.autoRefreshInterval !== undefined) {
        updates.push(`auto_refresh_interval = $${paramIndex}`);
        values.push(updateData.autoRefreshInterval);
        paramIndex++;
      }

      if (updates.length === 0) {
        return this.getViewById(viewId, userId);
      }

      updates.push(`updated_at = NOW()`);
      values.push(viewId);
      values.push(userId);

      const result = await sql<SavedView[]>`
        UPDATE saved_views
        SET ${sql(updates.join(', '))}
        WHERE id = ${viewId} AND user_id = ${userId}
        RETURNING 
          id,
          user_id as "userId",
          connection_id as "connectionId",
          schema_name as "schemaName",
          view_name as "viewName",
          description,
          query_text as "queryText",
          query_type as "queryType",
          query_blocks as "queryBlocks",
          auto_refresh_interval as "autoRefreshInterval",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error('Error updating view', { viewId, userId, updateData, error });
      throw error;
    }
  }

  /**
   * Delete a view
   */
  static async deleteView(viewId: string, userId: string): Promise<boolean> {
    try {
      const sql = getDb();
      const result = await sql`
        DELETE FROM saved_views
        WHERE id = ${viewId} AND user_id = ${userId}
      `;
      return result.count > 0;
    } catch (error) {
      logger.error('Error deleting view', { viewId, userId, error });
      throw error;
    }
  }

  /**
   * Validate view data
   */
  static validateViewData(viewData: CreateViewRequest): string[] {
    const errors: string[] = [];

    if (!viewData.viewName || viewData.viewName.trim() === '') {
      errors.push('View name is required');
    }

    if (!viewData.schemaName || viewData.schemaName.trim() === '') {
      errors.push('Schema name is required');
    }

    if (!viewData.queryText || viewData.queryText.trim() === '') {
      errors.push('Query text is required');
    }

    if (!viewData.queryType || !['sql', 'visual'].includes(viewData.queryType)) {
      errors.push('Query type must be either "sql" or "visual"');
    }

    if (!viewData.connectionId || viewData.connectionId <= 0) {
      errors.push('Valid connection ID is required');
    }

    if (viewData.autoRefreshInterval !== undefined && viewData.autoRefreshInterval !== null) {
      if (typeof viewData.autoRefreshInterval !== 'number' || viewData.autoRefreshInterval < 0) {
        errors.push('Auto refresh interval must be a non-negative number');
      }
    }

    return errors;
  }
}
