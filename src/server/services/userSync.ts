// User synchronization service
// Syncs Clerk users to local database

import postgres from 'postgres';
import { createClerkClient } from '@clerk/backend';
import { logger } from '../utils/logger';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Application database connection
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

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sync a user from Clerk to local database
 * Called automatically when a user authenticates
 */
export async function syncUser(userId: string): Promise<UserRecord> {
  const sql = getDb();
  
  try {
    // Fetch user details from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    
    const email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;
    
    if (!email) {
      throw new Error('User email not found in Clerk');
    }
    
    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null;
    const imageUrl = clerkUser.imageUrl || null;
    
    // Upsert user to database
    const result = await sql`
      INSERT INTO users (id, email, name, image_url)
      VALUES (${userId}, ${email}, ${name}, ${imageUrl})
      ON CONFLICT (id) 
      DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        image_url = EXCLUDED.image_url,
        updated_at = NOW()
      RETURNING id, email, name, image_url, created_at, updated_at
    `;
    
    if (result.length === 0) {
      throw new Error('Failed to sync user');
    }
    
    logger.info('User synced from Clerk', { userId, email });
    
    return {
      id: result[0].id as string,
      email: result[0].email as string,
      name: result[0].name as string | null,
      imageUrl: result[0].image_url as string | null,
      createdAt: result[0].created_at as Date,
      updatedAt: result[0].updated_at as Date,
    };
  } catch (error) {
    logger.error('Failed to sync user from Clerk', error, { userId });
    throw error;
  }
}

/**
 * Get user from local database
 */
export async function getUser(userId: string): Promise<UserRecord | null> {
  const sql = getDb();
  
  try {
    const result = await sql`
      SELECT id, email, name, image_url, created_at, updated_at
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `;
    
    if (result.length === 0) {
      return null;
    }
    
    return {
      id: result[0].id as string,
      email: result[0].email as string,
      name: result[0].name as string | null,
      imageUrl: result[0].image_url as string | null,
      createdAt: result[0].created_at as Date,
      updatedAt: result[0].updated_at as Date,
    };
  } catch (error) {
    logger.error('Failed to get user', error, { userId });
    throw error;
  }
}

/**
 * Get or sync user (ensures user exists in database)
 */
export async function ensureUser(userId: string): Promise<UserRecord> {
  // Try to get from database first
  let user = await getUser(userId);
  
  // If not found, sync from Clerk
  if (!user) {
    user = await syncUser(userId);
  }
  
  return user;
}

// Cleanup on shutdown
process.on('SIGTERM', async () => {
  if (appDb) {
    await appDb.end();
  }
});
