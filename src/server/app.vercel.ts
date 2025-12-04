/**
 * Vercel Serverless Function Server
 * This is the entry point for Vercel deployments
 * 
 * Key differences from app.prod.ts:
 * - Uses Node.js APIs (not Deno)
 * - No static file serving (handled by Vercel)
 * - Exports app for serverless function handler
 * - Includes error handling middleware
 */

import { Hono } from "hono";
import { setupRoutes } from "./routes";

// Create Hono app
const app = new Hono();

// Add health check endpoint (before other routes)
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    hasDatabase: !!process.env.DATABASE_URL
  });
});

// Global error handler middleware
app.onError((err, c) => {
  console.error('[Hono Error Handler] Caught error:', err);
  console.error('[Hono Error Handler] Error stack:', err.stack);
  console.error('[Hono Error Handler] Request URL:', c.req.url);
  console.error('[Hono Error Handler] Request method:', c.req.method);
  
  return c.json({
    error: 'Internal server error',
    message: err.message,
    path: c.req.url,
    method: c.req.method,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  }, 500);
});

// Setup API routes (wrapped in try-catch)
try {
  setupRoutes(app);
  console.log('[Vercel Server] ✅ Routes setup complete');
} catch (error) {
  console.error('[Vercel Server] ❌ ERROR setting up routes:', error);
  throw error;
}

// Export the app for Vercel handler
export { app };
