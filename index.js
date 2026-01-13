#!/usr/bin/env node

/**
 * SQLCipher MCP Server - Entry Point
 * Provides read-only access to SQLCipher-encrypted SQLite databases via MCP
 */

// #region agent log
fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.js:8',message:'Script started',data:{cwd:process.cwd(),argv:process.argv.slice(0,3)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

// #region agent log
process.on('unhandledRejection', (reason, promise) => {
    fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.js:12',message:'Unhandled promise rejection',data:{reason:reason?.message||String(reason),stack:reason?.stack,name:reason?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
    fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.js:17',message:'Uncaught exception',data:{error:error?.message,stack:error?.stack,name:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    console.error('Uncaught exception:', error);
    process.exit(1);
});

process.on('exit', (code) => {
    fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.js:22',message:'Process exiting',data:{code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
});
// #endregion

// #region agent log
fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.js:26',message:'Before import startMcpServer',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

import { startMcpServer } from './src/server/mcp-server.js';

// #region agent log
fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.js:30',message:'Import completed, calling startMcpServer',data:{startMcpServer:!!startMcpServer},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

// Start the server
startMcpServer().catch((error) => {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/ba5ae969-895e-4c8c-9b24-3b774e2457b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.js:35',message:'startMcpServer catch handler',data:{error:error?.message,stack:error?.stack,name:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error('Fatal error starting server:', error);
    process.exit(1);
});
