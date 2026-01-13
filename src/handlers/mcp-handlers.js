/**
 * MCP Tool Handlers
 * Handlers for MCP tool requests
 */

import { TOOL_DEFINITIONS } from '../definitions/tools.js';
import { getDatabasePassword } from '../config/environment.js';
import { 
    validateArguments, 
    validateQuery, 
    resolveDatabasePath,
    validateTableName,
    validateColumnName,
    validatePattern,
    validateNumericParameter
} from '../utils/validators.js';
import { 
    formatQueryResults,
    formatTableList,
    formatTableSchema,
    formatForeignKeys,
    formatIndexes,
    formatDatabaseInfo,
    formatTableInfo,
    formatQueryPlan,
    formatTableStatistics,
    formatSampleData,
    formatColumnStatistics,
    formatSearchResults,
    formatRelatedTables
} from '../utils/formatters.js';
import { createMcpErrorResponse, createMcpSuccessResponse } from '../utils/errors.js';
import { 
    executeQueryOnDatabase,
    testDatabaseConnection,
    getTableListFromDatabase,
    getTableSchemaFromDatabase,
    getForeignKeysFromDatabase,
    getIndexesFromDatabase,
    getDatabaseInfoFromDatabase,
    getTableInfoFromDatabase,
    explainQueryPlanFromDatabase,
    getTableStatisticsFromDatabase,
    sampleTableDataFromDatabase,
    getColumnStatisticsFromDatabase,
    searchTablesInDatabase,
    searchColumnsInDatabase,
    findRelatedTablesInDatabase
} from '../services/database-service.js';

/**
 * Handle list tools request
 * @returns {Object} List of available tools
 */
export function handleListTools() {
    return {
        tools: Object.values(TOOL_DEFINITIONS),
    };
}

/**
 * Handle execute_query tool request
 * @param {Object} args - Tool arguments
 * @param {string} [args.database_path] - Database path (optional if env var set)
 * @param {string} args.query - SQL query to execute
 * @returns {Promise<Object>} MCP response object
 */
export async function handleExecuteQuery(args) {
    try {
        // Validate arguments
        validateArguments(args);
        
        const { database_path, query } = args;
        
        // Validate query
        validateQuery(query);
        
        // Resolve database path
        const dbPath = resolveDatabasePath(database_path);
        
        // Get database password
        const password = getDatabasePassword();
        
        // Execute query
        try {
            const result = await executeQueryOnDatabase(dbPath, password, query);
            
            // Format results for response
            const responseText = formatQueryResults(result);
            
            return createMcpSuccessResponse(responseText);
        } catch (error) {
            return createMcpErrorResponse(`Query execution failed: ${error.message}`);
        }
    } catch (error) {
        return createMcpErrorResponse(`Error: ${error.message}`);
    }
}

/**
 * Handle list_tables tool request
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} MCP response object
 */
export async function handleListTables(args) {
    try {
        validateArguments(args);
        
        const { database_path, table_names } = args;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const tables = await getTableListFromDatabase(dbPath, password, table_names);
        const responseText = formatTableList(tables);
        
        return createMcpSuccessResponse(responseText);
    } catch (error) {
        return createMcpErrorResponse(`Error: ${error.message}`);
    }
}

/**
 * Handle get_table_schema tool request
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} MCP response object
 */
export async function handleGetTableSchema(args) {
    try {
        validateArguments(args);
        validateTableName(args.table_name);
        
        const { database_path, table_name } = args;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const schema = await getTableSchemaFromDatabase(dbPath, password, table_name);
        const responseText = formatTableSchema(schema);
        
        return createMcpSuccessResponse(responseText);
    } catch (error) {
        return createMcpErrorResponse(`Error: ${error.message}`);
    }
}

/**
 * Handle list_columns tool request
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} MCP response object
 */
export async function handleListColumns(args) {
    try {
        validateArguments(args);
        validateTableName(args.table_name);
        
        const { database_path, table_name } = args;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const schema = await getTableSchemaFromDatabase(dbPath, password, table_name);
        const responseText = formatTableSchema(schema);
        
        return createMcpSuccessResponse(responseText);
    } catch (error) {
        return createMcpErrorResponse(`Error: ${error.message}`);
    }
}

/**
 * Handle get_foreign_keys tool request
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} MCP response object
 */
export async function handleGetForeignKeys(args) {
    try {
        validateArguments(args);
        
        const { database_path, table_name } = args;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const foreignKeys = await getForeignKeysFromDatabase(dbPath, password, table_name);
        const responseText = formatForeignKeys(foreignKeys);
        
        return createMcpSuccessResponse(responseText);
    } catch (error) {
        return createMcpErrorResponse(`Error: ${error.message}`);
    }
}

/**
 * Handle get_indexes tool request
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} MCP response object
 */
export async function handleGetIndexes(args) {
    try {
        validateArguments(args);
        
        const { database_path, table_name } = args;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const indexes = await getIndexesFromDatabase(dbPath, password, table_name);
        const responseText = formatIndexes(indexes);
        
        return createMcpSuccessResponse(responseText);
    } catch (error) {
        return createMcpErrorResponse(`Error: ${error.message}`);
    }
}

/**
 * Handle get_database_info tool request
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} MCP response object
 */
export async function handleGetDatabaseInfo(args) {
    try {
        validateArguments(args);
        
        const { database_path } = args;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const info = await getDatabaseInfoFromDatabase(dbPath, password);
        const responseText = formatDatabaseInfo(info);
        
        return createMcpSuccessResponse(responseText);
    } catch (error) {
        return createMcpErrorResponse(`Error: ${error.message}`);
    }
}

/**
 * Handle get_table_info tool request
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} MCP response object
 */
export async function handleGetTableInfo(args) {
    try {
        validateArguments(args);
        validateTableName(args.table_name);
        
        const { database_path, table_name } = args;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const info = await getTableInfoFromDatabase(dbPath, password, table_name);
        const responseText = formatTableInfo(info);
        
        return createMcpSuccessResponse(responseText);
    } catch (error) {
        return createMcpErrorResponse(`Error: ${error.message}`);
    }
}

/**
 * Handle test_connection tool request
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} MCP response object
 */
export async function handleTestConnection(args) {
    try {
        validateArguments(args);
        
        const { database_path } = args;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        await testDatabaseConnection(dbPath, password);
        const responseText = 'Database connection successful.';
        
        return createMcpSuccessResponse(responseText);
    } catch (error) {
        return createMcpErrorResponse(`Connection test failed: ${error.message}`);
    }
}

/**
 * Handle explain_query tool request
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} MCP response object
 */
export async function handleExplainQuery(args) {
    try {
        validateArguments(args);
        validateQuery(args.query);
        
        const { database_path, query } = args;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const plan = await explainQueryPlanFromDatabase(dbPath, password, query);
        const responseText = formatQueryPlan(plan);
        
        return createMcpSuccessResponse(responseText);
    } catch (error) {
        return createMcpErrorResponse(`Error: ${error.message}`);
    }
}

/**
 * Handle validate_query_syntax tool request
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} MCP response object
 */
export async function handleValidateQuerySyntax(args) {
    try {
        validateArguments(args);
        validateQuery(args.query);
        
        const { database_path, query } = args;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        // Try to explain the query - if it succeeds, syntax is valid
        await explainQueryPlanFromDatabase(dbPath, password, query);
        const responseText = 'Query syntax is valid.';
        
        return createMcpSuccessResponse(responseText);
    } catch (error) {
        return createMcpErrorResponse(`Query syntax validation failed: ${error.message}`);
    }
}

/**
 * Handle suggest_query tool request
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} MCP response object
 */
export async function handleSuggestQuery(args) {
    try {
        validateArguments(args);
        
        const { database_path, table_name, intent } = args;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        let suggestions = [];
        
        if (table_name) {
            // Get table schema to build suggestions
            const schema = await getTableSchemaFromDatabase(dbPath, password, table_name);
            const columns = schema.columns.map(c => c.name).join(', ');
            
            switch (intent) {
                case 'count':
                    suggestions.push(`SELECT COUNT(*) FROM "${table_name}"`);
                    break;
                case 'sample':
                    suggestions.push(`SELECT ${columns} FROM "${table_name}" LIMIT 10`);
                    break;
                case 'aggregate':
                    const numericCols = schema.columns.filter(c => 
                        c.type && (c.type.toUpperCase().includes('INT') || 
                                  c.type.toUpperCase().includes('REAL') ||
                                  c.type.toUpperCase().includes('NUMERIC'))
                    );
                    if (numericCols.length > 0) {
                        const col = numericCols[0].name;
                        suggestions.push(`SELECT MIN("${col}"), MAX("${col}"), AVG("${col}") FROM "${table_name}"`);
                    }
                    break;
                case 'search':
                    const textCols = schema.columns.filter(c => 
                        !c.type || c.type.toUpperCase().includes('TEXT') || 
                        c.type.toUpperCase().includes('VARCHAR') ||
                        c.type.toUpperCase().includes('CHAR')
                    );
                    if (textCols.length > 0) {
                        const col = textCols[0].name;
                        suggestions.push(`SELECT ${columns} FROM "${table_name}" WHERE "${col}" LIKE '%search_term%'`);
                    }
                    break;
                case 'join':
                    if (schema.foreign_keys && schema.foreign_keys.length > 0) {
                        const fk = schema.foreign_keys[0];
                        suggestions.push(`SELECT * FROM "${table_name}" t1 JOIN "${fk.table}" t2 ON t1."${fk.from}" = t2."${fk.to}"`);
                    }
                    break;
                default:
                    suggestions.push(`SELECT ${columns} FROM "${table_name}"`);
            }
        } else {
            // General suggestions
            suggestions.push('SELECT * FROM table_name LIMIT 10');
            suggestions.push('SELECT COUNT(*) FROM table_name');
            suggestions.push('SELECT column_name FROM table_name WHERE condition');
        }
        
        let responseText = 'Query Suggestions:\n\n';
        suggestions.forEach((s, i) => {
            responseText += `${i + 1}. ${s}\n`;
        });
        
        responseText += '\n\nJSON representation:\n';
        responseText += JSON.stringify({ suggestions }, null, 2);
        
        return createMcpSuccessResponse(responseText);
    } catch (error) {
        return createMcpErrorResponse(`Error: ${error.message}`);
    }
}

/**
 * Handle get_table_statistics tool request
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} MCP response object
 */
export async function handleGetTableStatistics(args) {
    try {
        validateArguments(args);
        validateTableName(args.table_name);
        
        const { database_path, table_name, max_sample_size, timeout_ms } = args;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const maxSample = validateNumericParameter(max_sample_size, 'max_sample_size', 1, 1000000) || 10000;
        
        const stats = await getTableStatisticsFromDatabase(dbPath, password, table_name, maxSample);
        const responseText = formatTableStatistics(stats);
        
        return createMcpSuccessResponse(responseText);
    } catch (error) {
        return createMcpErrorResponse(`Error: ${error.message}`);
    }
}

/**
 * Handle sample_table_data tool request
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} MCP response object
 */
export async function handleSampleTableData(args) {
    try {
        validateArguments(args);
        validateTableName(args.table_name);
        
        const { database_path, table_name, limit, offset, columns } = args;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const limitNum = validateNumericParameter(limit, 'limit', 1, 10000) || 10;
        const offsetNum = validateNumericParameter(offset, 'offset', 0, Number.MAX_SAFE_INTEGER) || 0;
        
        const sample = await sampleTableDataFromDatabase(dbPath, password, table_name, limitNum, offsetNum, columns);
        const responseText = formatSampleData(sample);
        
        return createMcpSuccessResponse(responseText);
    } catch (error) {
        return createMcpErrorResponse(`Error: ${error.message}`);
    }
}

/**
 * Handle get_column_statistics tool request
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} MCP response object
 */
export async function handleGetColumnStatistics(args) {
    try {
        validateArguments(args);
        validateTableName(args.table_name);
        validateColumnName(args.column_name);
        
        const { database_path, table_name, column_name, max_sample_size } = args;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const maxSample = validateNumericParameter(max_sample_size, 'max_sample_size', 1, 1000000) || 10000;
        
        const stats = await getColumnStatisticsFromDatabase(dbPath, password, table_name, column_name, maxSample);
        const responseText = formatColumnStatistics(stats);
        
        return createMcpSuccessResponse(responseText);
    } catch (error) {
        return createMcpErrorResponse(`Error: ${error.message}`);
    }
}

/**
 * Handle search_tables tool request
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} MCP response object
 */
export async function handleSearchTables(args) {
    try {
        validateArguments(args);
        validatePattern(args.pattern);
        
        const { database_path, pattern } = args;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const results = await searchTablesInDatabase(dbPath, password, pattern);
        const responseText = formatSearchResults(results, 'tables');
        
        return createMcpSuccessResponse(responseText);
    } catch (error) {
        return createMcpErrorResponse(`Error: ${error.message}`);
    }
}

/**
 * Handle search_columns tool request
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} MCP response object
 */
export async function handleSearchColumns(args) {
    try {
        validateArguments(args);
        validatePattern(args.pattern);
        
        const { database_path, pattern } = args;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const results = await searchColumnsInDatabase(dbPath, password, pattern);
        const responseText = formatSearchResults(results, 'columns');
        
        return createMcpSuccessResponse(responseText);
    } catch (error) {
        return createMcpErrorResponse(`Error: ${error.message}`);
    }
}

/**
 * Handle find_related_tables tool request
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} MCP response object
 */
export async function handleFindRelatedTables(args) {
    try {
        validateArguments(args);
        validateTableName(args.table_name);
        
        const { database_path, table_name } = args;
        const dbPath = resolveDatabasePath(database_path);
        const password = getDatabasePassword();
        
        const related = await findRelatedTablesInDatabase(dbPath, password, table_name);
        const responseText = formatRelatedTables(related);
        
        return createMcpSuccessResponse(responseText);
    } catch (error) {
        return createMcpErrorResponse(`Error: ${error.message}`);
    }
}

/**
 * Handle unknown tool request
 * @param {string} toolName - Name of the unknown tool
 * @returns {Object} Error response
 */
export function handleUnknownTool(toolName) {
    return createMcpErrorResponse(`Unknown tool: ${toolName}`);
}
