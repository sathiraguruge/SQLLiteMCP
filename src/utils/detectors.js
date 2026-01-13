/**
 * Database Type Detection Utilities
 * Utilities for detecting and handling encrypted vs unencrypted databases
 */

/**
 * Detect if a database is encrypted or unencrypted
 * This is a helper function that attempts to determine database type
 * @param {string} dbPath - Path to the database file
 * @returns {Promise<{isEncrypted: boolean, needsPassword: boolean}>}
 */
export async function detectDatabaseType(dbPath) {
    // For now, we'll rely on the connection logic in database.js
    // which handles both encrypted and unencrypted databases gracefully
    // This function can be expanded in the future for more sophisticated detection
    return {
        isEncrypted: false, // Will be determined during connection
        needsPassword: false // Will be determined during connection
    };
}

/**
 * Sanitize table/column names to prevent SQL injection
 * @param {string} name - Table or column name
 * @returns {string} Sanitized name
 * @throws {Error} If name contains invalid characters
 */
export function sanitizeSqlIdentifier(name) {
    if (!name || typeof name !== 'string') {
        throw new Error('Invalid identifier: must be a non-empty string');
    }
    
    // SQLite identifiers can contain letters, digits, underscores, and dollar signs
    // They cannot start with a digit (except for auto-generated names)
    const validPattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
    
    if (!validPattern.test(name)) {
        throw new Error(`Invalid identifier: "${name}" contains invalid characters. Only letters, numbers, underscores, and dollar signs are allowed.`);
    }
    
    return name;
}

/**
 * Escape a SQL identifier for use in queries
 * @param {string} identifier - Table or column name
 * @returns {string} Escaped identifier wrapped in quotes
 */
export function escapeIdentifier(identifier) {
    // Sanitize first
    sanitizeSqlIdentifier(identifier);
    
    // Wrap in double quotes and escape any double quotes in the identifier
    return `"${identifier.replace(/"/g, '""')}"`;
}
