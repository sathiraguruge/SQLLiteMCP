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
    
    // Register list tools handler with error handling
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        try {
            return await handleListTools();
        } catch (error) {
            // #region agent log
            fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-server.js:36',message:'ListTools handler error',data:{error:error?.message,stack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            console.error('Error in ListTools handler:', error);
            throw error;
        }
    });
    
    // Register tool execution handler with error handling
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        try {
            const { name, arguments: args } = request.params;
            
            if (name === 'execute_query') {
                return await handleExecuteQuery(args);
            } else {
                return handleUnknownTool(name);
            }
        } catch (error) {
            // #region agent log
            fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-server.js:48',message:'CallTool handler error',data:{error:error?.message,stack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            console.error('Error in CallTool handler:', error);
            throw error;
        }
    });
    
    return server;
}

/**
 * Start the MCP server
 * @returns {Promise<void>}
 */
export async function startMcpServer() {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-server.js:57',message:'startMcpServer entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Check configuration and log warnings
    const warnings = getConfigurationWarnings();
    if (warnings.length > 0) {
        console.error('Warning: ' + warnings.join(' '));
    } else {
        console.error('Configuration loaded: Database path and password set via environment variables.');
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-server.js:67',message:'Before createMcpServer',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Create server
    const server = createMcpServer();
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-server.js:72',message:'Before transport creation',data:{server:!!server},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    // Create stdio transport
    const transport = new StdioServerTransport();
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-server.js:77',message:'Before server.connect()',data:{transport:!!transport},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Add error handler for transport errors
    transport.onerror = (error) => {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-server.js:89',message:'Transport error',data:{error:error?.message,stack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.error('Transport error:', error);
    };
    
    // Connect server to transport
    try {
        await server.connect(transport);
        
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-server.js:96',message:'server.connect() completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
    } catch (connectError) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-server.js:99',message:'server.connect() error',data:{error:connectError?.message,stack:connectError?.stack,name:connectError?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        throw connectError;
    }
    
    console.error('SQLCipher MCP Server running on stdio');
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-server.js:106',message:'startMcpServer exit - server started',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Keep the process alive - the stdio transport should handle this, but ensure we don't exit
    // Keep stdin open to prevent the process from exiting
    process.stdin.resume();
    
    // Handle stdin end event (when client disconnects)
    process.stdin.on('end', () => {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-server.js:111',message:'stdin ended',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        // When stdin ends, exit gracefully
        process.exit(0);
    });
    
    // Handle errors on stdin
    process.stdin.on('error', (error) => {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-server.js:118',message:'stdin error',data:{error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.error('Stdin error:', error);
    });
}
