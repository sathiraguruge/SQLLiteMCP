import sqlcipher from '@journeyapps/sqlcipher';
import fs from 'fs';

// Extract Database from the sqlcipher module object
const Database = sqlcipher.Database;

/**
 * Connects to a SQLite database (encrypted or unencrypted)
 * Supports both SQLCipher-encrypted and plain SQLite databases
 * 
 * @param {string} dbPath - Path to the database file
 * @param {string} [password] - Optional database password (for encrypted databases)
 * @returns {Promise<Database>} Database connection instance
 * @throws {Error} If database file doesn't exist or connection fails
 */
export function connectDatabase(dbPath, password) {
    return new Promise((resolve, reject) => {
        // Validate database path exists
        if (!fs.existsSync(dbPath)) {
            return reject(new Error(`Database file not found: ${dbPath}`));
        }

        let db = null;
        // Open database connection with callback
        db = new Database(dbPath, (err) => {
            if (err) {
                return reject(new Error(`Failed to open database: ${err.message}`));
            }

            // If no password provided, treat as unencrypted SQLite database
            if (!password || password.trim() === '') {
                // Verify the database is accessible by running a simple query
                db.get('SELECT 1', (getErr, row) => {
                    if (getErr) {
                        db.close((closeErr) => {
                            // Ignore close errors
                        });
                        return reject(new Error(`Failed to verify database: ${getErr.message}`));
                    }
                    resolve(db);
                });
                return;
            }

            // Password provided - treat as encrypted SQLCipher database
            // Explicitly set SQLCipher 3 compatibility mode
            // This ensures SQLCipher 3 defaults are used:
            // - Page size: 1024 bytes
            // - PBKDF2 iterations: 64,000
            // - KDF algorithm: PBKDF2-HMAC-SHA1
            // - HMAC algorithm: HMAC-SHA1
            db.exec('PRAGMA cipher_compatibility = 3', (compatErr) => {
                if (compatErr) {
                    db.close((closeErr) => {
                        // Ignore close errors
                    });
                    return reject(new Error(`Failed to set SQLCipher 3 compatibility: ${compatErr.message}`));
                }

                // Set SQLCipher 3 default encryption settings
                // PRAGMA key sets the encryption key using SQLCipher 3 defaults
                // PRAGMA key does NOT support parameterized queries, so we must embed the password directly
                // Escape single quotes in password for SQL (double them) and escape backslashes
                const escapedPassword = password.replace(/\\/g, '\\\\').replace(/'/g, "''");
                
                // Use db.exec() with callback for PRAGMA key
                db.exec(`PRAGMA key = '${escapedPassword}'`, (execErr) => {
                    if (execErr) {
                        db.close((closeErr) => {
                            // Ignore close errors
                        });
                        return reject(new Error(`Failed to set encryption key: ${execErr.message}`));
                    }
                    
                    // Verify the database is accessible by running a simple query
                    // This will throw an error if the password is incorrect
                    db.get('SELECT 1', (getErr, row) => {
                        if (getErr) {
                            db.close((closeErr) => {
                                // Ignore close errors
                            });

                            if (getErr.message.includes('file is not a database') || 
                                getErr.message.includes('malformed database') ||
                                getErr.code === 'SQLITE_NOTADB') {
                                return reject(new Error('Invalid password or database is corrupted'));
                            }
                            return reject(new Error(`Failed to verify database: ${getErr.message}`));
                        }
                        
                        resolve(db);
                    });
                });
            });
        });
    });
}

/**
 * Validates that a SQL query is a SELECT query (read-only)
 * 
 * @param {string} query - SQL query string
 * @returns {boolean} True if query is a SELECT query
 * @throws {Error} If query is not a SELECT query
 */
function validateSelectQuery(query) {
    if (!query || typeof query !== 'string') {
        throw new Error('Query must be a non-empty string');
    }

    // Trim and normalize whitespace
    const normalizedQuery = query.trim().replace(/\s+/g, ' ');

    // Check if query starts with SELECT (case-insensitive)
    if (!normalizedQuery.match(/^SELECT\s+/i)) {
        throw new Error('Only SELECT queries are allowed (read-only mode)');
    }

    // Additional check: ensure no DDL or DML keywords are present
    const forbiddenKeywords = [
        'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 
        'TRUNCATE', 'REPLACE', 'PRAGMA'
    ];
    
    const upperQuery = normalizedQuery.toUpperCase();
    for (const keyword of forbiddenKeywords) {
        // Check for keyword followed by space or semicolon (to avoid false positives)
        const regex = new RegExp(`\\b${keyword}\\s+`, 'i');
        if (regex.test(normalizedQuery) && keyword !== 'SELECT') {
            throw new Error(`Query contains forbidden keyword: ${keyword}. Only SELECT queries are allowed.`);
        }
    }

    return true;
}

/**
 * Executes a SELECT query on the database and returns results
 * 
 * @param {Database} db - Database connection instance
 * @param {string} query - SQL SELECT query to execute
 * @returns {Promise<Object>} Query results with columns, rows, and rowCount
 * @throws {Error} If query is invalid or execution fails
 */
export function executeQuery(db, query) {
    return new Promise((resolve, reject) => {
        // Validate query is a SELECT query
        try {
            validateSelectQuery(query);
        } catch (validationError) {
            return reject(validationError);
        }

        // Prepare and execute the query with callback
        const statement = db.prepare(query, (prepareErr) => {
            if (prepareErr) {
                return reject(new Error(`Query preparation failed: ${prepareErr.message}`));
            }
            
            // Execute query with callback - statement.all() requires a callback
            statement.all((allErr, rows) => {
                if (allErr) {
                    statement.finalize();
                    if (allErr.message.includes('no such table')) {
                        return reject(new Error(`Table not found: ${allErr.message}`));
                    } else if (allErr.message.includes('no such column')) {
                        return reject(new Error(`Column not found: ${allErr.message}`));
                    } else if (allErr.message.includes('syntax error')) {
                        return reject(new Error(`SQL syntax error: ${allErr.message}`));
                    }
                    return reject(new Error(`Query execution failed: ${allErr.message}`));
                }

                // Get column names from the first row
                let columns = [];
                if (rows && rows.length > 0) {
                    columns = Object.keys(rows[0]);
                }

                // Finalize the statement
                statement.finalize();

                resolve({
                    columns: columns,
                    rows: rows || [],
                    rowCount: rows ? rows.length : 0
                });
            });
        });
    });
}

/**
 * Closes a database connection
 * Ensures all statements are finalized before closing
 * 
 * @param {Database} db - Database connection instance
 */
export function closeConnection(db) {
    if (!db || typeof db.close !== 'function') {
        return;
    }

    try {
        // Close with callback to handle any errors gracefully
        db.close((err) => {
            if (err) {
                // Log but don't throw - closing should be best effort
                console.error('Error closing database connection:', err.message);
            }
        });
    } catch (error) {
        // Log but don't throw - closing should be best effort
        console.error('Error closing database connection:', error.message);
    }
}
