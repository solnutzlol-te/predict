/**
 * Vercel Serverless Function Server
 * This is the entry point for Vercel deployments
 * 
 * Key differences from app.prod.ts:
 * - Uses Node.js APIs (not Deno)
 * - No static file serving (handled by Vercel)
 * - Exports app for serverless function handler
 * - Includes comprehensive error handling
 */

import { Hono } from "hono";
import { setupRoutes } from "./routes";

console.log('[Vercel Server] Initializing Hono app...');

// Create Hono app
const app = new Hono();

console.log('[Vercel Server] Adding health check endpoint...');

// Add health check endpoint (before other routes)
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    hasDatabase: !!process.env.DATABASE_URL,
    message: 'Serverless function is running'
  });
});

console.log('[Vercel Server] Adding global error handler...');

// Global error handler middleware - catches all errors in routes
app.onError((err, c) => {
  console.error('[Hono Error Handler] ❌ Caught error in route:', c.req.url);
  console.error('[Hono Error Handler] Error:', err);
  console.error('[Hono Error Handler] Error stack:', err.stack);
  console.error('[Hono Error Handler] Request method:', c.req.method);
  
  return c.json({
    error: 'Internal server error',
    message: err.message,
    path: c.req.url,
    method: c.req.method,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    hint: 'Check Vercel function logs for detailed information'
  }, 500);
});

console.log('[Vercel Server] Setting up API routes...');

// Setup API routes with error handling
try {
  setupRoutes(app);
  console.log('[Vercel Server] ✅ Routes setup complete');
} catch (error) {
  console.error('[Vercel Server] ❌ CRITICAL ERROR setting up routes:', error);
  console.error('[Vercel Server] Error stack:', error instanceof Error ? error.stack : 'No stack');
  
  // Add a catch-all error route
  app.all('/api/*', (c) => {
    return c.json({
      error: 'Routes failed to initialize',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      hint: 'The serverless function started but routes failed to set up'
    }, 500);
  });
  
  console.error('[Vercel Server] ⚠️ Added fallback error route');
}

console.log('[Vercel Server] Exporting app...');

// Export the app for Vercel handler
export { app };

console.log('[Vercel Server] ✅ Module initialization complete');
