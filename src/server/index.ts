// Server entry point

import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { logger } from './utils/logger';
import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';

// Routes
import health from './routes/health';
import connections from './routes/connections';
import schema from './routes/schema';
import queries from './routes/queries';
import test from './routes/test';

const app = new Hono();

// Middleware
app.use('*', corsMiddleware);
app.onError(errorHandler);

// API Routes
app.route('/api/health', health);
app.route('/api/connections', connections);
app.route('/api/schema', schema);
app.route('/api/query', queries);
app.route('/api/test', test);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './dist' }));
  app.get('*', serveStatic({ path: './dist/index.html' }));
}

const PORT = parseInt(process.env.PORT || '3000');

logger.info('Starting server', {
  port: PORT,
  environment: process.env.NODE_ENV || 'development',
});

export default {
  port: PORT,
  fetch: app.fetch,
};
