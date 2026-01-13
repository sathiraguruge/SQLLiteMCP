/**
 * HTTP Server
 * Express HTTP server setup and initialization
 */

import express from 'express';
import { HTTP_CONFIG } from '../config/constants.js';
import { getPort, isPasswordConfigured } from '../config/environment.js';
import { 
    handleHealthCheck, 
    handleInfo, 
    handleQuery,
    handleListTables,
    handleGetTableSchema,
    handleListColumns,
    handleGetForeignKeys,
    handleGetIndexes,
    handleFindRelatedTables,
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
    handleSearchColumns
} from '../handlers/http-handlers.js';

/**
 * Create and configure Express app
 * @returns {express.Application} Configured Express app
 */
export function createHttpApp() {
    const app = express();
    
    // Middleware to parse JSON request bodies
    app.use(express.json());
    
    // Server Status Routes
    app.get('/health', handleHealthCheck);
    app.get('/api/info', handleInfo);
    
    // Query Execution
    app.post('/api/query', handleQuery);
    
    // Schema Exploration Routes
    app.post('/api/tool/list_tables', handleListTables);
    app.post('/api/tool/get_table_schema', handleGetTableSchema);
    app.post('/api/tool/list_columns', handleListColumns);
    app.post('/api/tool/get_foreign_keys', handleGetForeignKeys);
    app.post('/api/tool/get_indexes', handleGetIndexes);
    app.post('/api/tool/find_related_tables', handleFindRelatedTables);
    
    // Database & Table Info Routes
    app.post('/api/tool/get_database_info', handleGetDatabaseInfo);
    app.post('/api/tool/get_table_info', handleGetTableInfo);
    app.post('/api/tool/test_connection', handleTestConnection);
    
    // Query Helper Routes
    app.post('/api/tool/explain_query', handleExplainQuery);
    app.post('/api/tool/validate_query_syntax', handleValidateQuerySyntax);
    app.post('/api/tool/suggest_query', handleSuggestQuery);
    
    // Data Analysis Routes
    app.post('/api/tool/get_table_statistics', handleGetTableStatistics);
    app.post('/api/tool/sample_table_data', handleSampleTableData);
    app.post('/api/tool/get_column_statistics', handleGetColumnStatistics);
    
    // Search Routes
    app.post('/api/tool/search_tables', handleSearchTables);
    app.post('/api/tool/search_columns', handleSearchColumns);
    
    return app;
}

/**
 * Start the HTTP server
 * @param {number} [port] - Port to listen on (defaults to env or 3000)
 * @returns {Promise<void>}
 */
export async function startHttpServer(port) {
    const app = createHttpApp();
    const serverPort = port || getPort(HTTP_CONFIG.defaultPort);
    
    return new Promise((resolve) => {
        app.listen(serverPort, () => {
            console.log(`SQLCipher MCP HTTP Server running on http://localhost:${serverPort}`);
            console.log(`Health check: http://localhost:${serverPort}/health`);
            console.log(`API info: http://localhost:${serverPort}/api/info`);
            
            if (!isPasswordConfigured()) {
                console.warn('\n⚠️  Warning: SQLCIPHER_PASSWORD environment variable is not set.');
                console.warn('   Database queries will fail until this is configured.\n');
            } else {
                console.log('✅ Database password is configured.\n');
            }
            
            resolve();
        });
    });
}
