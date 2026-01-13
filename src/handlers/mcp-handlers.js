/**
 * MCP Tool Handlers
 * Handlers for MCP tool requests
 */

import { TOOL_DEFINITIONS } from '../config/constants.js';
import { getDatabasePassword } from '../config/environment.js';
import { validateArguments, validateQuery, resolveDatabasePath } from '../utils/validators.js';
import { formatQueryResults } from '../utils/formatters.js';
import { createMcpErrorResponse, createMcpSuccessResponse } from '../utils/errors.js';
import { executeQueryOnDatabase } from '../services/database-service.js';

/**
 * Handle list tools request
 * @returns {Object} List of available tools
 */
export function handleListTools() {
    return {
        tools: [TOOL_DEFINITIONS.execute_query],
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
 * Handle unknown tool request
 * @param {string} toolName - Name of the unknown tool
 * @returns {Object} Error response
 */
export function handleUnknownTool(toolName) {
    return createMcpErrorResponse(`Unknown tool: ${toolName}`);
}
