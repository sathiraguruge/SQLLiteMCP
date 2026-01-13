/**
 * HTTP Route Handlers
 * Handlers for HTTP API endpoints
 */

import { SERVER_CONFIG } from '../config/constants.js';
import { getDatabasePassword, isPasswordConfigured } from '../config/environment.js';
import { 
    validateDatabasePath, 
    validateQuery,
    validateTableName,
    validateColumnName,
    validatePattern,
    validateNumericParameter,
    resolveDatabasePath
} from '../utils/validators.js';
import { 
    executeQueryOnDatabase,
    getTableListFromDatabase,
    getTableSchemaFromDatabase,
    getForeignKeysFromDatabase,
    getIndexesFromDatabase,
    getDatabaseInfoFromDatabase,
    getTableInfoFromDatabase,
    testDatabaseConnection,
    explainQueryPlanFromDatabase,
    getTableStatisticsFromDatabase,
    sampleTableDataFromDatabase,
    getColumnStatisticsFromDatabase,
    searchTablesInDatabase,
    searchColumnsInDatabase,
    findRelatedTablesInDatabase
} from '../services/database-service.js';

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
        description: 'HTTP wrapper for SQLCipher MCP Server - Full feature parity with MCP server',
        endpoints: {
            // Server Status
            health: 'GET /health',
            info: 'GET /api/info',
            
            // Query Execution (backward compatibility)
            query: 'POST /api/query (execute_query)',
            
            // Schema Exploration
            list_tables: 'POST /api/tool/list_tables',
            get_table_schema: 'POST /api/tool/get_table_schema',
            list_columns: 'POST /api/tool/list_columns',
            get_foreign_keys: 'POST /api/tool/get_foreign_keys',
            get_indexes: 'POST /api/tool/get_indexes',
            find_related_tables: 'POST /api/tool/find_related_tables',
            
            // Database & Table Info
            get_database_info: 'POST /api/tool/get_database_info',
            get_table_info: 'POST /api/tool/get_table_info',
            test_connection: 'POST /api/tool/test_connection',
            
            // Query Helpers
            explain_query: 'POST /api/tool/explain_query',
            validate_query_syntax: 'POST /api/tool/validate_query_syntax',
            suggest_query: 'POST /api/tool/suggest_query',
            
            // Data Analysis
            get_table_statistics: 'POST /api/tool/get_table_statistics',
            sample_table_data: 'POST /api/tool/sample_table_data',
            get_column_statistics: 'POST /api/tool/get_column_statistics',
            
            // Search
            search_tables: 'POST /api/tool/search_tables',
            search_columns: 'POST /api/tool/search_columns',
        },
        totalTools: 18,
        totalEndpoints: 20,
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

// ============================================================================
// Schema Exploration Handlers
// ============================================================================

/**
 * Handle list_tables endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleListTables(req, res) {
    try {
        const { database_path } = req.body;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const tables = await getTableListFromDatabase(dbPath, password);
        
        res.json({
            success: true,
            data: tables,
            message: `Retrieved ${tables.length} table(s) from database.`,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}

/**
 * Handle get_table_schema endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleGetTableSchema(req, res) {
    try {
        const { database_path, table_name } = req.body;
        validateTableName(table_name);
        
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const schema = await getTableSchemaFromDatabase(dbPath, password, table_name);
        
        res.json({
            success: true,
            data: schema,
            message: `Retrieved schema for table "${table_name}".`,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}

/**
 * Handle list_columns endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleListColumns(req, res) {
    try {
        const { database_path, table_name } = req.body;
        validateTableName(table_name);
        
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const schema = await getTableSchemaFromDatabase(dbPath, password, table_name);
        const columns = schema.map(col => col.name);
        
        res.json({
            success: true,
            data: { table_name, columns, schema },
            message: `Retrieved ${columns.length} column(s) from table "${table_name}".`,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}

/**
 * Handle get_foreign_keys endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleGetForeignKeys(req, res) {
    try {
        const { database_path, table_name } = req.body;
        validateTableName(table_name);
        
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const foreignKeys = await getForeignKeysFromDatabase(dbPath, password, table_name);
        
        res.json({
            success: true,
            data: { table_name, foreign_keys: foreignKeys },
            message: `Retrieved ${foreignKeys.length} foreign key(s) for table "${table_name}".`,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}

/**
 * Handle get_indexes endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleGetIndexes(req, res) {
    try {
        const { database_path, table_name } = req.body;
        validateTableName(table_name);
        
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const indexes = await getIndexesFromDatabase(dbPath, password, table_name);
        
        res.json({
            success: true,
            data: { table_name, indexes },
            message: `Retrieved ${indexes.length} index(es) for table "${table_name}".`,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}

/**
 * Handle find_related_tables endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleFindRelatedTables(req, res) {
    try {
        const { database_path, table_name } = req.body;
        validateTableName(table_name);
        
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const relationships = await findRelatedTablesInDatabase(dbPath, password, table_name);
        
        res.json({
            success: true,
            data: relationships,
            message: `Found relationships for table "${table_name}".`,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}

// ============================================================================
// Database & Table Info Handlers
// ============================================================================

/**
 * Handle get_database_info endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleGetDatabaseInfo(req, res) {
    try {
        const { database_path } = req.body;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const info = await getDatabaseInfoFromDatabase(dbPath, password);
        
        res.json({
            success: true,
            data: info,
            message: 'Retrieved database information.',
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}

/**
 * Handle get_table_info endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleGetTableInfo(req, res) {
    try {
        const { database_path, table_name } = req.body;
        validateTableName(table_name);
        
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const info = await getTableInfoFromDatabase(dbPath, password, table_name);
        
        res.json({
            success: true,
            data: info,
            message: `Retrieved information for table "${table_name}".`,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}

/**
 * Handle test_connection endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleTestConnection(req, res) {
    try {
        const { database_path } = req.body;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const result = await testDatabaseConnection(dbPath, password);
        
        res.json({
            success: true,
            data: result,
            message: result.success ? 'Database connection successful.' : 'Database connection failed.',
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}

// ============================================================================
// Query Helper Handlers
// ============================================================================

/**
 * Handle explain_query endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleExplainQuery(req, res) {
    try {
        const { database_path, query } = req.body;
        validateQuery(query);
        
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const plan = await explainQueryPlanFromDatabase(dbPath, password, query);
        
        res.json({
            success: true,
            data: { query, execution_plan: plan },
            message: 'Query execution plan retrieved.',
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}

/**
 * Handle validate_query_syntax endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleValidateQuerySyntax(req, res) {
    try {
        const { database_path, query } = req.body;
        
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        // Try to explain the query - if it fails, syntax is invalid
        try {
            await explainQueryPlanFromDatabase(dbPath, password, query);
            res.json({
                success: true,
                data: { valid: true, query },
                message: 'Query syntax is valid.',
            });
        } catch (error) {
            res.json({
                success: true,
                data: { valid: false, query, error: error.message },
                message: 'Query syntax is invalid.',
            });
        }
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}

/**
 * Handle suggest_query endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleSuggestQuery(req, res) {
    try {
        const { database_path, table_name, intent } = req.body;
        validateTableName(table_name);
        
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        // Get table schema to build a suggested query
        const schema = await getTableSchemaFromDatabase(dbPath, password, table_name);
        const columns = schema.map(col => col.name).join(', ');
        
        let suggestedQuery = `SELECT ${columns} FROM ${table_name}`;
        
        if (intent) {
            suggestedQuery += ` -- Intent: ${intent}`;
        }
        
        suggestedQuery += ' LIMIT 10;';
        
        res.json({
            success: true,
            data: { 
                table_name, 
                intent: intent || 'General query',
                suggested_query: suggestedQuery,
                columns: schema
            },
            message: `Generated query suggestion for table "${table_name}".`,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}

// ============================================================================
// Data Analysis Handlers
// ============================================================================

/**
 * Handle get_table_statistics endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleGetTableStatistics(req, res) {
    try {
        const { database_path, table_name } = req.body;
        validateTableName(table_name);
        
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const stats = await getTableStatisticsFromDatabase(dbPath, password, table_name);
        
        res.json({
            success: true,
            data: stats,
            message: `Retrieved statistics for table "${table_name}".`,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}

/**
 * Handle sample_table_data endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleSampleTableData(req, res) {
    try {
        const { database_path, table_name, limit = 10, offset = 0 } = req.body;
        validateTableName(table_name);
        validateNumericParameter(limit, 'limit', 1, 1000);
        validateNumericParameter(offset, 'offset', 0, 1000000);
        
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const sample = await sampleTableDataFromDatabase(dbPath, password, table_name, limit, offset);
        
        res.json({
            success: true,
            data: sample,
            message: `Retrieved ${sample.rows.length} sample row(s) from table "${table_name}".`,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}

/**
 * Handle get_column_statistics endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleGetColumnStatistics(req, res) {
    try {
        const { database_path, table_name, column_name } = req.body;
        validateTableName(table_name);
        validateColumnName(column_name);
        
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const stats = await getColumnStatisticsFromDatabase(dbPath, password, table_name, column_name);
        
        res.json({
            success: true,
            data: stats,
            message: `Retrieved statistics for column "${column_name}" in table "${table_name}".`,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}

// ============================================================================
// Search Handlers
// ============================================================================

/**
 * Handle search_tables endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleSearchTables(req, res) {
    try {
        const { database_path, pattern } = req.body;
        validatePattern(pattern);
        
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const results = await searchTablesInDatabase(dbPath, password, pattern);
        
        res.json({
            success: true,
            data: { pattern, matches: results },
            message: `Found ${results.length} table(s) matching pattern "${pattern}".`,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}

/**
 * Handle search_columns endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleSearchColumns(req, res) {
    try {
        const { database_path, pattern } = req.body;
        validatePattern(pattern);
        
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const results = await searchColumnsInDatabase(dbPath, password, pattern);
        
        res.json({
            success: true,
            data: { pattern, matches: results },
            message: `Found ${results.length} column(s) matching pattern "${pattern}".`,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
}
