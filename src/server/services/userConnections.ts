// User connections database service

import postgres from 'postgres';
import { encrypt, decrypt } from '../../lib/encryption';
import { logger } from '../utils/logger';
import type { ConnectionInfo } from '../../shared/types';

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

export interface SavedConnection {
  id: number;
  userId: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  sslMode: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function saveUserConnection(
  userId: string,
  connection: ConnectionInfo
): Promise<SavedConnection> {
  const sql = getDb();
  
  try {
    const encryptedPassword = encrypt(connection.password);
    
    const result = await sql`
      INSERT INTO user_connections (
        user_id, name, host, port, database, username, password_encrypted, ssl_mode
      ) VALUES (
        ${userId}, ${connection.name}, ${connection.host}, ${connection.port},
        ${connection.database}, ${connection.user}, ${encryptedPassword}, ${connection.sslMode}
      )
      ON CONFLICT (user_id, name) 
      DO UPDATE SET
        host = EXCLUDED.host,
        port = EXCLUDED.port,
        database = EXCLUDED.database,
        username = EXCLUDED.username,
        password_encrypted = EXCLUDED.password_encrypted,
        ssl_mode = EXCLUDED.ssl_mode,
        updated_at = NOW()
      RETURNING id, user_id, name, host, port, database, username, ssl_mode, created_at, updated_at
    `;
    
    if (result.length === 0) {
      throw new Error('Failed to save connection');
    }
    
    logger.info('User connection saved', { userId, connectionName: connection.name });
    
    return {
      id: result[0].id as number,
      userId: result[0].user_id as string,
      name: result[0].name as string,
      host: result[0].host as string,
      port: result[0].port as number,
      database: result[0].database as string,
      username: result[0].username as string,
      sslMode: result[0].ssl_mode as string,
      createdAt: result[0].created_at as Date,
      updatedAt: result[0].updated_at as Date,
    };
  } catch (error) {
    logger.error('Failed to save user connection', error, { userId, connectionName: connection.name });
    throw error;
  }
}

export async function getUserConnections(userId: string): Promise<ConnectionInfo[]> {
  const sql = getDb();
  
  try {
    const result = await sql`
      SELECT id, name, host, port, database, username, password_encrypted, ssl_mode, created_at, updated_at
      FROM user_connections
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `;
    
    return result.map(row => ({
      id: `saved_${row.id}`,
      name: row.name as string,
      host: row.host as string,
      port: row.port as number,
      database: row.database as string,
      user: row.username as string,
      password: decrypt(row.password_encrypted as string),
      sslMode: row.ssl_mode as string,
      status: 'disconnected' as const,
    }));
  } catch (error) {
    logger.error('Failed to get user connections', error, { userId });
    throw error;
  }
}

export async function getUserConnection(userId: string, connectionName: string): Promise<ConnectionInfo | null> {
  const sql = getDb();
  
  try {
    const result = await sql`
      SELECT id, name, host, port, database, username, password_encrypted, ssl_mode
      FROM user_connections
      WHERE user_id = ${userId} AND name = ${connectionName}
      LIMIT 1
    `;
    
    if (result.length === 0) {
      return null;
    }
    
    const row = result[0];
    return {
      id: `saved_${row.id}`,
      name: row.name as string,
      host: row.host as string,
      port: row.port as number,
      database: row.database as string,
      user: row.username as string,
      password: decrypt(row.password_encrypted as string),
      sslMode: row.ssl_mode as string,
      status: 'disconnected' as const,
    };
  } catch (error) {
    logger.error('Failed to get user connection', error, { userId, connectionName });
    throw error;
  }
}

export async function deleteUserConnection(userId: string, connectionName: string): Promise<boolean> {
  const sql = getDb();
  
  try {
    const result = await sql`
      DELETE FROM user_connections
      WHERE user_id = ${userId} AND name = ${connectionName}
      RETURNING id
    `;
    
    if (result.length > 0) {
      logger.info('User connection deleted', { userId, connectionName });
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Failed to delete user connection', error, { userId, connectionName });
    throw error;
  }
}

// Cleanup on shutdown
process.on('SIGTERM', async () => {
  if (appDb) {
    await appDb.end();
  }
});
