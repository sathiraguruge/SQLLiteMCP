/**
 * MCP Prompt Definitions
 * Definitions for all MCP prompts provided by the SQLCipher MCP Server
 */

export const PROMPT_DEFINITIONS = {
    explore_database_schema: {
        name: 'explore_database_schema',
        description: 'Explore the complete database schema including all tables, their structures, row counts, and relationships. This provides a comprehensive overview of the database layout.',
        arguments: [
            {
                name: 'database_path',
                description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                required: false,
            },
        ],
    },
    describe_table_structure: {
        name: 'describe_table_structure',
        description: 'Get a detailed description of a specific table including columns, types, constraints, foreign keys, indexes, and sample data.',
        arguments: [
            {
                name: 'database_path',
                description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                required: false,
            },
            {
                name: 'table_name',
                description: 'Name of the table to describe',
                required: true,
            },
        ],
    },
    find_data_relationships: {
        name: 'find_data_relationships',
        description: 'Discover and visualize foreign key relationships between tables in the database. Shows both incoming and outgoing relationships.',
        arguments: [
            {
                name: 'database_path',
                description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                required: false,
            },
            {
                name: 'table_name',
                description: 'Optional table name to focus on (if not provided, shows all relationships)',
                required: false,
            },
        ],
    },
    generate_query_template: {
        name: 'generate_query_template',
        description: 'Generate SQL query templates based on table schema and intent. Helps users write queries by providing examples.',
        arguments: [
            {
                name: 'database_path',
                description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                required: false,
            },
            {
                name: 'table_name',
                description: 'Name of the table for query generation',
                required: true,
            },
            {
                name: 'intent',
                description: 'Query intent: "count", "sample", "join", "aggregate", or "search"',
                required: false,
            },
        ],
    },
    optimize_query: {
        name: 'optimize_query',
        description: 'Analyze a query execution plan and provide optimization suggestions. Identifies missing indexes and inefficient patterns.',
        arguments: [
            {
                name: 'database_path',
                description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                required: false,
            },
            {
                name: 'query',
                description: 'SQL query to optimize',
                required: true,
            },
        ],
    },
    analyze_table_data: {
        name: 'analyze_table_data',
        description: 'Perform comprehensive data analysis on a table including statistics, data quality checks, and sample data.',
        arguments: [
            {
                name: 'database_path',
                description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                required: false,
            },
            {
                name: 'table_name',
                description: 'Name of the table to analyze',
                required: true,
            },
        ],
    },
    compare_tables: {
        name: 'compare_tables',
        description: 'Compare the structure and statistics of two tables. Highlights similarities and differences.',
        arguments: [
            {
                name: 'database_path',
                description: 'Path to the database file (optional if SQLCIPHER_DATABASE_PATH is set)',
                required: false,
            },
            {
                name: 'table1_name',
                description: 'Name of the first table',
                required: true,
            },
            {
                name: 'table2_name',
                description: 'Name of the second table',
                required: true,
            },
        ],
    },
};
