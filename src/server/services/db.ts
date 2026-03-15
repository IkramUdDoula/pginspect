// Database connection pool management

import postgres from 'postgres';
import { logger } from '../utils/logger';
import type { ConnectionInfo } from '../../shared/types';
import { createSupabaseConnection, testSupabaseConnection } from './supabaseDb';

interface ConnectionPool {
  sql: postgres.Sql;
  info: ConnectionInfo;
  createdAt: Date;
  lastUsed: Date;
}

const connections = new Map<string, ConnectionPool>();

const MAX_CONNECTIONS = 10;
const CONNECTION_TIMEOUT = 30000; // 30 seconds
const IDLE_TIMEOUT = 300000; // 5 minutes

// Helper function to detect if this is a Supabase connection
function isSupabaseConnection(info: ConnectionInfo): boolean {
  return info.host.includes('supabase.co') || info.host.includes('pooler.supabase.com');
}

export async function createConnection(info: ConnectionInfo): Promise<{ id: string; sql: postgres.Sql }> {
  // Use alternative service for Supabase connections
  if (isSupabaseConnection(info)) {
    logger.info('Detected Supabase connection, using alternative pg client');
    const { id, pool } = await createSupabaseConnection(info);
    
    // Create a postgres.js-like interface for compatibility
    const sql = Object.assign(
      // Template literal function
      (strings: TemplateStringsArray, ...values: any[]) => {
        // Convert template literal to parameterized query
        let query = strings[0];
        const params: any[] = [];
        
        for (let i = 0; i < values.length; i++) {
          query += `$${i + 1}` + strings[i + 1];
          params.push(values[i]);
        }
        
        return (async () => {
          const client = await pool.connect();
          try {
            const result = await client.query(query, params);
            return result.rows;
          } finally {
            client.release();
          }
        })();
      },
      {
        // Add basic query method that uses the pg pool
        query: async (text: string, params?: any[]) => {
          const client = await pool.connect();
          try {
            const result = await client.query(text, params);
            return result.rows;
          } finally {
            client.release();
          }
        },
        end: () => pool.end(),
        unsafe: async (query: string) => {
          const client = await pool.connect();
          try {
            const result = await client.query(query);
            return result.rows;
          } finally {
            client.release();
          }
        },
      }
    ) as any;
    
    // Store in main connections map for getConnection() to find
    connections.set(id, {
      sql,
      info: { ...info, id },
      createdAt: new Date(),
      lastUsed: new Date(),
    });
    
    return { id, sql };
  }

  const connectionId = info.id || `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Check if we've hit the connection limit
  if (connections.size >= MAX_CONNECTIONS) {
    // Clean up idle connections
    cleanupIdleConnections();
    
    if (connections.size >= MAX_CONNECTIONS) {
      throw new Error('Maximum number of connections reached');
    }
  }

  try {
    logger.info('Creating database connection', { 
      connectionId, 
      host: info.host, 
      port: info.port, 
      database: info.database, 
      user: info.user,
      sslMode: info.sslMode 
    });

    // Enhanced SSL configuration for Supabase compatibility
    const sslConfig = info.sslMode === 'require' ? {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined, // Disable hostname verification for cloud providers
    } : false;

    const sql = postgres({
      host: info.host,
      port: info.port,
      database: info.database,
      username: info.user,
      password: info.password,
      ssl: sslConfig,
      max: parseInt(process.env.DB_POOL_MAX || '3'), // Reduced from 10 to 3 for Supabase compatibility
      idle_timeout: 20,
      connect_timeout: CONNECTION_TIMEOUT / 1000,
      onnotice: () => {}, // Suppress notices
      // Add specific options for better Supabase compatibility
      prepare: false, // Disable prepared statements which can cause issues with poolers
      transform: {
        undefined: null, // Transform undefined to null for better compatibility
      },
    });

    // Test connection
    await sql`SELECT 1`;

    connections.set(connectionId, {
      sql,
      info: { ...info, id: connectionId },
      createdAt: new Date(),
      lastUsed: new Date(),
    });

    logger.info('Database connection created successfully', { connectionId, host: info.host, database: info.database });

    return { id: connectionId, sql };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to create database connection', { 
      host: info.host, 
      database: info.database,
      error: errorMessage,
      errorCode: (error as any)?.code,
      errorSeverity: (error as any)?.severity
    });
    throw new Error(`Connection failed: ${errorMessage}`);
  }
}

export function getConnection(connectionId: string): postgres.Sql | null {
  const pool = connections.get(connectionId);
  if (!pool) {
    return null;
  }

  // Update last used timestamp
  pool.lastUsed = new Date();
  return pool.sql;
}

export async function closeConnection(connectionId: string): Promise<void> {
  const pool = connections.get(connectionId);
  if (!pool) {
    return;
  }

  // Always remove from map first so it's not reused
  connections.delete(connectionId);

  try {
    await pool.sql.end({ timeout: 5 });
    logger.info('Database connection closed', { connectionId });
  } catch {
    // Connection was already terminated (e.g. idle timeout at DB level) — safe to ignore
  }
}

export async function testConnection(info: ConnectionInfo): Promise<{ success: boolean; serverVersion?: string; error?: string }> {
  // Use alternative service for Supabase connections
  if (isSupabaseConnection(info)) {
    logger.info('Testing Supabase connection with pg client');
    return testSupabaseConnection(info);
  }

  let sql: postgres.Sql | null = null;

  try {
    // Log connection attempt (without password)
    logger.info('Testing database connection', { 
      host: info.host, 
      port: info.port, 
      database: info.database, 
      user: info.user,
      sslMode: info.sslMode 
    });

    // Enhanced SSL configuration for Supabase compatibility
    const sslConfig = info.sslMode === 'require' ? {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined, // Disable hostname verification for cloud providers
    } : false;

    sql = postgres({
      host: info.host,
      port: info.port,
      database: info.database,
      username: info.user,
      password: info.password,
      ssl: sslConfig,
      max: 1,
      connect_timeout: 10,
      // Add specific options for better Supabase compatibility
      prepare: false, // Disable prepared statements which can cause issues with poolers
      transform: {
        undefined: null, // Transform undefined to null for better compatibility
      },
    });

    const result = await sql`SELECT version()`;
    const version = result[0]?.version || 'Unknown';

    await sql.end();

    logger.info('Database connection test successful', { host: info.host, version });
    return { success: true, serverVersion: version };
  } catch (error) {
    if (sql) {
      try {
        await sql.end();
      } catch {}
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Database connection test failed', { 
      host: info.host, 
      error: errorMessage,
      errorCode: (error as any)?.code,
      errorSeverity: (error as any)?.severity
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

async function cleanupIdleConnections(): Promise<void> {
  const now = Date.now();
  const toRemove: string[] = [];

  for (const [id, pool] of connections.entries()) {
    if (now - pool.lastUsed.getTime() > IDLE_TIMEOUT) {
      toRemove.push(id);
    }
  }

  if (toRemove.length > 0) {
    await Promise.all(toRemove.map(id => closeConnection(id)));
    logger.info('Cleaned up idle connections', { count: toRemove.length });
  }
}

// Cleanup idle connections every minute
setInterval(() => cleanupIdleConnections().catch(() => {}), 60000);

// Cleanup all connections on process exit
process.on('SIGTERM', async () => {
  logger.info('Closing all database connections');
  const promises = Array.from(connections.keys()).map(id => closeConnection(id));
  await Promise.all(promises);
});
