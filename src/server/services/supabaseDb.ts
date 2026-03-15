// Alternative database connection service using pg library for better Supabase compatibility

import { Pool, Client } from 'pg';
import { logger } from '../utils/logger';
import type { ConnectionInfo } from '../../shared/types';

interface ConnectionPool {
  pool: Pool;
  info: ConnectionInfo;
  createdAt: Date;
  lastUsed: Date;
}

const connections = new Map<string, ConnectionPool>();

const MAX_CONNECTIONS = 10;
const CONNECTION_TIMEOUT = 30000; // 30 seconds
const IDLE_TIMEOUT = 300000; // 5 minutes

export async function createSupabaseConnection(info: ConnectionInfo): Promise<{ id: string; pool: Pool }> {
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
    logger.info('Creating Supabase database connection', { 
      connectionId, 
      host: info.host, 
      port: info.port, 
      database: info.database, 
      user: info.user,
      sslMode: info.sslMode 
    });

    // Enhanced configuration for Supabase compatibility
    const poolConfig = {
      host: info.host,
      port: info.port,
      database: info.database,
      user: info.user,
      password: info.password,
      ssl: info.sslMode === 'require' ? {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
      } : false,
      max: 10, // Maximum number of clients in the pool
      min: 0, // Minimum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: CONNECTION_TIMEOUT,
      // Specific options for Supabase SCRAM authentication
      application_name: 'pgInspect',
      statement_timeout: 30000,
      query_timeout: 30000,
    };

    const pool = new Pool(poolConfig);

    // Test connection
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }

    connections.set(connectionId, {
      pool,
      info: { ...info, id: connectionId },
      createdAt: new Date(),
      lastUsed: new Date(),
    });

    logger.info('Supabase database connection created successfully', { 
      connectionId, 
      host: info.host, 
      database: info.database 
    });

    return { id: connectionId, pool };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to create Supabase database connection', { 
      host: info.host, 
      database: info.database,
      error: errorMessage,
      errorCode: (error as any)?.code,
      errorSeverity: (error as any)?.severity
    });
    throw new Error(`Connection failed: ${errorMessage}`);
  }
}

export function getSupabaseConnection(connectionId: string): Pool | null {
  const connection = connections.get(connectionId);
  if (!connection) {
    return null;
  }

  // Update last used timestamp
  connection.lastUsed = new Date();
  return connection.pool;
}

export async function closeSupabaseConnection(connectionId: string): Promise<void> {
  const connection = connections.get(connectionId);
  if (!connection) {
    return;
  }

  // Always remove from map first so it's not reused
  connections.delete(connectionId);

  try {
    await connection.pool.end();
    logger.info('Supabase database connection closed', { connectionId });
  } catch {
    // Connection was already terminated — safe to ignore
  }
}

export async function testSupabaseConnection(info: ConnectionInfo): Promise<{ success: boolean; serverVersion?: string; error?: string }> {
  let client: Client | null = null;

  try {
    logger.info('Testing Supabase database connection', { 
      host: info.host, 
      port: info.port, 
      database: info.database, 
      user: info.user,
      sslMode: info.sslMode 
    });

    const clientConfig = {
      host: info.host,
      port: info.port,
      database: info.database,
      user: info.user,
      password: info.password,
      ssl: info.sslMode === 'require' ? {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
      } : false,
      connectionTimeoutMillis: 10000,
      // Specific options for Supabase SCRAM authentication
      application_name: 'pgInspect_test',
      statement_timeout: 10000,
      query_timeout: 10000,
    };

    client = new Client(clientConfig);
    await client.connect();

    const result = await client.query('SELECT version()');
    const version = result.rows[0]?.version || 'Unknown';

    await client.end();

    logger.info('Supabase database connection test successful', { host: info.host, version });
    return { success: true, serverVersion: version };
  } catch (error) {
    if (client) {
      try {
        await client.end();
      } catch {}
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Supabase database connection test failed', { 
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

  for (const [id, connection] of connections.entries()) {
    if (now - connection.lastUsed.getTime() > IDLE_TIMEOUT) {
      toRemove.push(id);
    }
  }

  if (toRemove.length > 0) {
    await Promise.all(toRemove.map(id => closeSupabaseConnection(id)));
    logger.info('Cleaned up idle Supabase connections', { count: toRemove.length });
  }
}

// Cleanup idle connections every minute
setInterval(() => cleanupIdleConnections().catch(() => {}), 60000);

// Cleanup all connections on process exit
process.on('SIGTERM', async () => {
  logger.info('Closing all Supabase database connections');
  const promises = Array.from(connections.keys()).map(id => closeSupabaseConnection(id));
  await Promise.all(promises);
});