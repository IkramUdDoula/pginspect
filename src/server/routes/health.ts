// Health check routes

import { Hono } from 'hono';

const health = new Hono();

const startTime = Date.now();

health.get('/', (c) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  return c.json({
    success: true,
    data: {
      status: 'ok',
      uptime,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

export default health;
