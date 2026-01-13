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

/**
 * Get list of tables in the database
 * @param {Database} db - Database connection instance
 * @param {string[]} [tableNames] - Optional array of table names to filter
 * @returns {Promise<Array>} Array of table objects with metadata
 */
export function getTableList(db, tableNames = null) {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT 
                name,
                type,
                sql
            FROM sqlite_master 
            WHERE type IN ('table', 'view')
                AND name NOT LIKE 'sqlite_%'
        `;
        
        // Add filter for specific table names if provided
        if (tableNames && Array.isArray(tableNames) && tableNames.length > 0) {
            const placeholders = tableNames.map(() => '?').join(',');
            query += ` AND name IN (${placeholders})`;
        }
        
        query += ' ORDER BY name';
        
        const params = tableNames && Array.isArray(tableNames) && tableNames.length > 0 ? tableNames : [];
        
        db.all(query, params, (err, rows) => {
            if (err) {
                return reject(new Error(`Failed to get table list: ${err.message}`));
            }
            resolve(rows || []);
        });
    });
}

/**
 * Get table schema information using PRAGMA table_info
 * @param {Database} db - Database connection instance
 * @param {string} tableName - Name of the table
 * @returns {Promise<Object>} Table schema information
 */
export function getTableSchema(db, tableName) {
    return new Promise((resolve, reject) => {
        // First verify table exists
        db.get(
            'SELECT name FROM sqlite_master WHERE type IN ("table", "view") AND name = ?',
            [tableName],
            (err, row) => {
                if (err) {
                    return reject(new Error(`Failed to verify table: ${err.message}`));
                }
                if (!row) {
                    return reject(new Error(`Table "${tableName}" does not exist`));
                }
                
                // Get column information
                db.all(`PRAGMA table_info("${tableName.replace(/"/g, '""')}")`, (pragmaErr, columns) => {
                    if (pragmaErr) {
                        return reject(new Error(`Failed to get table info: ${pragmaErr.message}`));
                    }
                    
                    resolve({
                        tableName: tableName,
                        columns: columns || []
                    });
                });
            }
        );
    });
}

/**
 * Get foreign key information for a table
 * @param {Database} db - Database connection instance
 * @param {string} [tableName] - Optional table name (if not provided, gets all foreign keys)
 * @returns {Promise<Array>} Array of foreign key relationships
 */
export function getForeignKeys(db, tableName = null) {
    return new Promise(async (resolve, reject) => {
        if (tableName) {
            // Get foreign keys for specific table
            db.all(`PRAGMA foreign_key_list("${tableName.replace(/"/g, '""')}")`, (err, fks) => {
                if (err) {
                    return reject(new Error(`Failed to get foreign keys: ${err.message}`));
                }
                resolve(fks.map(fk => ({ ...fk, table: tableName })) || []);
            });
        } else {
            // Get foreign keys for all tables
            try {
                const tables = await getTableList(db);
                const allForeignKeys = [];
                
                let completed = 0;
                const total = tables.length;
                
                if (total === 0) {
                    return resolve([]);
                }
                
                tables.forEach(table => {
                    db.all(`PRAGMA foreign_key_list("${table.name.replace(/"/g, '""')}")`, (err, fks) => {
                        if (!err && fks) {
                            fks.forEach(fk => {
                                allForeignKeys.push({ ...fk, table: table.name });
                            });
                        }
                        
                        completed++;
                        if (completed === total) {
                            resolve(allForeignKeys);
                        }
                    });
                });
            } catch (error) {
                reject(error);
            }
        }
    });
}

/**
 * Get index information for a table or database
 * @param {Database} db - Database connection instance
 * @param {string} [tableName] - Optional table name
 * @returns {Promise<Array>} Array of index information
 */
export function getIndexes(db, tableName = null) {
    return new Promise(async (resolve, reject) => {
        if (tableName) {
            // Get indexes for specific table
            db.all(`PRAGMA index_list("${tableName.replace(/"/g, '""')}")`, (err, indexes) => {
                if (err) {
                    return reject(new Error(`Failed to get indexes: ${err.message}`));
                }
                
                if (!indexes || indexes.length === 0) {
                    return resolve([]);
                }
                
                // Get detailed info for each index
                const indexDetails = [];
                let completed = 0;
                
                indexes.forEach(index => {
                    db.all(`PRAGMA index_info("${index.name.replace(/"/g, '""')}")`, (infoErr, columns) => {
                        if (!infoErr && columns) {
                            indexDetails.push({
                                ...index,
                                table: tableName,
                                columns: columns
                            });
                        }
                        
                        completed++;
                        if (completed === indexes.length) {
                            resolve(indexDetails);
                        }
                    });
                });
            });
        } else {
            // Get indexes for all tables
            try {
                const tables = await getTableList(db);
                const allIndexes = [];
                
                let completed = 0;
                const total = tables.length;
                
                if (total === 0) {
                    return resolve([]);
                }
                
                tables.forEach(table => {
                    db.all(`PRAGMA index_list("${table.name.replace(/"/g, '""')}")`, (err, indexes) => {
                        if (!err && indexes && indexes.length > 0) {
                            let indexCompleted = 0;
                            indexes.forEach(index => {
                                db.all(`PRAGMA index_info("${index.name.replace(/"/g, '""')}")`, (infoErr, columns) => {
                                    if (!infoErr && columns) {
                                        allIndexes.push({
                                            ...index,
                                            table: table.name,
                                            columns: columns
                                        });
                                    }
                                    
                                    indexCompleted++;
                                    if (indexCompleted === indexes.length) {
                                        completed++;
                                        if (completed === total) {
                                            resolve(allIndexes);
                                        }
                                    }
                                });
                            });
                        } else {
                            completed++;
                            if (completed === total) {
                                resolve(allIndexes);
                            }
                        }
                    });
                });
            } catch (error) {
                reject(error);
            }
        }
    });
}

/**
 * Get database metadata information
 * @param {Database} db - Database connection instance
 * @param {string} dbPath - Path to database file
 * @returns {Promise<Object>} Database metadata
 */
export function getDatabaseInfo(db, dbPath) {
    return new Promise(async (resolve, reject) => {
        const info = { path: dbPath };
        const pragmas = [
            'user_version',
            'application_id',
            'page_size',
            'page_count',
            'encoding',
            'freelist_count',
            'schema_version'
        ];
        
        let completed = 0;
        let hasError = false;
        
        // Get file size
        try {
            const fs = await import('fs');
            const stats = fs.statSync(dbPath);
            info.size_bytes = stats.size;
        } catch (e) {
            // Ignore file stat errors
        }
        
        // Get SQLite version
        db.get('SELECT sqlite_version() as version', (err, row) => {
            if (!err && row) {
                info.sqlite_version = row.version;
            }
        });
        
        pragmas.forEach(pragma => {
            db.get(`PRAGMA ${pragma}`, (err, row) => {
                if (!hasError) {
                    if (err) {
                        hasError = true;
                        return reject(new Error(`Failed to get database info: ${err.message}`));
                    }
                    
                    if (row) {
                        const key = Object.keys(row)[0];
                        info[pragma] = row[key];
                    }
                }
                
                completed++;
                if (completed === pragmas.length && !hasError) {
                    resolve(info);
                }
            });
        });
    });
}

/**
 * Get table information including row count
 * @param {Database} db - Database connection instance
 * @param {string} tableName - Name of the table
 * @returns {Promise<Object>} Table information
 */
export function getTableInfo(db, tableName) {
    return new Promise((resolve, reject) => {
        // Verify table exists
        db.get(
            'SELECT name, type, sql FROM sqlite_master WHERE type IN ("table", "view") AND name = ?',
            [tableName],
            (err, table) => {
                if (err) {
                    return reject(new Error(`Failed to get table info: ${err.message}`));
                }
                if (!table) {
                    return reject(new Error(`Table "${tableName}" does not exist`));
                }
                
                // Get row count
                db.get(`SELECT COUNT(*) as count FROM "${tableName.replace(/"/g, '""')}"`, (countErr, countRow) => {
                    if (countErr) {
                        return reject(new Error(`Failed to count rows: ${countErr.message}`));
                    }
                    
                    // Get column count
                    db.all(`PRAGMA table_info("${tableName.replace(/"/g, '""')}")`, (pragmaErr, columns) => {
                        if (pragmaErr) {
                            return reject(new Error(`Failed to get column info: ${pragmaErr.message}`));
                        }
                        
                        resolve({
                            name: table.name,
                            type: table.type,
                            row_count: countRow ? countRow.count : 0,
                            column_count: columns ? columns.length : 0,
                            sql: table.sql
                        });
                    });
                });
            }
        );
    });
}

/**
 * Test database connection
 * @param {Database} db - Database connection instance
 * @returns {Promise<boolean>} True if connection is valid
 */
export function testConnection(db) {
    return new Promise((resolve, reject) => {
        db.get('SELECT 1 as test', (err, row) => {
            if (err) {
                return reject(new Error(`Connection test failed: ${err.message}`));
            }
            resolve(true);
        });
    });
}

/**
 * Explain query execution plan
 * @param {Database} db - Database connection instance
 * @param {string} query - SQL query to explain
 * @returns {Promise<Array>} Query execution plan
 */
export function explainQueryPlan(db, query) {
    return new Promise((resolve, reject) => {
        // Validate query is a SELECT query
        try {
            validateSelectQuery(query);
        } catch (validationError) {
            return reject(validationError);
        }
        
        db.all(`EXPLAIN QUERY PLAN ${query}`, (err, rows) => {
            if (err) {
                return reject(new Error(`Failed to explain query: ${err.message}`));
            }
            resolve(rows || []);
        });
    });
}

/**
 * Get statistics for a table
 * @param {Database} db - Database connection instance
 * @param {string} tableName - Name of the table
 * @param {number} maxSampleSize - Maximum number of rows to sample
 * @returns {Promise<Object>} Table statistics
 */
export function getTableStatistics(db, tableName, maxSampleSize = 10000) {
    return new Promise(async (resolve, reject) => {
        try {
            // Get table schema first
            const schema = await getTableSchema(db, tableName);
            const columns = schema.columns;
            
            // Get row count
            db.get(`SELECT COUNT(*) as total_rows FROM "${tableName.replace(/"/g, '""')}"`, async (err, countRow) => {
                if (err) {
                    return reject(new Error(`Failed to get row count: ${err.message}`));
                }
                
                const totalRows = countRow ? countRow.total_rows : 0;
                const statistics = {
                    table_name: tableName,
                    total_rows: totalRows,
                    column_count: columns.length,
                    columns: []
                };
                
                if (columns.length === 0 || totalRows === 0) {
                    return resolve(statistics);
                }
                
                // For each column, get basic statistics
                let completed = 0;
                
                columns.forEach(column => {
                    const columnName = column.name;
                    const columnType = column.type;
                    const escapedColumn = `"${columnName.replace(/"/g, '""')}"`;
                    
                    // Get distinct count and null count
                    const statsQuery = `
                        SELECT 
                            COUNT(DISTINCT ${escapedColumn}) as distinct_count,
                            COUNT(*) - COUNT(${escapedColumn}) as null_count
                        FROM "${tableName.replace(/"/g, '""')}"
                    `;
                    
                    db.get(statsQuery, (statsErr, statsRow) => {
                        const columnStats = {
                            name: columnName,
                            type: columnType,
                            distinct_count: 0,
                            null_count: 0
                        };
                        
                        if (!statsErr && statsRow) {
                            columnStats.distinct_count = statsRow.distinct_count || 0;
                            columnStats.null_count = statsRow.null_count || 0;
                        }
                        
                        // For numeric columns, get min/max/avg
                        if (columnType && (columnType.toUpperCase().includes('INT') || 
                            columnType.toUpperCase().includes('REAL') || 
                            columnType.toUpperCase().includes('NUMERIC') ||
                            columnType.toUpperCase().includes('FLOAT') ||
                            columnType.toUpperCase().includes('DOUBLE'))) {
                            
                            const numericQuery = `
                                SELECT 
                                    MIN(${escapedColumn}) as min_value,
                                    MAX(${escapedColumn}) as max_value,
                                    AVG(${escapedColumn}) as avg_value
                                FROM "${tableName.replace(/"/g, '""')}"
                            `;
                            
                            db.get(numericQuery, (numErr, numRow) => {
                                if (!numErr && numRow) {
                                    columnStats.min_value = numRow.min_value;
                                    columnStats.max_value = numRow.max_value;
                                    columnStats.avg_value = numRow.avg_value;
                                }
                                
                                statistics.columns.push(columnStats);
                                completed++;
                                
                                if (completed === columns.length) {
                                    resolve(statistics);
                                }
                            });
                        } else {
                            statistics.columns.push(columnStats);
                            completed++;
                            
                            if (completed === columns.length) {
                                resolve(statistics);
                            }
                        }
                    });
                });
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Sample table data
 * @param {Database} db - Database connection instance
 * @param {string} tableName - Name of the table
 * @param {number} limit - Number of rows to sample
 * @param {number} offset - Offset for sampling
 * @param {string[]} columns - Optional array of column names to include
 * @returns {Promise<Object>} Sample data
 */
export function sampleTableData(db, tableName, limit = 10, offset = 0, columns = null) {
    return new Promise((resolve, reject) => {
        // Build column list
        let columnList = '*';
        if (columns && Array.isArray(columns) && columns.length > 0) {
            columnList = columns.map(col => `"${col.replace(/"/g, '""')}"`).join(', ');
        }
        
        const query = `SELECT ${columnList} FROM "${tableName.replace(/"/g, '""')}" LIMIT ? OFFSET ?`;
        
        db.all(query, [limit, offset], (err, rows) => {
            if (err) {
                if (err.message.includes('no such table')) {
                    return reject(new Error(`Table "${tableName}" does not exist`));
                } else if (err.message.includes('no such column')) {
                    return reject(new Error(`One or more specified columns do not exist`));
                }
                return reject(new Error(`Failed to sample table data: ${err.message}`));
            }
            
            // Get column names
            let columnNames = [];
            if (rows && rows.length > 0) {
                columnNames = Object.keys(rows[0]);
            }
            
            resolve({
                table_name: tableName,
                columns: columnNames,
                rows: rows || [],
                row_count: rows ? rows.length : 0,
                limit: limit,
                offset: offset
            });
        });
    });
}

/**
 * Get column statistics
 * @param {Database} db - Database connection instance
 * @param {string} tableName - Name of the table
 * @param {string[]} columnNames - Array of column names
 * @param {number} maxSampleSize - Maximum sample size
 * @returns {Promise<Array>} Array of column statistics
 */
export function getColumnStatistics(db, tableName, columnNames, maxSampleSize = 10000) {
    return new Promise(async (resolve, reject) => {
        try {
            // Verify table exists and get schema
            const schema = await getTableSchema(db, tableName);
            const allColumns = schema.columns.map(c => c.name);
            
            // Verify requested columns exist
            const invalidColumns = columnNames.filter(name => !allColumns.includes(name));
            if (invalidColumns.length > 0) {
                return reject(new Error(`Columns do not exist: ${invalidColumns.join(', ')}`));
            }
            
            const columnStats = [];
            let completed = 0;
            
            columnNames.forEach(columnName => {
                const column = schema.columns.find(c => c.name === columnName);
                const escapedColumn = `"${columnName.replace(/"/g, '""')}"`;
                
                // Get basic statistics
                const basicQuery = `
                    SELECT 
                        COUNT(DISTINCT ${escapedColumn}) as distinct_count,
                        COUNT(*) - COUNT(${escapedColumn}) as null_count,
                        COUNT(${escapedColumn}) as non_null_count
                    FROM "${tableName.replace(/"/g, '""')}"
                `;
                
                db.get(basicQuery, (err, basicRow) => {
                    const stats = {
                        table_name: tableName,
                        column_name: columnName,
                        column_type: column ? column.type : 'UNKNOWN',
                        distinct_count: 0,
                        null_count: 0,
                        non_null_count: 0
                    };
                    
                    if (!err && basicRow) {
                        stats.distinct_count = basicRow.distinct_count || 0;
                        stats.null_count = basicRow.null_count || 0;
                        stats.non_null_count = basicRow.non_null_count || 0;
                    }
                    
                    // For numeric columns, get min/max/avg
                    const columnType = column ? column.type : '';
                    if (columnType && (columnType.toUpperCase().includes('INT') || 
                        columnType.toUpperCase().includes('REAL') || 
                        columnType.toUpperCase().includes('NUMERIC') ||
                        columnType.toUpperCase().includes('FLOAT') ||
                        columnType.toUpperCase().includes('DOUBLE'))) {
                        
                        const numericQuery = `
                            SELECT 
                                MIN(${escapedColumn}) as min_value,
                                MAX(${escapedColumn}) as max_value,
                                AVG(${escapedColumn}) as avg_value
                            FROM "${tableName.replace(/"/g, '""')}"
                        `;
                        
                        db.get(numericQuery, (numErr, numRow) => {
                            if (!numErr && numRow) {
                                stats.min_value = numRow.min_value;
                                stats.max_value = numRow.max_value;
                                stats.avg_value = numRow.avg_value;
                            }
                            
                            // Get sample values
                            const sampleQuery = `
                                SELECT DISTINCT ${escapedColumn} as value
                                FROM "${tableName.replace(/"/g, '""')}"
                                WHERE ${escapedColumn} IS NOT NULL
                                LIMIT 5
                            `;
                            
                            db.all(sampleQuery, (sampleErr, sampleRows) => {
                                if (!sampleErr && sampleRows) {
                                    stats.sample_values = sampleRows.map(r => r.value);
                                }
                                
                                columnStats.push(stats);
                                completed++;
                                
                                if (completed === columnNames.length) {
                                    resolve(columnStats);
                                }
                            });
                        });
                    } else {
                        // Get sample values for non-numeric columns
                        const sampleQuery = `
                            SELECT DISTINCT ${escapedColumn} as value
                            FROM "${tableName.replace(/"/g, '""')}"
                            WHERE ${escapedColumn} IS NOT NULL
                            LIMIT 5
                        `;
                        
                        db.all(sampleQuery, (sampleErr, sampleRows) => {
                            if (!sampleErr && sampleRows) {
                                stats.sample_values = sampleRows.map(r => r.value);
                            }
                            
                            columnStats.push(stats);
                            completed++;
                            
                            if (completed === columnNames.length) {
                                resolve(columnStats);
                            }
                        });
                    }
                });
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Search for tables by name pattern
 * @param {Database} db - Database connection instance
 * @param {string} pattern - SQL LIKE pattern
 * @returns {Promise<Array>} Matching tables
 */
export function searchTables(db, pattern) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT name, type, sql
            FROM sqlite_master
            WHERE type IN ('table', 'view')
                AND name NOT LIKE 'sqlite_%'
                AND name LIKE ?
            ORDER BY name
        `;
        
        db.all(query, [pattern], (err, rows) => {
            if (err) {
                return reject(new Error(`Failed to search tables: ${err.message}`));
            }
            resolve(rows || []);
        });
    });
}

/**
 * Search for columns across all tables
 * @param {Database} db - Database connection instance
 * @param {string} pattern - SQL LIKE pattern
 * @returns {Promise<Array>} Matching columns with table names
 */
export function searchColumns(db, pattern) {
    return new Promise(async (resolve, reject) => {
        try {
            const tables = await getTableList(db);
            const matchingColumns = [];
            
            if (tables.length === 0) {
                return resolve([]);
            }
            
            let completed = 0;
            
            tables.forEach(table => {
                db.all(`PRAGMA table_info("${table.name.replace(/"/g, '""')}")`, (err, columns) => {
                    if (!err && columns) {
                        columns.forEach(column => {
                            // SQLite LIKE is case-insensitive by default
                            const columnName = column.name;
                            const regex = new RegExp(pattern.replace(/%/g, '.*').replace(/_/g, '.'), 'i');
                            if (regex.test(columnName)) {
                                matchingColumns.push({
                                    table_name: table.name,
                                    column_name: column.name,
                                    column_type: column.type,
                                    is_primary_key: column.pk === 1,
                                    is_nullable: column.notnull === 0
                                });
                            }
                        });
                    }
                    
                    completed++;
                    if (completed === tables.length) {
                        resolve(matchingColumns);
                    }
                });
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Find tables related to a given table via foreign keys
 * @param {Database} db - Database connection instance
 * @param {string} tableName - Name of the table
 * @returns {Promise<Object>} Related tables information
 */
export function findRelatedTables(db, tableName) {
    return new Promise(async (resolve, reject) => {
        try {
            // Verify table exists
            const schema = await getTableSchema(db, tableName);
            
            // Get foreign keys from this table (outgoing relationships)
            const outgoingFks = await getForeignKeys(db, tableName);
            
            // Get foreign keys to this table (incoming relationships)
            const allFks = await getForeignKeys(db);
            const incomingFks = allFks.filter(fk => fk.table === tableName);
            
            const relatedTables = {
                table_name: tableName,
                references_tables: [...new Set(outgoingFks.map(fk => fk.table))],
                referenced_by_tables: [...new Set(incomingFks.map(fk => fk.table))],
                outgoing_foreign_keys: outgoingFks,
                incoming_foreign_keys: incomingFks
            };
            
            resolve(relatedTables);
        } catch (error) {
            reject(error);
        }
    });
}
