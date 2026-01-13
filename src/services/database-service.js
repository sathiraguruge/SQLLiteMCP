/**
 * Database Service
 * Service layer that wraps database operations with error handling
 */

import { 
    connectDatabase, 
    executeQuery, 
    closeConnection,
    getTableList,
    getTableSchema,
    getForeignKeys,
    getIndexes,
    getDatabaseInfo,
    getTableInfo,
    testConnection,
    explainQueryPlan,
    getTableStatistics,
    sampleTableData,
    getColumnStatistics,
    searchTables,
    searchColumns,
    findRelatedTables
} from '../utils/database-operations.js';

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
        await testConnection(db);
        return true;
    } catch (error) {
        throw new Error(`Failed to connect to database: ${error.message}`);
    } finally {
        if (db) {
            closeConnection(db);
        }
    }
}

/**
 * Get list of tables from database
 * @param {string} dbPath - Path to the database file
 * @param {string|undefined} password - Database password (optional)
 * @param {string[]} tableNames - Optional array of table names to filter
 * @returns {Promise<Array>} Array of table objects
 */
export async function getTableListFromDatabase(dbPath, password, tableNames = null) {
    let db = null;
    
    try {
        db = await connectDatabase(dbPath, password);
        const tables = await getTableList(db, tableNames);
        
        // Get row counts for each table
        const tablesWithCounts = await Promise.all(
            tables.map(async (table) => {
                try {
                    const info = await getTableInfo(db, table.name);
                    return {
                        ...table,
                        row_count: info.row_count
                    };
                } catch (error) {
                    return {
                        ...table,
                        row_count: 0
                    };
                }
            })
        );
        
        return tablesWithCounts;
    } finally {
        if (db) {
            closeConnection(db);
        }
    }
}

/**
 * Get table schema from database
 * @param {string} dbPath - Path to the database file
 * @param {string|undefined} password - Database password (optional)
 * @param {string|string[]} tableName - Table name or array of table names
 * @returns {Promise<Object|Array>} Table schema or array of schemas
 */
export async function getTableSchemaFromDatabase(dbPath, password, tableName) {
    let db = null;
    
    try {
        db = await connectDatabase(dbPath, password);
        
        // Handle batch operation
        if (Array.isArray(tableName)) {
            const schemas = await Promise.all(
                tableName.map(async (name) => {
                    try {
                        const schema = await getTableSchema(db, name);
                        const fks = await getForeignKeys(db, name);
                        const indexes = await getIndexes(db, name);
                        return {
                            ...schema,
                            foreign_keys: fks,
                            indexes: indexes
                        };
                    } catch (error) {
                        return {
                            tableName: name,
                            error: error.message
                        };
                    }
                })
            );
            return schemas;
        } else {
            // Single table
            const schema = await getTableSchema(db, tableName);
            const fks = await getForeignKeys(db, tableName);
            const indexes = await getIndexes(db, tableName);
            return {
                ...schema,
                foreign_keys: fks,
                indexes: indexes
            };
        }
    } finally {
        if (db) {
            closeConnection(db);
        }
    }
}

/**
 * Get foreign keys from database
 * @param {string} dbPath - Path to the database file
 * @param {string|undefined} password - Database password (optional)
 * @param {string} tableName - Optional table name
 * @returns {Promise<Array>} Array of foreign key relationships
 */
export async function getForeignKeysFromDatabase(dbPath, password, tableName = null) {
    let db = null;
    
    try {
        db = await connectDatabase(dbPath, password);
        return await getForeignKeys(db, tableName);
    } finally {
        if (db) {
            closeConnection(db);
        }
    }
}

/**
 * Get indexes from database
 * @param {string} dbPath - Path to the database file
 * @param {string|undefined} password - Database password (optional)
 * @param {string} tableName - Optional table name
 * @returns {Promise<Array>} Array of index information
 */
export async function getIndexesFromDatabase(dbPath, password, tableName = null) {
    let db = null;
    
    try {
        db = await connectDatabase(dbPath, password);
        return await getIndexes(db, tableName);
    } finally {
        if (db) {
            closeConnection(db);
        }
    }
}

/**
 * Get database info
 * @param {string} dbPath - Path to the database file
 * @param {string|undefined} password - Database password (optional)
 * @returns {Promise<Object>} Database metadata
 */
export async function getDatabaseInfoFromDatabase(dbPath, password) {
    let db = null;
    
    try {
        db = await connectDatabase(dbPath, password);
        return await getDatabaseInfo(db, dbPath);
    } finally {
        if (db) {
            closeConnection(db);
        }
    }
}

/**
 * Get table info
 * @param {string} dbPath - Path to the database file
 * @param {string|undefined} password - Database password (optional)
 * @param {string} tableName - Table name
 * @returns {Promise<Object>} Table information
 */
export async function getTableInfoFromDatabase(dbPath, password, tableName) {
    let db = null;
    
    try {
        db = await connectDatabase(dbPath, password);
        return await getTableInfo(db, tableName);
    } finally {
        if (db) {
            closeConnection(db);
        }
    }
}

/**
 * Explain query plan
 * @param {string} dbPath - Path to the database file
 * @param {string|undefined} password - Database password (optional)
 * @param {string} query - SQL query
 * @returns {Promise<Array>} Query execution plan
 */
export async function explainQueryPlanFromDatabase(dbPath, password, query) {
    let db = null;
    
    try {
        db = await connectDatabase(dbPath, password);
        return await explainQueryPlan(db, query);
    } finally {
        if (db) {
            closeConnection(db);
        }
    }
}

/**
 * Get table statistics
 * @param {string} dbPath - Path to the database file
 * @param {string|undefined} password - Database password (optional)
 * @param {string} tableName - Table name
 * @param {number} maxSampleSize - Maximum sample size
 * @returns {Promise<Object>} Table statistics
 */
export async function getTableStatisticsFromDatabase(dbPath, password, tableName, maxSampleSize = 10000) {
    let db = null;
    
    try {
        db = await connectDatabase(dbPath, password);
        return await getTableStatistics(db, tableName, maxSampleSize);
    } finally {
        if (db) {
            closeConnection(db);
        }
    }
}

/**
 * Sample table data
 * @param {string} dbPath - Path to the database file
 * @param {string|undefined} password - Database password (optional)
 * @param {string} tableName - Table name
 * @param {number} limit - Row limit
 * @param {number} offset - Row offset
 * @param {string[]} columns - Optional column filter
 * @returns {Promise<Object>} Sample data
 */
export async function sampleTableDataFromDatabase(dbPath, password, tableName, limit = 10, offset = 0, columns = null) {
    let db = null;
    
    try {
        db = await connectDatabase(dbPath, password);
        return await sampleTableData(db, tableName, limit, offset, columns);
    } finally {
        if (db) {
            closeConnection(db);
        }
    }
}

/**
 * Get column statistics
 * @param {string} dbPath - Path to the database file
 * @param {string|undefined} password - Database password (optional)
 * @param {string} tableName - Table name
 * @param {string|string[]} columnName - Column name or array of column names
 * @param {number} maxSampleSize - Maximum sample size
 * @returns {Promise<Array>} Column statistics
 */
export async function getColumnStatisticsFromDatabase(dbPath, password, tableName, columnName, maxSampleSize = 10000) {
    let db = null;
    
    try {
        db = await connectDatabase(dbPath, password);
        
        // Handle single column or array
        const columnNames = Array.isArray(columnName) ? columnName : [columnName];
        return await getColumnStatistics(db, tableName, columnNames, maxSampleSize);
    } finally {
        if (db) {
            closeConnection(db);
        }
    }
}

/**
 * Search tables
 * @param {string} dbPath - Path to the database file
 * @param {string|undefined} password - Database password (optional)
 * @param {string} pattern - Search pattern
 * @returns {Promise<Array>} Matching tables
 */
export async function searchTablesInDatabase(dbPath, password, pattern) {
    let db = null;
    
    try {
        db = await connectDatabase(dbPath, password);
        return await searchTables(db, pattern);
    } finally {
        if (db) {
            closeConnection(db);
        }
    }
}

/**
 * Search columns
 * @param {string} dbPath - Path to the database file
 * @param {string|undefined} password - Database password (optional)
 * @param {string} pattern - Search pattern
 * @returns {Promise<Array>} Matching columns
 */
export async function searchColumnsInDatabase(dbPath, password, pattern) {
    let db = null;
    
    try {
        db = await connectDatabase(dbPath, password);
        return await searchColumns(db, pattern);
    } finally {
        if (db) {
            closeConnection(db);
        }
    }
}

/**
 * Find related tables
 * @param {string} dbPath - Path to the database file
 * @param {string|undefined} password - Database password (optional)
 * @param {string} tableName - Table name
 * @returns {Promise<Object>} Related tables information
 */
export async function findRelatedTablesInDatabase(dbPath, password, tableName) {
    let db = null;
    
    try {
        db = await connectDatabase(dbPath, password);
        return await findRelatedTables(db, tableName);
    } finally {
        if (db) {
            closeConnection(db);
        }
    }
}
