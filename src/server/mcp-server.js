/**
 * MCP Server
 * Model Context Protocol server setup and initialization
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { SERVER_CONFIG } from '../config/constants.js';
import { getConfigurationWarnings } from '../config/environment.js';
import { handleListTools, handleExecuteQuery, handleUnknownTool } from '../handlers/mcp-handlers.js';

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
            },
        }
    );
    
    // Register list tools handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return handleListTools();
    });
    
    // Register tool execution handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        
        if (name === 'execute_query') {
            return await handleExecuteQuery(args);
        } else {
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
    
    // Connect server to transport
    await server.connect(transport);
    
    console.error('SQLCipher MCP Server running on stdio');
}
