/**
 * Vercel Serverless Function Entry Point
 * This file handles all API requests on Vercel
 * 
 * The server is built from app.vercel.ts (Node.js compatible)
 * not from app.prod.ts (Deno specific)
 */

// Import the Hono app from the built server
const { app } = require('../dist/server.cjs');

// Import Vercel handler for Hono
const { handle } = require('@hono/node-server/vercel');

// Export the Vercel serverless handler
module.exports = handle(app);
