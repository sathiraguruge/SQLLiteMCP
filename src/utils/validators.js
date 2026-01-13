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

/**
 * Validate table name parameter
 * @param {any} tableName - Table name to validate
 * @throws {Error} If tableName is invalid
 */
export function validateTableName(tableName) {
    if (!tableName) {
        throw new Error('table_name is required');
    }
    
    if (typeof tableName !== 'string' && !Array.isArray(tableName)) {
        throw new Error('table_name must be a string or array of strings');
    }
    
    if (Array.isArray(tableName)) {
        if (tableName.length === 0) {
            throw new Error('table_name array cannot be empty');
        }
        tableName.forEach((name, index) => {
            if (typeof name !== 'string') {
                throw new Error(`table_name[${index}] must be a string`);
            }
        });
    }
}

/**
 * Validate column name parameter
 * @param {any} columnName - Column name to validate
 * @throws {Error} If columnName is invalid
 */
export function validateColumnName(columnName) {
    if (!columnName) {
        throw new Error('column_name is required');
    }
    
    if (typeof columnName !== 'string' && !Array.isArray(columnName)) {
        throw new Error('column_name must be a string or array of strings');
    }
    
    if (Array.isArray(columnName)) {
        if (columnName.length === 0) {
            throw new Error('column_name array cannot be empty');
        }
        columnName.forEach((name, index) => {
            if (typeof name !== 'string') {
                throw new Error(`column_name[${index}] must be a string`);
            }
        });
    }
}

/**
 * Validate pattern parameter for search operations
 * @param {any} pattern - Pattern to validate
 * @throws {Error} If pattern is invalid
 */
export function validatePattern(pattern) {
    if (!pattern || typeof pattern !== 'string') {
        throw new Error('pattern is required and must be a string');
    }
}

/**
 * Validate numeric parameter
 * @param {any} value - Value to validate
 * @param {string} paramName - Parameter name for error messages
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Validated number
 * @throws {Error} If value is invalid
 */
export function validateNumericParameter(value, paramName, min = 0, max = Number.MAX_SAFE_INTEGER) {
    if (value === undefined || value === null) {
        return undefined;
    }
    
    const num = Number(value);
    if (isNaN(num)) {
        throw new Error(`${paramName} must be a number`);
    }
    
    if (num < min || num > max) {
        throw new Error(`${paramName} must be between ${min} and ${max}`);
    }
    
    return num;
}