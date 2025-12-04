/**
 * Vercel Serverless Function Server
 * This is the entry point for Vercel deployments
 * 
 * Key differences from app.prod.ts:
 * - Uses Node.js APIs (not Deno)
 * - No static file serving (handled by Vercel)
 * - Exports app for serverless function handler
 */

import { Hono } from "hono";
import { setupRoutes } from "./routes";

// Create Hono app
const app = new Hono();

// Setup API routes
setupRoutes(app);

// Export the app for Vercel handler
export { app };
