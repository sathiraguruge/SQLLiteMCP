/**
 * MCP Tool Definitions
 * Definitions for all MCP tools provided by the SQLCipher MCP Server
 */

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
    list_tables: {
        name: 'list_tables',
        description: 'List all tables in the database with metadata including row counts. Supports filtering by table names.',
        inputSchema: {
            type: 'object',
            properties: {
                database_path: {
                    type: 'string',
                    description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                },
                table_names: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Optional array of table names to filter results',
                },
            },
            required: [],
        },
    },
    get_table_schema: {
        name: 'get_table_schema',
        description: 'Get detailed schema information for one or more tables including columns, types, constraints, foreign keys, and indexes.',
        inputSchema: {
            type: 'object',
            properties: {
                database_path: {
                    type: 'string',
                    description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                },
                table_name: {
                    oneOf: [
                        { type: 'string' },
                        { type: 'array', items: { type: 'string' } }
                    ],
                    description: 'Table name or array of table names',
                },
            },
            required: ['table_name'],
        },
    },
    list_columns: {
        name: 'list_columns',
        description: 'List all columns in a table with their types and constraints.',
        inputSchema: {
            type: 'object',
            properties: {
                database_path: {
                    type: 'string',
                    description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                },
                table_name: {
                    type: 'string',
                    description: 'Name of the table',
                },
            },
            required: ['table_name'],
        },
    },
    get_foreign_keys: {
        name: 'get_foreign_keys',
        description: 'Get foreign key relationships for a specific table or entire database.',
        inputSchema: {
            type: 'object',
            properties: {
                database_path: {
                    type: 'string',
                    description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                },
                table_name: {
                    type: 'string',
                    description: 'Optional table name (if not provided, gets all foreign keys)',
                },
            },
            required: [],
        },
    },
    get_indexes: {
        name: 'get_indexes',
        description: 'Get index information for a specific table or entire database.',
        inputSchema: {
            type: 'object',
            properties: {
                database_path: {
                    type: 'string',
                    description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                },
                table_name: {
                    type: 'string',
                    description: 'Optional table name (if not provided, gets all indexes)',
                },
            },
            required: [],
        },
    },
    get_database_info: {
        name: 'get_database_info',
        description: 'Get database metadata including SQLite version, size, page size, encoding, and other configuration details.',
        inputSchema: {
            type: 'object',
            properties: {
                database_path: {
                    type: 'string',
                    description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                },
            },
            required: [],
        },
    },
    get_table_info: {
        name: 'get_table_info',
        description: 'Get detailed information about a specific table including row count, column count, and creation SQL.',
        inputSchema: {
            type: 'object',
            properties: {
                database_path: {
                    type: 'string',
                    description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                },
                table_name: {
                    type: 'string',
                    description: 'Name of the table',
                },
            },
            required: ['table_name'],
        },
    },
    test_connection: {
        name: 'test_connection',
        description: 'Test database connection without executing queries. Useful for verifying database accessibility.',
        inputSchema: {
            type: 'object',
            properties: {
                database_path: {
                    type: 'string',
                    description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                },
            },
            required: [],
        },
    },
    explain_query: {
        name: 'explain_query',
        description: 'Get query execution plan (EXPLAIN QUERY PLAN) showing how SQLite will execute the query. Useful for query optimization.',
        inputSchema: {
            type: 'object',
            properties: {
                database_path: {
                    type: 'string',
                    description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                },
                query: {
                    type: 'string',
                    description: 'SQL SELECT query to explain',
                },
            },
            required: ['query'],
        },
    },
    validate_query_syntax: {
        name: 'validate_query_syntax',
        description: 'Validate SQL query syntax without executing it. Returns validation result and any syntax errors.',
        inputSchema: {
            type: 'object',
            properties: {
                database_path: {
                    type: 'string',
                    description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                },
                query: {
                    type: 'string',
                    description: 'SQL query to validate',
                },
            },
            required: ['query'],
        },
    },
    suggest_query: {
        name: 'suggest_query',
        description: 'Suggest SQL query templates based on table schema and intent (e.g., "count", "sample", "join").',
        inputSchema: {
            type: 'object',
            properties: {
                database_path: {
                    type: 'string',
                    description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                },
                table_name: {
                    type: 'string',
                    description: 'Optional table name for query suggestions',
                },
                intent: {
                    type: 'string',
                    description: 'Query intent: "count", "sample", "join", "aggregate", or "search"',
                },
            },
            required: [],
        },
    },
    get_table_statistics: {
        name: 'get_table_statistics',
        description: 'Get statistical information about a table including row count and column statistics (min, max, avg, distinct count).',
        inputSchema: {
            type: 'object',
            properties: {
                database_path: {
                    type: 'string',
                    description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                },
                table_name: {
                    type: 'string',
                    description: 'Name of the table',
                },
                max_sample_size: {
                    type: 'number',
                    description: 'Maximum number of rows to sample for statistics (default: 10000)',
                },
                timeout_ms: {
                    type: 'number',
                    description: 'Timeout in milliseconds (default: 30000)',
                },
            },
            required: ['table_name'],
        },
    },
    sample_table_data: {
        name: 'sample_table_data',
        description: 'Get a sample of rows from a table for quick data preview.',
        inputSchema: {
            type: 'object',
            properties: {
                database_path: {
                    type: 'string',
                    description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                },
                table_name: {
                    type: 'string',
                    description: 'Name of the table',
                },
                limit: {
                    type: 'number',
                    description: 'Number of rows to return (default: 10)',
                },
                offset: {
                    type: 'number',
                    description: 'Number of rows to skip (default: 0)',
                },
                columns: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Optional array of column names to include',
                },
            },
            required: ['table_name'],
        },
    },
    get_column_statistics: {
        name: 'get_column_statistics',
        description: 'Get detailed statistics for specific columns including min, max, avg, distinct count, null count, and sample values.',
        inputSchema: {
            type: 'object',
            properties: {
                database_path: {
                    type: 'string',
                    description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                },
                table_name: {
                    type: 'string',
                    description: 'Name of the table',
                },
                column_name: {
                    oneOf: [
                        { type: 'string' },
                        { type: 'array', items: { type: 'string' } }
                    ],
                    description: 'Column name or array of column names',
                },
                max_sample_size: {
                    type: 'number',
                    description: 'Maximum sample size (default: 10000)',
                },
            },
            required: ['table_name', 'column_name'],
        },
    },
    search_tables: {
        name: 'search_tables',
        description: 'Search for tables by name pattern using SQL LIKE syntax (% for wildcard).',
        inputSchema: {
            type: 'object',
            properties: {
                database_path: {
                    type: 'string',
                    description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                },
                pattern: {
                    type: 'string',
                    description: 'SQL LIKE pattern (e.g., "user%" or "%_log")',
                },
            },
            required: ['pattern'],
        },
    },
    search_columns: {
        name: 'search_columns',
        description: 'Search for columns across all tables by name pattern using SQL LIKE syntax.',
        inputSchema: {
            type: 'object',
            properties: {
                database_path: {
                    type: 'string',
                    description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                },
                pattern: {
                    type: 'string',
                    description: 'SQL LIKE pattern (e.g., "%_id" or "name%")',
                },
            },
            required: ['pattern'],
        },
    },
    find_related_tables: {
        name: 'find_related_tables',
        description: 'Find tables related to a given table via foreign key relationships (both incoming and outgoing).',
        inputSchema: {
            type: 'object',
            properties: {
                database_path: {
                    type: 'string',
                    description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                },
                table_name: {
                    type: 'string',
                    description: 'Name of the table',
                },
            },
            required: ['table_name'],
        },
    },
};
