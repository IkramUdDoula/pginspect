// Clerk authentication middleware

import { createClerkClient } from '@clerk/backend';
import type { Context, Next } from 'hono';
import { logger } from '../utils/logger';
import { ensureUser } from '../services/userSync';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export interface AuthContext {
  userId: string;
  sessionId: string;
}

export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    
    // Create a minimal Request object for authenticateRequest
    const request = new Request('http://localhost', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Use authenticateRequest from Clerk backend SDK
    const authResult = await clerkClient.authenticateRequest(request, {
      secretKey: process.env.CLERK_SECRET_KEY!,
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
      authorizedParties: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://pginspect-production-3e4b.up.railway.app',
        ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
      ],
    });
    
    if (!authResult.isSignedIn) {
      return c.json({ success: false, error: 'Invalid session' }, 401);
    }

    const authObject = authResult.toAuth();
    
    // Sync user to database (creates or updates user record)
    try {
      await ensureUser(authObject.userId!);
    } catch (error) {
      logger.error('Failed to sync user to database', error);
      // Continue anyway - user sync is not critical for authentication
    }
    
    // Attach user info to context
    c.set('auth', {
      userId: authObject.userId!,
      sessionId: authObject.sessionId!,
    } as AuthContext);

    await next();
  } catch (error) {
    logger.error('Authentication failed', error);
    return c.json({ success: false, error: 'Authentication failed' }, 401);
  }
}

export function getAuth(c: Context): AuthContext {
  const auth = c.get('auth') as AuthContext;
  if (!auth) {
    throw new Error('Authentication context not found');
  }
  return auth;
}
