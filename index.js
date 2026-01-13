#!/usr/bin/env node

/**
 * SQLCipher MCP Server - Entry Point
 * Provides read-only access to SQLCipher-encrypted SQLite databases via MCP
 */

import { startMcpServer } from './src/server/mcp-server.js';

// Start the server
startMcpServer().catch((error) => {
    console.error('Fatal error starting server:', error);
    process.exit(1);
});
