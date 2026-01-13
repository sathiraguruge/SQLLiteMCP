/**
 * HTTP Server
 * Express HTTP server setup and initialization
 */

import express from 'express';
import { HTTP_CONFIG } from '../config/constants.js';
import { getPort, isPasswordConfigured } from '../config/environment.js';
import { handleHealthCheck, handleInfo, handleQuery } from '../handlers/http-handlers.js';

/**
 * Create and configure Express app
 * @returns {express.Application} Configured Express app
 */
export function createHttpApp() {
    const app = express();
    
    // Middleware to parse JSON request bodies
    app.use(express.json());
    
    // Register routes
    app.get('/health', handleHealthCheck);
    app.get('/api/info', handleInfo);
    app.post('/api/query', handleQuery);
    
    return app;
}

/**
 * Start the HTTP server
 * @param {number} [port] - Port to listen on (defaults to env or 3000)
 * @returns {Promise<void>}
 */
export async function startHttpServer(port) {
    const app = createHttpApp();
    const serverPort = port || getPort(HTTP_CONFIG.defaultPort);
    
    return new Promise((resolve) => {
        app.listen(serverPort, () => {
            console.log(`SQLCipher MCP HTTP Server running on http://localhost:${serverPort}`);
            console.log(`Health check: http://localhost:${serverPort}/health`);
            console.log(`API info: http://localhost:${serverPort}/api/info`);
            
            if (!isPasswordConfigured()) {
                console.warn('\n⚠️  Warning: SQLCIPHER_PASSWORD environment variable is not set.');
                console.warn('   Database queries will fail until this is configured.\n');
            } else {
                console.log('✅ Database password is configured.\n');
            }
            
            resolve();
        });
    });
}
