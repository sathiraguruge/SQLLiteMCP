#!/usr/bin/env node

/**
 * HTTP Wrapper Server for SQLCipher MCP Server
 * This allows testing the server with HTTP clients like Postman
 */

import express from 'express';
import { connectDatabase, executeQuery, closeConnection } from './lib/database.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Get database password from environment variable
const DB_PASSWORD = process.env.SQLCIPHER_PASSWORD;

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'SQLCipher MCP HTTP Server is running',
        passwordConfigured: !!DB_PASSWORD
    });
});

/**
 * Execute a SELECT query on a SQLCipher database
 * POST /api/query
 * Body: {
 *   "database_path": "path/to/database.db",
 *   "query": "SELECT * FROM table_name LIMIT 10"
 * }
 */
app.post('/api/query', async (req, res) => {
    try {
        // Validate request body
        const { database_path, query } = req.body;

        // Validate database_path
        if (!database_path || typeof database_path !== 'string') {
            return res.status(400).json({
                error: 'database_path is required and must be a string'
            });
        }

        // Validate query
        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                error: 'query is required and must be a string'
            });
        }

        // Connect to database (password is optional - will work with unencrypted databases)
        let db = null;
        try {
            db = await connectDatabase(database_path, DB_PASSWORD);
        } catch (error) {
            return res.status(400).json({
                error: `Failed to connect to database: ${error.message}`
            });
        }

        // Execute query
        try {
            const result = await executeQuery(db, query);

            // Return successful response with results
            res.json({
                success: true,
                data: result,
                message: `Query executed successfully. ${result.rowCount} row(s) returned.`
            });
        } catch (error) {
            res.status(400).json({
                error: `Query execution failed: ${error.message}`
            });
        } finally {
            // Always close the database connection
            closeConnection(db);
        }
    } catch (error) {
        res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
});

/**
 * Get server information
 */
app.get('/api/info', (req, res) => {
    res.json({
        name: 'sqlcipher-mcp-server',
        version: '1.0.0',
        description: 'HTTP wrapper for SQLCipher MCP Server',
        endpoints: {
            health: 'GET /health',
            query: 'POST /api/query',
            info: 'GET /api/info'
        },
        passwordConfigured: !!DB_PASSWORD
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`SQLCipher MCP HTTP Server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API info: http://localhost:${PORT}/api/info`);
    
    if (!DB_PASSWORD) {
        console.warn('\n⚠️  Warning: SQLCIPHER_PASSWORD environment variable is not set.');
        console.warn('   Database queries will fail until this is configured.\n');
    } else {
        console.log('✅ Database password is configured.\n');
    }
});
