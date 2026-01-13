/**
 * Application Constants
 * Central location for all application constants
 */

export const SERVER_CONFIG = {
    name: 'sqlcipher-mcp-server',
    version: '1.0.4',
    description: 'MCP Server for querying SQLCipher-encrypted SQLite databases',
};

export const QUERY_CONFIG = {
    maxDisplayRows: 1000,
    maxValueLength: 50,
};

export const HTTP_CONFIG = {
    defaultPort: 3000,
};

export const TOOL_DEFINITIONS = {
    execute_query: {
        name: 'execute_query',
        description: 'Execute a SELECT query on a SQLCipher-encrypted SQLite database. Only read-only queries are allowed. Database path can be provided as parameter or via SQLCIPHER_DATABASE_PATH environment variable.',
        inputSchema: {
            type: 'object',
            properties: {
                database_path: {
                    type: 'string',
                    description: 'Path to the SQLCipher database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                },
                query: {
                    type: 'string',
                    description: 'SQL SELECT query to execute (read-only)',
                },
            },
            required: ['query'],
        },
    },
};
