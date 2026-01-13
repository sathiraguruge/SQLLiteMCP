#!/usr/bin/env node

/**
 * SQLCipher MCP HTTP Server - Entry Point
 * HTTP wrapper for testing the SQLCipher MCP Server with tools like Postman
 */

import { startHttpServer } from './src/server/http-server.js';

// Start the server
startHttpServer().catch((error) => {
    console.error('Fatal error starting HTTP server:', error);
    process.exit(1);
});
