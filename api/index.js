/**
 * Vercel Serverless Function Entry Point
 * This file handles all API requests on Vercel
 * 
 * The server is built from app.vercel.ts (Node.js compatible)
 * not from app.prod.ts (Deno specific)
 */

// Wrap everything in try-catch to capture initialization errors
let handler;

try {
  console.log('[Vercel Function] Starting initialization...');
  
  // Import the Hono app from the built server
  const serverModule = require('../dist/server.cjs');
  
  if (!serverModule || !serverModule.app) {
    throw new Error('Server module or app not found in dist/server.cjs');
  }
  
  console.log('[Vercel Function] Server module loaded successfully');
  
  // Import Vercel handler for Hono
  const { handle } = require('@hono/node-server/vercel');
  
  console.log('[Vercel Function] Vercel handler loaded successfully');
  
  // Create the handler
  handler = handle(serverModule.app);
  
  console.log('[Vercel Function] ✅ Initialization complete');
} catch (error) {
  console.error('[Vercel Function] ❌ CRITICAL ERROR during initialization:', error);
  console.error('[Vercel Function] Error stack:', error.stack);
  
  // Create a fallback handler that returns the error
  handler = (req, res) => {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Serverless function initialization failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }));
  };
}

// Export the handler (either working handler or error handler)
module.exports = handler;
