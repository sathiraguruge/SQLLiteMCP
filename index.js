#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { connectDatabase, executeQuery, closeConnection } from './lib/database.js';

/**
 * SQLCipher MCP Server
 * Provides read-only access to SQLCipher-encrypted SQLite databases
 */

// Get database password from environment variable
const DB_PASSWORD = process.env.SQLCIPHER_PASSWORD;

// Create MCP server instance
const server = new Server(
    {
        name: 'sqlcipher-mcp-server',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'execute_query',
                description: 'Execute a SELECT query on a SQLCipher-encrypted SQLite database. Only read-only queries are allowed.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        database_path: {
                            type: 'string',
                            description: 'Path to the SQLCipher database file',
                        },
                        query: {
                            type: 'string',
                            description: 'SQL SELECT query to execute (read-only)',
                        },
                    },
                    required: ['database_path', 'query'],
                },
            },
        ],
    };
});

/**
 * Handle tool execution requests
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'execute_query') {
        try {
            // Validate required parameters
            if (!args || typeof args !== 'object') {
                throw new Error('Invalid arguments: arguments must be an object');
            }

            const { database_path, query } = args;

            // Validate database_path
            if (!database_path || typeof database_path !== 'string') {
                throw new Error('database_path is required and must be a string');
            }

            // Validate query
            if (!query || typeof query !== 'string') {
                throw new Error('query is required and must be a string');
            }

            // Connect to database (password is optional - will work with unencrypted databases)
            let db = null;
            try {
                db = await connectDatabase(database_path, DB_PASSWORD);
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Failed to connect to database: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }

            // Execute query
            try {
                const result = executeQuery(db, query);

                // Format results for response
                const responseText = formatQueryResults(result);

                return {
                    content: [
                        {
                            type: 'text',
                            text: responseText,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Query execution failed: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            } finally {
                // Always close the database connection
                closeConnection(db);
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    } else {
        return {
            content: [
                {
                    type: 'text',
                    text: `Unknown tool: ${name}`,
                },
            ],
            isError: true,
        };
    }
});

/**
 * Format query results as a readable string
 * 
 * @param {Object} result - Query result object with columns, rows, and rowCount
 * @returns {string} Formatted result string
 */
function formatQueryResults(result) {
    const { columns, rows, rowCount } = result;

    if (rowCount === 0) {
        return `Query executed successfully. No rows returned.\nColumns: ${columns.join(', ')}`;
    }

    // Build table-like output
    let output = `Query executed successfully. ${rowCount} row(s) returned.\n\n`;

    // Add column headers
    output += `Columns: ${columns.join(' | ')}\n`;
    output += '-'.repeat(columns.join(' | ').length) + '\n';

    // Add rows (limit to first 1000 rows for display)
    const displayRows = rows.slice(0, 1000);
    for (const row of displayRows) {
        const values = columns.map(col => {
            const value = row[col];
            // Handle null/undefined
            if (value === null || value === undefined) {
                return 'NULL';
            }
            // Convert to string and truncate long values
            const str = String(value);
            return str.length > 50 ? str.substring(0, 47) + '...' : str;
        });
        output += values.join(' | ') + '\n';
    }

    if (rows.length > 1000) {
        output += `\n... (showing first 1000 of ${rowCount} rows)`;
    }

    // Add JSON representation for programmatic access
    output += '\n\nJSON representation:\n';
    output += JSON.stringify(result, null, 2);

    return output;
}

/**
 * Start the MCP server
 */
async function main() {
    // Check if password is set (warn but don't fail - might be set later)
    if (!DB_PASSWORD) {
        console.error(
            'Warning: SQLCIPHER_PASSWORD environment variable is not set. ' +
            'Database connections will fail until this is configured.'
        );
    }

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    console.error('SQLCipher MCP Server running on stdio');
}

// Start the server
main().catch((error) => {
    console.error('Fatal error starting server:', error);
    process.exit(1);
});
