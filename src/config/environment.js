/**
 * Environment Configuration
 * Manages environment variables and application configuration
 */

/**
 * Get database password from environment variable
 * @returns {string|undefined} Database password or undefined if not set
 */
export function getDatabasePassword() {
    return process.env.SQLCIPHER_PASSWORD;
}

/**
 * Get default database path from environment variable
 * @returns {string|undefined} Database path or undefined if not set
 */
export function getDatabasePath() {
    return process.env.SQLCIPHER_DATABASE_PATH;
}

/**
 * Get HTTP server port from environment variable
 * @param {number} defaultPort - Default port to use if not set
 * @returns {number} Port number
 */
export function getPort(defaultPort = 3000) {
    return process.env.PORT || defaultPort;
}

/**
 * Check if password is configured
 * @returns {boolean} True if password is set
 */
export function isPasswordConfigured() {
    return !!getDatabasePassword();
}

/**
 * Check if database path is configured
 * @returns {boolean} True if database path is set
 */
export function isDatabasePathConfigured() {
    return !!getDatabasePath();
}

/**
 * Get configuration warnings for missing environment variables
 * @returns {string[]} Array of warning messages
 */
export function getConfigurationWarnings() {
    const warnings = [];
    
    if (!isPasswordConfigured()) {
        warnings.push('SQLCIPHER_PASSWORD environment variable is not set. Database connections may fail if password is required.');
    }
    
    if (!isDatabasePathConfigured()) {
        warnings.push('SQLCIPHER_DATABASE_PATH environment variable is not set. Database path must be provided in each query.');
    }
    
    return warnings;
}
