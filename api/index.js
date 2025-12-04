/**
 * Vercel Serverless Function Entry Point
 * This file is the serverless function that handles all API requests on Vercel
 * It imports and runs the Hono server from the built distribution
 */

import { app } from '../dist/server.cjs';
import { handle } from '@hono/node-server/vercel';

// Export the Vercel serverless handler
export default handle(app);
