/**
 * HTTP Route Handlers
 * Handlers for HTTP API endpoints
 */

import { SERVER_CONFIG } from '../config/constants.js';
import { getDatabasePassword, isPasswordConfigured } from '../config/environment.js';
import { validateDatabasePath, validateQuery } from '../utils/validators.js';
import { executeQueryOnDatabase } from '../services/database-service.js';

/**
 * Handle health check endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export function handleHealthCheck(req, res) {
    res.json({
        status: 'ok',
        message: 'SQLCipher MCP HTTP Server is running',
        passwordConfigured: isPasswordConfigured(),
    });
}

/**
 * Handle server info endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export function handleInfo(req, res) {
    res.json({
        name: SERVER_CONFIG.name,
        version: SERVER_CONFIG.version,
        description: 'HTTP wrapper for SQLCipher MCP Server',
        endpoints: {
            health: 'GET /health',
            query: 'POST /api/query',
            info: 'GET /api/info',
        },
        passwordConfigured: isPasswordConfigured(),
    });
}

/**
 * Handle query execution endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleQuery(req, res) {
    try {
        const { database_path, query } = req.body;
        
        // Validate database_path
        try {
            validateDatabasePath(database_path);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
        
        // Validate query
        try {
            validateQuery(query);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
        
        // Get database password
        const password = getDatabasePassword();
        
        // Execute query
        try {
            const result = await executeQueryOnDatabase(database_path, password, query);
            
            // Return successful response
            res.json({
                success: true,
                data: result,
                message: `Query executed successfully. ${result.rowCount} row(s) returned.`,
            });
        } catch (error) {
            res.status(400).json({
                error: `Query execution failed: ${error.message}`,
            });
        }
    } catch (error) {
        res.status(500).json({
            error: `Internal server error: ${error.message}`,
        });
    }
}
