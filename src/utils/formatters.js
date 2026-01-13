/**
 * Formatting Utilities
 * Functions for formatting query results and other data
 */

import { QUERY_CONFIG } from '../config/constants.js';

/**
 * Format query results as a readable string
 * @param {Object} result - Query result object with columns, rows, and rowCount
 * @param {string[]} result.columns - Array of column names
 * @param {Object[]} result.rows - Array of row objects
 * @param {number} result.rowCount - Number of rows returned
 * @returns {string} Formatted result string
 */
export function formatQueryResults(result) {
    const { columns, rows, rowCount } = result;

    if (rowCount === 0) {
        return `Query executed successfully. No rows returned.\nColumns: ${columns.join(', ')}`;
    }

    // Build table-like output
    let output = `Query executed successfully. ${rowCount} row(s) returned.\n\n`;

    // Add column headers
    output += `Columns: ${columns.join(' | ')}\n`;
    output += '-'.repeat(columns.join(' | ').length) + '\n';

    // Add rows (limit to first maxDisplayRows for display)
    const displayRows = rows.slice(0, QUERY_CONFIG.maxDisplayRows);
    for (const row of displayRows) {
        const values = columns.map(col => formatCellValue(row[col]));
        output += values.join(' | ') + '\n';
    }

    if (rows.length > QUERY_CONFIG.maxDisplayRows) {
        output += `\n... (showing first ${QUERY_CONFIG.maxDisplayRows} of ${rowCount} rows)`;
    }

    // Add JSON representation for programmatic access
    output += '\n\nJSON representation:\n';
    output += JSON.stringify(result, null, 2);

    return output;
}

/**
 * Format a single cell value for display
 * @param {any} value - Cell value to format
 * @returns {string} Formatted cell value
 */
function formatCellValue(value) {
    // Handle null/undefined
    if (value === null || value === undefined) {
        return 'NULL';
    }
    
    // Convert to string and truncate long values
    const str = String(value);
    return str.length > QUERY_CONFIG.maxValueLength 
        ? str.substring(0, QUERY_CONFIG.maxValueLength - 3) + '...' 
        : str;
}

/**
 * Format table list results
 * @param {Array} tables - Array of table objects
 * @returns {string} Formatted table list
 */
export function formatTableList(tables) {
    if (!tables || tables.length === 0) {
        return 'No tables found in database.';
    }
    
    let output = `Found ${tables.length} table(s):\n\n`;
    
    for (const table of tables) {
        output += `- ${table.name} (${table.type})`;
        if (table.row_count !== undefined) {
            output += ` - ${table.row_count} row(s)`;
        }
        output += '\n';
    }
    
    output += '\n\nJSON representation:\n';
    output += JSON.stringify(tables, null, 2);
    
    return output;
}

/**
 * Format table schema results
 * @param {Object|Array} schema - Table schema or array of schemas
 * @returns {string} Formatted schema
 */
export function formatTableSchema(schema) {
    if (Array.isArray(schema)) {
        // Batch result
        let output = `Schema for ${schema.length} table(s):\n\n`;
        
        for (const s of schema) {
            if (s.error) {
                output += `Table: ${s.tableName} - ERROR: ${s.error}\n\n`;
            } else {
                output += formatSingleTableSchema(s) + '\n\n';
            }
        }
        
        output += 'JSON representation:\n';
        output += JSON.stringify(schema, null, 2);
        
        return output;
    } else {
        // Single table
        let output = formatSingleTableSchema(schema);
        output += '\n\nJSON representation:\n';
        output += JSON.stringify(schema, null, 2);
        return output;
    }
}

/**
 * Format a single table schema
 * @param {Object} schema - Table schema object
 * @returns {string} Formatted schema
 */
function formatSingleTableSchema(schema) {
    let output = `Table: ${schema.tableName}\n`;
    output += '='.repeat(40) + '\n\n';
    
    // Columns
    output += 'Columns:\n';
    for (const col of schema.columns) {
        output += `  - ${col.name} (${col.type || 'UNKNOWN'})`;
        if (col.pk) output += ' PRIMARY KEY';
        if (col.notnull) output += ' NOT NULL';
        if (col.dflt_value !== null) output += ` DEFAULT ${col.dflt_value}`;
        output += '\n';
    }
    
    // Foreign keys
    if (schema.foreign_keys && schema.foreign_keys.length > 0) {
        output += '\nForeign Keys:\n';
        for (const fk of schema.foreign_keys) {
            output += `  - ${fk.from} -> ${fk.table}.${fk.to}\n`;
        }
    }
    
    // Indexes
    if (schema.indexes && schema.indexes.length > 0) {
        output += '\nIndexes:\n';
        for (const idx of schema.indexes) {
            output += `  - ${idx.name}`;
            if (idx.unique) output += ' (UNIQUE)';
            if (idx.columns && idx.columns.length > 0) {
                const colNames = idx.columns.map(c => c.name).join(', ');
                output += ` on (${colNames})`;
            }
            output += '\n';
        }
    }
    
    return output;
}

/**
 * Format foreign keys results
 * @param {Array} foreignKeys - Array of foreign key relationships
 * @returns {string} Formatted foreign keys
 */
export function formatForeignKeys(foreignKeys) {
    if (!foreignKeys || foreignKeys.length === 0) {
        return 'No foreign keys found.';
    }
    
    let output = `Found ${foreignKeys.length} foreign key relationship(s):\n\n`;
    
    for (const fk of foreignKeys) {
        output += `- ${fk.table}.${fk.from} -> ${fk.table}.${fk.to}`;
        if (fk.on_update) output += ` ON UPDATE ${fk.on_update}`;
        if (fk.on_delete) output += ` ON DELETE ${fk.on_delete}`;
        output += '\n';
    }
    
    output += '\n\nJSON representation:\n';
    output += JSON.stringify(foreignKeys, null, 2);
    
    return output;
}

/**
 * Format indexes results
 * @param {Array} indexes - Array of index information
 * @returns {string} Formatted indexes
 */
export function formatIndexes(indexes) {
    if (!indexes || indexes.length === 0) {
        return 'No indexes found.';
    }
    
    let output = `Found ${indexes.length} index(es):\n\n`;
    
    for (const idx of indexes) {
        output += `- ${idx.name} on table ${idx.table}`;
        if (idx.unique) output += ' (UNIQUE)';
        if (idx.columns && idx.columns.length > 0) {
            const colNames = idx.columns.map(c => c.name).join(', ');
            output += ` - columns: (${colNames})`;
        }
        output += '\n';
    }
    
    output += '\n\nJSON representation:\n';
    output += JSON.stringify(indexes, null, 2);
    
    return output;
}

/**
 * Format database info results
 * @param {Object} info - Database metadata
 * @returns {string} Formatted database info
 */
export function formatDatabaseInfo(info) {
    let output = 'Database Information:\n';
    output += '='.repeat(40) + '\n\n';
    
    if (info.path) output += `Path: ${info.path}\n`;
    if (info.sqlite_version) output += `SQLite Version: ${info.sqlite_version}\n`;
    if (info.size_bytes !== undefined) {
        const sizeMB = (info.size_bytes / (1024 * 1024)).toFixed(2);
        output += `Size: ${info.size_bytes} bytes (${sizeMB} MB)\n`;
    }
    if (info.page_size) output += `Page Size: ${info.page_size} bytes\n`;
    if (info.page_count) output += `Page Count: ${info.page_count}\n`;
    if (info.encoding) output += `Encoding: ${info.encoding}\n`;
    if (info.user_version !== undefined) output += `User Version: ${info.user_version}\n`;
    if (info.application_id !== undefined) output += `Application ID: ${info.application_id}\n`;
    if (info.schema_version !== undefined) output += `Schema Version: ${info.schema_version}\n`;
    if (info.freelist_count !== undefined) output += `Free Pages: ${info.freelist_count}\n`;
    
    output += '\n\nJSON representation:\n';
    output += JSON.stringify(info, null, 2);
    
    return output;
}

/**
 * Format table info results
 * @param {Object} info - Table information
 * @returns {string} Formatted table info
 */
export function formatTableInfo(info) {
    let output = `Table Information: ${info.name}\n`;
    output += '='.repeat(40) + '\n\n';
    
    output += `Type: ${info.type}\n`;
    output += `Row Count: ${info.row_count}\n`;
    output += `Column Count: ${info.column_count}\n`;
    
    if (info.sql) {
        output += `\nCreate Statement:\n${info.sql}\n`;
    }
    
    output += '\n\nJSON representation:\n';
    output += JSON.stringify(info, null, 2);
    
    return output;
}

/**
 * Format query plan results
 * @param {Array} plan - Query execution plan
 * @returns {string} Formatted query plan
 */
export function formatQueryPlan(plan) {
    if (!plan || plan.length === 0) {
        return 'No query plan available.';
    }
    
    let output = 'Query Execution Plan:\n';
    output += '='.repeat(40) + '\n\n';
    
    for (const step of plan) {
        const indent = '  '.repeat(step.id || 0);
        output += `${indent}${step.detail || step.notused || 'N/A'}\n`;
    }
    
    output += '\n\nJSON representation:\n';
    output += JSON.stringify(plan, null, 2);
    
    return output;
}

/**
 * Format table statistics results
 * @param {Object} stats - Table statistics
 * @returns {string} Formatted statistics
 */
export function formatTableStatistics(stats) {
    let output = `Table Statistics: ${stats.table_name}\n`;
    output += '='.repeat(40) + '\n\n';
    
    output += `Total Rows: ${stats.total_rows}\n`;
    output += `Column Count: ${stats.column_count}\n\n`;
    
    if (stats.columns && stats.columns.length > 0) {
        output += 'Column Statistics:\n';
        for (const col of stats.columns) {
            output += `\n  ${col.name} (${col.type}):\n`;
            output += `    Distinct Values: ${col.distinct_count}\n`;
            output += `    Null Count: ${col.null_count}\n`;
            if (col.min_value !== undefined) output += `    Min: ${col.min_value}\n`;
            if (col.max_value !== undefined) output += `    Max: ${col.max_value}\n`;
            if (col.avg_value !== undefined) output += `    Avg: ${col.avg_value}\n`;
        }
    }
    
    output += '\n\nJSON representation:\n';
    output += JSON.stringify(stats, null, 2);
    
    return output;
}

/**
 * Format sample data results
 * @param {Object} sample - Sample data
 * @returns {string} Formatted sample data
 */
export function formatSampleData(sample) {
    let output = `Sample Data from ${sample.table_name}\n`;
    output += '='.repeat(40) + '\n\n';
    
    output += `Showing ${sample.row_count} row(s) (limit: ${sample.limit}, offset: ${sample.offset})\n\n`;
    
    if (sample.rows && sample.rows.length > 0) {
        // Add column headers
        output += `Columns: ${sample.columns.join(' | ')}\n`;
        output += '-'.repeat(sample.columns.join(' | ').length) + '\n';
        
        // Add rows
        for (const row of sample.rows) {
            const values = sample.columns.map(col => formatCellValue(row[col]));
            output += values.join(' | ') + '\n';
        }
    } else {
        output += 'No rows in sample.\n';
    }
    
    output += '\n\nJSON representation:\n';
    output += JSON.stringify(sample, null, 2);
    
    return output;
}

/**
 * Format column statistics results
 * @param {Array} stats - Array of column statistics
 * @returns {string} Formatted column statistics
 */
export function formatColumnStatistics(stats) {
    if (!stats || stats.length === 0) {
        return 'No column statistics available.';
    }
    
    let output = `Column Statistics (${stats.length} column(s)):\n`;
    output += '='.repeat(40) + '\n\n';
    
    for (const col of stats) {
        output += `Column: ${col.table_name}.${col.column_name} (${col.column_type})\n`;
        output += `  Distinct Values: ${col.distinct_count}\n`;
        output += `  Null Count: ${col.null_count}\n`;
        output += `  Non-Null Count: ${col.non_null_count}\n`;
        if (col.min_value !== undefined) output += `  Min: ${col.min_value}\n`;
        if (col.max_value !== undefined) output += `  Max: ${col.max_value}\n`;
        if (col.avg_value !== undefined) output += `  Avg: ${col.avg_value}\n`;
        if (col.sample_values && col.sample_values.length > 0) {
            output += `  Sample Values: ${col.sample_values.map(v => formatCellValue(v)).join(', ')}\n`;
        }
        output += '\n';
    }
    
    output += 'JSON representation:\n';
    output += JSON.stringify(stats, null, 2);
    
    return output;
}

/**
 * Format search results
 * @param {Array} results - Search results
 * @param {string} type - Type of search ('tables' or 'columns')
 * @returns {string} Formatted search results
 */
export function formatSearchResults(results, type) {
    if (!results || results.length === 0) {
        return `No ${type} found matching the pattern.`;
    }
    
    let output = `Found ${results.length} matching ${type}:\n\n`;
    
    if (type === 'tables') {
        for (const table of results) {
            output += `- ${table.name} (${table.type})\n`;
        }
    } else if (type === 'columns') {
        for (const col of results) {
            output += `- ${col.table_name}.${col.column_name} (${col.column_type})`;
            if (col.is_primary_key) output += ' [PK]';
            if (col.is_nullable) output += ' [NULL]';
            output += '\n';
        }
    }
    
    output += '\n\nJSON representation:\n';
    output += JSON.stringify(results, null, 2);
    
    return output;
}

/**
 * Format related tables results
 * @param {Object} related - Related tables information
 * @returns {string} Formatted related tables
 */
export function formatRelatedTables(related) {
    let output = `Related Tables for: ${related.table_name}\n`;
    output += '='.repeat(40) + '\n\n';
    
    if (related.references_tables && related.references_tables.length > 0) {
        output += `References (${related.references_tables.length}):\n`;
        for (const table of related.references_tables) {
            output += `  - ${table}\n`;
        }
        output += '\n';
    } else {
        output += 'No outgoing references.\n\n';
    }
    
    if (related.referenced_by_tables && related.referenced_by_tables.length > 0) {
        output += `Referenced By (${related.referenced_by_tables.length}):\n`;
        for (const table of related.referenced_by_tables) {
            output += `  - ${table}\n`;
        }
        output += '\n';
    } else {
        output += 'No incoming references.\n\n';
    }
    
    if (related.outgoing_foreign_keys && related.outgoing_foreign_keys.length > 0) {
        output += 'Outgoing Foreign Keys:\n';
        for (const fk of related.outgoing_foreign_keys) {
            output += `  - ${fk.from} -> ${fk.table}.${fk.to}\n`;
        }
        output += '\n';
    }
    
    if (related.incoming_foreign_keys && related.incoming_foreign_keys.length > 0) {
        output += 'Incoming Foreign Keys:\n';
        for (const fk of related.incoming_foreign_keys) {
            output += `  - ${fk.table}.${fk.from} -> ${fk.to}\n`;
        }
    }
    
    output += '\n\nJSON representation:\n';
    output += JSON.stringify(related, null, 2);
    
    return output;
}