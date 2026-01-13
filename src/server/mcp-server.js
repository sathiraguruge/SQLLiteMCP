/**
 * MCP Server
 * Model Context Protocol server setup and initialization
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { SERVER_CONFIG } from '../config/constants.js';
import { getConfigurationWarnings } from '../config/environment.js';
import { 
    handleListTools, 
    handleExecuteQuery,
    handleListTables,
    handleGetTableSchema,
    handleListColumns,
    handleGetForeignKeys,
    handleGetIndexes,
    handleGetDatabaseInfo,
    handleGetTableInfo,
    handleTestConnection,
    handleExplainQuery,
    handleValidateQuerySyntax,
    handleSuggestQuery,
    handleGetTableStatistics,
    handleSampleTableData,
    handleGetColumnStatistics,
    handleSearchTables,
    handleSearchColumns,
    handleFindRelatedTables,
    handleUnknownTool 
} from '../handlers/mcp-handlers.js';

import {
    handleListPrompts,
    handleExploreDatabaseSchemaPrompt,
    handleDescribeTableStructurePrompt,
    handleFindDataRelationshipsPrompt,
    handleGenerateQueryTemplatePrompt,
    handleOptimizeQueryPrompt,
    handleAnalyzeTableDataPrompt,
    handleCompareTablesPrompt
} from '../handlers/prompt-handlers.js';

/**
 * Create and configure MCP server
 * @returns {Server} Configured MCP server instance
 */
export function createMcpServer() {
    const server = new Server(
        {
            name: SERVER_CONFIG.name,
            version: SERVER_CONFIG.version,
        },
        {
            capabilities: {
                tools: {},
                prompts: {},
            },
        }
    );
    
    // Register list tools handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return handleListTools();
    });
    
    // Register list prompts handler
    server.setRequestHandler(ListPromptsRequestSchema, async () => {
        return handleListPrompts();
    });
    
    // Register get prompt handler
    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        
        try {
            switch (name) {
                case 'explore_database_schema':
                    return await handleExploreDatabaseSchemaPrompt(args);
                case 'describe_table_structure':
                    return await handleDescribeTableStructurePrompt(args);
                case 'find_data_relationships':
                    return await handleFindDataRelationshipsPrompt(args);
                case 'generate_query_template':
                    return await handleGenerateQueryTemplatePrompt(args);
                case 'optimize_query':
                    return await handleOptimizeQueryPrompt(args);
                case 'analyze_table_data':
                    return await handleAnalyzeTableDataPrompt(args);
                case 'compare_tables':
                    return await handleCompareTablesPrompt(args);
                default:
                    throw new Error(`Unknown prompt: ${name}`);
            }
        } catch (error) {
            return {
                messages: [
                    {
                        role: 'assistant',
                        content: {
                            type: 'text',
                            text: `Error: ${error.message}`
                        }
                    }
                ]
            };
        }
    });
    
    // Register tool execution handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        
        switch (name) {
            case 'execute_query':
                return await handleExecuteQuery(args);
            case 'list_tables':
                return await handleListTables(args);
            case 'get_table_schema':
                return await handleGetTableSchema(args);
            case 'list_columns':
                return await handleListColumns(args);
            case 'get_foreign_keys':
                return await handleGetForeignKeys(args);
            case 'get_indexes':
                return await handleGetIndexes(args);
            case 'get_database_info':
                return await handleGetDatabaseInfo(args);
            case 'get_table_info':
                return await handleGetTableInfo(args);
            case 'test_connection':
                return await handleTestConnection(args);
            case 'explain_query':
                return await handleExplainQuery(args);
            case 'validate_query_syntax':
                return await handleValidateQuerySyntax(args);
            case 'suggest_query':
                return await handleSuggestQuery(args);
            case 'get_table_statistics':
                return await handleGetTableStatistics(args);
            case 'sample_table_data':
                return await handleSampleTableData(args);
            case 'get_column_statistics':
                return await handleGetColumnStatistics(args);
            case 'search_tables':
                return await handleSearchTables(args);
            case 'search_columns':
                return await handleSearchColumns(args);
            case 'find_related_tables':
                return await handleFindRelatedTables(args);
            default:
                return handleUnknownTool(name);
        }
    });
    
    return server;
}

/**
 * Start the MCP server
 * @returns {Promise<void>}
 */
export async function startMcpServer() {
    // Check configuration and log warnings
    const warnings = getConfigurationWarnings();
    if (warnings.length > 0) {
        console.error('Warning: ' + warnings.join(' '));
    } else {
        console.error('Configuration loaded: Database path and password set via environment variables.');
    }
    
    // Create server
    const server = createMcpServer();
    
    // Create stdio transport
    const transport = new StdioServerTransport();
    
    // Add error handler for transport errors
    transport.onerror = (error) => {
        console.error('Transport error:', error);
    };
    
    // Connect server to transport
    await server.connect(transport);
    
    console.error('SQLCipher MCP Server running on stdio');
    
    // Keep the process alive - keep stdin open to prevent the process from exiting
    process.stdin.resume();
    
    // Handle stdin end event (when client disconnects)
    process.stdin.on('end', () => {
        // When stdin ends, exit gracefully
        process.exit(0);
    });
    
    // Handle errors on stdin
    process.stdin.on('error', (error) => {
        console.error('Stdin error:', error);
    });
}
