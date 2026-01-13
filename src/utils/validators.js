/**
 * Validation Utilities
 * Input validation and sanitization functions
 */

import { getDatabasePath } from '../config/environment.js';

/**
 * Validate that arguments is a valid object
 * @param {any} args - Arguments to validate
 * @throws {Error} If args is not a valid object
 */
export function validateArguments(args) {
    if (!args || typeof args !== 'object') {
        throw new Error('Invalid arguments: arguments must be an object');
    }
}

/**
 * Validate query parameter
 * @param {any} query - Query to validate
 * @throws {Error} If query is invalid
 */
export function validateQuery(query) {
    if (!query || typeof query !== 'string') {
        throw new Error('query is required and must be a string');
    }
}

/**
 * Validate and resolve database path
 * Uses provided path or falls back to environment variable
 * @param {string|undefined} providedPath - Database path from arguments
 * @returns {string} Resolved database path
 * @throws {Error} If no valid path is available
 */
export function resolveDatabasePath(providedPath) {
    const dbPath = providedPath || getDatabasePath();
    
    if (!dbPath || typeof dbPath !== 'string') {
        throw new Error(
            'database_path is required. Provide it as a parameter or set SQLCIPHER_DATABASE_PATH environment variable.'
        );
    }
    
    return dbPath;
}

/**
 * Validate database path parameter for HTTP requests
 * @param {any} database_path - Database path to validate
 * @throws {Error} If database_path is invalid
 */
export function validateDatabasePath(database_path) {
    if (!database_path || typeof database_path !== 'string') {
        throw new Error('database_path is required and must be a string');
    }
}
