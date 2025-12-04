/**
 * Vercel Serverless Function Entry Point
 * This file handles all API requests on Vercel
 * 
 * CRITICAL: This must be as simple and bulletproof as possible
 * Any initialization errors will cause FUNCTION_INVOCATION_FAILED
 */

// Simple error handler that always works
function createErrorHandler(error) {
  console.error('[Vercel Function] INITIALIZATION ERROR:', error);
  console.error('[Vercel Function] Error stack:', error?.stack);
  
  return (req, res) => {
    console.error('[Vercel Function] Request to failed function:', req.url);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Serverless function failed to initialize',
      message: error?.message || 'Unknown error',
      url: req.url,
      timestamp: new Date().toISOString(),
      hint: 'Check Vercel function logs for detailed error'
    }));
  };
}

// Main initialization with comprehensive error handling
try {
  console.log('[Vercel Function] Step 1: Starting initialization...');
  console.log('[Vercel Function] Step 2: Loading @hono/node-server/vercel...');
  
  // Load Hono Vercel adapter first
  const { handle } = require('@hono/node-server/vercel');
  console.log('[Vercel Function] Step 3: @hono/node-server/vercel loaded ✓');
  
  console.log('[Vercel Function] Step 4: Loading server module from dist/server.cjs...');
  
  // Load the compiled server
  const serverModule = require('../dist/server.cjs');
  console.log('[Vercel Function] Step 5: Server module loaded ✓');
  
  // Validate the module
  if (!serverModule) {
    throw new Error('Server module is null or undefined');
  }
  
  if (!serverModule.app) {
    console.error('[Vercel Function] Server module contents:', Object.keys(serverModule));
    throw new Error('Server module does not export "app". Available exports: ' + Object.keys(serverModule).join(', '));
  }
  
  console.log('[Vercel Function] Step 6: Creating Vercel handler...');
  
  // Create the handler
  const handler = handle(serverModule.app);
  console.log('[Vercel Function] ✅ INITIALIZATION SUCCESS - Handler ready');
  
  // Export the working handler
  module.exports = handler;
  
} catch (error) {
  console.error('[Vercel Function] ❌ FATAL ERROR during initialization');
  console.error('[Vercel Function] Error type:', error?.constructor?.name);
  console.error('[Vercel Function] Error message:', error?.message);
  console.error('[Vercel Function] Error stack:', error?.stack);
  
  // Export error handler that will return the actual error to help debug
  module.exports = createErrorHandler(error);
}
