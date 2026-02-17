// Load environment variables FIRST (before any module reads process.env)
import './config/env.js';
import app from './app.js';

// Export the Express app for Vercel serverless function
export default app;
