// Server entry point for Node.js runtime

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { logger } from './utils/logger';
import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';

// Routes
import health from './routes/health';
import connections from './routes/connections';
import schema from './routes/schema';
import queries from './routes/queries';
import views from './routes/views';
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
app.route('/api/views', views);
app.route('/api/test', test);

// Serve static files in production or proxy to Vite in development
if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './dist' }));
  app.get('*', serveStatic({ path: './dist/index.html' }));
} else {
  // In development, proxy non-API requests to Vite dev server
  app.get('*', async (c) => {
    const url = new URL(c.req.url);
    
    // Don't proxy API routes
    if (url.pathname.startsWith('/api')) {
      return c.notFound();
    }
    
    try {
      // Proxy to Vite dev server
      const vitePort = process.env.VITE_PORT || '8080';
      const viteUrl = `http://localhost:${vitePort}${url.pathname}${url.search}`;
      const response = await fetch(viteUrl, {
        method: c.req.method,
        headers: c.req.header(),
        body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? await c.req.arrayBuffer() : undefined,
      });
      
      // Copy response headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      logger.error('Failed to proxy to Vite dev server', { error: error.message });
      return c.text('Vite dev server not available', 503);
    }
  });
}

const PORT = parseInt(process.env.PORT || '3000');

logger.info('Starting server', {
  port: PORT,
  environment: process.env.NODE_ENV || 'development',
});

// Start the server using Node.js HTTP server
serve({
  fetch: app.fetch,
  port: PORT,
});

console.log(`Server running on http://localhost:${PORT}`);