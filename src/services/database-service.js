/**
 * Database Service
 * Service layer that wraps database operations with error handling
 */

import { connectDatabase, executeQuery, closeConnection } from '../../lib/database.js';

/**
 * Execute a query on a database
 * Handles connection, query execution, and cleanup
 * @param {string} dbPath - Path to the database file
 * @param {string|undefined} password - Database password (optional)
 * @param {string} query - SQL query to execute
 * @returns {Promise<Object>} Query results
 * @throws {Error} If connection or query execution fails
 */
export async function executeQueryOnDatabase(dbPath, password, query) {
    let db = null;
    
    try {
        // Connect to database
        db = await connectDatabase(dbPath, password);
        
        // Execute query
        const result = await executeQuery(db, query);
        
        return result;
    } finally {
        // Always close the database connection
        if (db) {
            closeConnection(db);
        }
    }
}

/**
 * Test database connection
 * @param {string} dbPath - Path to the database file
 * @param {string|undefined} password - Database password (optional)
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testDatabaseConnection(dbPath, password) {
    let db = null;
    
    try {
        db = await connectDatabase(dbPath, password);
        return true;
    } catch (error) {
        throw new Error(`Failed to connect to database: ${error.message}`);
    } finally {
        if (db) {
            closeConnection(db);
        }
    }
}
