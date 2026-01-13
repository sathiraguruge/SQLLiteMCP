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
