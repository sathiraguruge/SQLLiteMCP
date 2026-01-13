/**
 * MCP Prompt Handlers
 * Handlers for MCP prompt requests
 */

import { PROMPT_DEFINITIONS } from '../definitions/prompts.js';
import { getDatabasePassword } from '../config/environment.js';
import { resolveDatabasePath } from '../utils/validators.js';
import {
    getTableListFromDatabase,
    getTableSchemaFromDatabase,
    getForeignKeysFromDatabase,
    getTableInfoFromDatabase,
    sampleTableDataFromDatabase,
    explainQueryPlanFromDatabase,
    getTableStatisticsFromDatabase
} from '../services/database-service.js';

/**
 * Handle list prompts request
 * @returns {Object} List of available prompts
 */
export function handleListPrompts() {
    return {
        prompts: Object.values(PROMPT_DEFINITIONS),
    };
}

/**
 * Handle explore_database_schema prompt
 * @param {Object} args - Prompt arguments
 * @returns {Promise<Object>} Prompt response
 */
export async function handleExploreDatabaseSchemaPrompt(args) {
    const { database_path } = args || {};
    const dbPath = resolveDatabasePath(database_path);
    const password = getDatabasePassword();
    
    const tables = await getTableListFromDatabase(dbPath, password);
    
    let messages = [
        {
            role: 'user',
            content: {
                type: 'text',
                text: `I want to explore the database schema at: ${dbPath}`
            }
        },
        {
            role: 'assistant',
            content: {
                type: 'text',
                text: `I'll help you explore the database schema. I found ${tables.length} table(s) in the database.\n\n` +
                      `Tables:\n${tables.map(t => `- ${t.name} (${t.type}) - ${t.row_count} rows`).join('\n')}\n\n` +
                      `Would you like me to:\n` +
                      `1. Show detailed schema for a specific table?\n` +
                      `2. Show foreign key relationships?\n` +
                      `3. Analyze data in a specific table?`
            }
        }
    ];
    
    return { messages };
}

/**
 * Handle describe_table_structure prompt
 * @param {Object} args - Prompt arguments
 * @returns {Promise<Object>} Prompt response
 */
export async function handleDescribeTableStructurePrompt(args) {
    const { database_path, table_name } = args || {};
    
    if (!table_name) {
        return {
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: 'I want to understand the structure of a table'
                    }
                },
                {
                    role: 'assistant',
                    content: {
                        type: 'text',
                        text: 'Please provide the table name you want to explore.'
                    }
                }
            ]
        };
    }
    
    const dbPath = resolveDatabasePath(database_path);
    const password = getDatabasePassword();
    
    const schema = await getTableSchemaFromDatabase(dbPath, password, table_name);
    const info = await getTableInfoFromDatabase(dbPath, password, table_name);
    const sample = await sampleTableDataFromDatabase(dbPath, password, table_name, 5, 0);
    
    let description = `Table: ${table_name}\n\n`;
    description += `Type: ${info.type}\n`;
    description += `Rows: ${info.row_count}\n`;
    description += `Columns: ${info.column_count}\n\n`;
    
    description += `Column Details:\n`;
    schema.columns.forEach(col => {
        description += `- ${col.name} (${col.type || 'UNKNOWN'})`;
        if (col.pk) description += ' [PRIMARY KEY]';
        if (col.notnull) description += ' [NOT NULL]';
        description += '\n';
    });
    
    if (schema.foreign_keys && schema.foreign_keys.length > 0) {
        description += `\nForeign Keys:\n`;
        schema.foreign_keys.forEach(fk => {
            description += `- ${fk.from} -> ${fk.table}.${fk.to}\n`;
        });
    }
    
    if (schema.indexes && schema.indexes.length > 0) {
        description += `\nIndexes:\n`;
        schema.indexes.forEach(idx => {
            description += `- ${idx.name}`;
            if (idx.unique) description += ' (UNIQUE)';
            description += '\n';
        });
    }
    
    description += `\nSample Data (first 5 rows):\n`;
    if (sample.rows.length > 0) {
        description += `Columns: ${sample.columns.join(', ')}\n`;
        sample.rows.forEach((row, i) => {
            description += `Row ${i + 1}: ${sample.columns.map(c => row[c]).join(', ')}\n`;
        });
    }
    
    return {
        messages: [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: `Describe the structure of table "${table_name}"`
                }
            },
            {
                role: 'assistant',
                content: {
                    type: 'text',
                    text: description
                }
            }
        ]
    };
}

/**
 * Handle find_data_relationships prompt
 * @param {Object} args - Prompt arguments
 * @returns {Promise<Object>} Prompt response
 */
export async function handleFindDataRelationshipsPrompt(args) {
    const { database_path, table_name } = args || {};
    const dbPath = resolveDatabasePath(database_path);
    const password = getDatabasePassword();
    
    const foreignKeys = await getForeignKeysFromDatabase(dbPath, password, table_name);
    
    let description = table_name 
        ? `Foreign key relationships for table "${table_name}":\n\n`
        : `All foreign key relationships in the database:\n\n`;
    
    if (foreignKeys.length === 0) {
        description += 'No foreign key relationships found.';
    } else {
        // Group by table
        const byTable = {};
        foreignKeys.forEach(fk => {
            if (!byTable[fk.table]) {
                byTable[fk.table] = [];
            }
            byTable[fk.table].push(fk);
        });
        
        Object.keys(byTable).forEach(tbl => {
            description += `Table: ${tbl}\n`;
            byTable[tbl].forEach(fk => {
                description += `  - ${fk.from} -> ${fk.table}.${fk.to}\n`;
            });
            description += '\n';
        });
    }
    
    return {
        messages: [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: table_name 
                        ? `Show me the data relationships for table "${table_name}"`
                        : 'Show me all data relationships in the database'
                }
            },
            {
                role: 'assistant',
                content: {
                    type: 'text',
                    text: description
                }
            }
        ]
    };
}

/**
 * Handle generate_query_template prompt
 * @param {Object} args - Prompt arguments
 * @returns {Promise<Object>} Prompt response
 */
export async function handleGenerateQueryTemplatePrompt(args) {
    const { database_path, table_name, intent } = args || {};
    
    if (!table_name) {
        return {
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: 'I need help writing a SQL query'
                    }
                },
                {
                    role: 'assistant',
                    content: {
                        type: 'text',
                        text: 'Please provide the table name and what you want to do (count, sample, join, aggregate, or search).'
                    }
                }
            ]
        };
    }
    
    const dbPath = resolveDatabasePath(database_path);
    const password = getDatabasePassword();
    
    const schema = await getTableSchemaFromDatabase(dbPath, password, table_name);
    const columns = schema.columns.map(c => c.name).join(', ');
    
    let templates = [];
    const intentType = intent || 'sample';
    
    switch (intentType) {
        case 'count':
            templates.push({
                description: 'Count all rows',
                query: `SELECT COUNT(*) as total FROM "${table_name}"`
            });
            templates.push({
                description: 'Count by group',
                query: `SELECT column_name, COUNT(*) as count FROM "${table_name}" GROUP BY column_name`
            });
            break;
        case 'sample':
            templates.push({
                description: 'Get first 10 rows',
                query: `SELECT ${columns} FROM "${table_name}" LIMIT 10`
            });
            templates.push({
                description: 'Get rows with condition',
                query: `SELECT ${columns} FROM "${table_name}" WHERE condition LIMIT 10`
            });
            break;
        case 'aggregate':
            const numericCols = schema.columns.filter(c => 
                c.type && (c.type.toUpperCase().includes('INT') || 
                          c.type.toUpperCase().includes('REAL') ||
                          c.type.toUpperCase().includes('NUMERIC'))
            );
            if (numericCols.length > 0) {
                const col = numericCols[0].name;
                templates.push({
                    description: 'Calculate statistics',
                    query: `SELECT MIN("${col}"), MAX("${col}"), AVG("${col}"), SUM("${col}") FROM "${table_name}"`
                });
            }
            break;
        case 'join':
            if (schema.foreign_keys && schema.foreign_keys.length > 0) {
                const fk = schema.foreign_keys[0];
                templates.push({
                    description: 'Join with related table',
                    query: `SELECT t1.*, t2.* FROM "${table_name}" t1 JOIN "${fk.table}" t2 ON t1."${fk.from}" = t2."${fk.to}"`
                });
            }
            break;
        case 'search':
            const textCols = schema.columns.filter(c => 
                !c.type || c.type.toUpperCase().includes('TEXT') || 
                c.type.toUpperCase().includes('VARCHAR')
            );
            if (textCols.length > 0) {
                const col = textCols[0].name;
                templates.push({
                    description: 'Search by text',
                    query: `SELECT ${columns} FROM "${table_name}" WHERE "${col}" LIKE '%search_term%'`
                });
            }
            break;
    }
    
    let response = `Query templates for table "${table_name}" (intent: ${intentType}):\n\n`;
    templates.forEach((t, i) => {
        response += `${i + 1}. ${t.description}:\n${t.query}\n\n`;
    });
    
    return {
        messages: [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: `Generate query templates for table "${table_name}" with intent "${intentType}"`
                }
            },
            {
                role: 'assistant',
                content: {
                    type: 'text',
                    text: response
                }
            }
        ]
    };
}

/**
 * Handle optimize_query prompt
 * @param {Object} args - Prompt arguments
 * @returns {Promise<Object>} Prompt response
 */
export async function handleOptimizeQueryPrompt(args) {
    const { database_path, query } = args || {};
    
    if (!query) {
        return {
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: 'I want to optimize a SQL query'
                    }
                },
                {
                    role: 'assistant',
                    content: {
                        type: 'text',
                        text: 'Please provide the SQL query you want to optimize.'
                    }
                }
            ]
        };
    }
    
    const dbPath = resolveDatabasePath(database_path);
    const password = getDatabasePassword();
    
    const plan = await explainQueryPlanFromDatabase(dbPath, password, query);
    
    let response = `Query Execution Plan:\n\n`;
    plan.forEach(step => {
        response += `${step.detail || step.notused || 'N/A'}\n`;
    });
    
    response += `\n\nOptimization Suggestions:\n`;
    
    // Analyze plan for common issues
    const planText = JSON.stringify(plan).toLowerCase();
    if (planText.includes('scan')) {
        response += `- Consider adding indexes to avoid table scans\n`;
    }
    if (planText.includes('temp')) {
        response += `- Query uses temporary tables, consider simplifying\n`;
    }
    if (!planText.includes('index')) {
        response += `- No indexes detected in execution plan\n`;
    }
    
    response += `- Ensure WHERE clauses use indexed columns\n`;
    response += `- Limit result sets when possible\n`;
    response += `- Avoid SELECT * in production queries\n`;
    
    return {
        messages: [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: `Optimize this query: ${query}`
                }
            },
            {
                role: 'assistant',
                content: {
                    type: 'text',
                    text: response
                }
            }
        ]
    };
}

/**
 * Handle analyze_table_data prompt
 * @param {Object} args - Prompt arguments
 * @returns {Promise<Object>} Prompt response
 */
export async function handleAnalyzeTableDataPrompt(args) {
    const { database_path, table_name } = args || {};
    
    if (!table_name) {
        return {
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: 'I want to analyze table data'
                    }
                },
                {
                    role: 'assistant',
                    content: {
                        type: 'text',
                        text: 'Please provide the table name you want to analyze.'
                    }
                }
            ]
        };
    }
    
    const dbPath = resolveDatabasePath(database_path);
    const password = getDatabasePassword();
    
    const stats = await getTableStatisticsFromDatabase(dbPath, password, table_name);
    const sample = await sampleTableDataFromDatabase(dbPath, password, table_name, 5, 0);
    
    let response = `Data Analysis for table "${table_name}":\n\n`;
    response += `Total Rows: ${stats.total_rows}\n`;
    response += `Total Columns: ${stats.column_count}\n\n`;
    
    response += `Column Statistics:\n`;
    stats.columns.forEach(col => {
        response += `\n${col.name} (${col.type}):\n`;
        response += `  - Distinct values: ${col.distinct_count}\n`;
        response += `  - Null values: ${col.null_count}\n`;
        if (col.min_value !== undefined) {
            response += `  - Min: ${col.min_value}\n`;
            response += `  - Max: ${col.max_value}\n`;
            response += `  - Avg: ${col.avg_value}\n`;
        }
    });
    
    response += `\n\nSample Data (first 5 rows):\n`;
    if (sample.rows.length > 0) {
        sample.rows.forEach((row, i) => {
            response += `Row ${i + 1}: ${sample.columns.map(c => `${c}=${row[c]}`).join(', ')}\n`;
        });
    }
    
    // Data quality checks
    response += `\n\nData Quality Observations:\n`;
    stats.columns.forEach(col => {
        const nullPercentage = (col.null_count / stats.total_rows) * 100;
        if (nullPercentage > 50) {
            response += `- Column "${col.name}" has ${nullPercentage.toFixed(1)}% null values\n`;
        }
        if (col.distinct_count === stats.total_rows && stats.total_rows > 0) {
            response += `- Column "${col.name}" appears to be unique (potential key)\n`;
        }
    });
    
    return {
        messages: [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: `Analyze the data in table "${table_name}"`
                }
            },
            {
                role: 'assistant',
                content: {
                    type: 'text',
                    text: response
                }
            }
        ]
    };
}

/**
 * Handle compare_tables prompt
 * @param {Object} args - Prompt arguments
 * @returns {Promise<Object>} Prompt response
 */
export async function handleCompareTablesPrompt(args) {
    const { database_path, table1_name, table2_name } = args || {};
    
    if (!table1_name || !table2_name) {
        return {
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: 'I want to compare two tables'
                    }
                },
                {
                    role: 'assistant',
                    content: {
                        type: 'text',
                        text: 'Please provide both table names you want to compare.'
                    }
                }
            ]
        };
    }
    
    const dbPath = resolveDatabasePath(database_path);
    const password = getDatabasePassword();
    
    const schema1 = await getTableSchemaFromDatabase(dbPath, password, table1_name);
    const schema2 = await getTableSchemaFromDatabase(dbPath, password, table2_name);
    const info1 = await getTableInfoFromDatabase(dbPath, password, table1_name);
    const info2 = await getTableInfoFromDatabase(dbPath, password, table2_name);
    
    let response = `Comparison of "${table1_name}" and "${table2_name}":\n\n`;
    
    response += `Row Counts:\n`;
    response += `  ${table1_name}: ${info1.row_count} rows\n`;
    response += `  ${table2_name}: ${info2.row_count} rows\n\n`;
    
    response += `Column Counts:\n`;
    response += `  ${table1_name}: ${info1.column_count} columns\n`;
    response += `  ${table2_name}: ${info2.column_count} columns\n\n`;
    
    // Compare columns
    const cols1 = schema1.columns.map(c => c.name);
    const cols2 = schema2.columns.map(c => c.name);
    
    const commonCols = cols1.filter(c => cols2.includes(c));
    const uniqueToCols1 = cols1.filter(c => !cols2.includes(c));
    const uniqueToCols2 = cols2.filter(c => !cols1.includes(c));
    
    response += `Common Columns (${commonCols.length}):\n`;
    commonCols.forEach(c => {
        const col1 = schema1.columns.find(col => col.name === c);
        const col2 = schema2.columns.find(col => col.name === c);
        response += `  - ${c}: ${col1.type} vs ${col2.type}`;
        if (col1.type !== col2.type) {
            response += ` [TYPE MISMATCH]`;
        }
        response += `\n`;
    });
    
    if (uniqueToCols1.length > 0) {
        response += `\nColumns only in "${table1_name}" (${uniqueToCols1.length}):\n`;
        uniqueToCols1.forEach(c => response += `  - ${c}\n`);
    }
    
    if (uniqueToCols2.length > 0) {
        response += `\nColumns only in "${table2_name}" (${uniqueToCols2.length}):\n`;
        uniqueToCols2.forEach(c => response += `  - ${c}\n`);
    }
    
    return {
        messages: [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: `Compare tables "${table1_name}" and "${table2_name}"`
                }
            },
            {
                role: 'assistant',
                content: {
                    type: 'text',
                    text: response
                }
            }
        ]
    };
}
