# SQLCipher MCP Server

An MCP (Model Context Protocol) server that provides comprehensive read-only access to both encrypted (SQLCipher) and unencrypted SQLite databases. This server offers extensive tools for database exploration, schema analysis, query optimization, and data profiling.

## Overview

This MCP server enables you to:
- Connect to both SQLCipher-encrypted and plain SQLite databases
- Execute SELECT queries (read-only mode)
- Explore database schemas and relationships
- Analyze table statistics and data quality
- Generate and optimize SQL queries
- Search for tables and columns across the database
- Use interactive prompts for common workflows

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- Access to a SQLCipher-encrypted SQLite database file
- Database password (will be provided via environment variable)

## Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

## Configuration

### Environment Variable

Set the `SQLCIPHER_PASSWORD` environment variable with your database password:

**Windows (PowerShell):**
```powershell
$env:SQLCIPHER_PASSWORD = "your_database_password"
```

**Windows (Command Prompt):**
```cmd
set SQLCIPHER_PASSWORD=your_database_password
```

**Linux/macOS:**
```bash
export SQLCIPHER_PASSWORD="your_database_password"
```

**Permanent setup (recommended):**
- Add the environment variable to your system settings
- Or use a `.env` file with a tool like `dotenv` (requires additional setup)

## Usage

### Starting the Server

The MCP server communicates via stdio (standard input/output). Start it with:

```bash
npm start
```

Or directly:

```bash
node index.js
```

### MCP Client Configuration

Configure your MCP client to use this server. Example configuration:

```json
{
  "mcpServers": {
    "sqlcipher": {
      "command": "node",
      "args": ["C:\\Repos\\MyMCP\\index.js"],
      "env": {
        "SQLCIPHER_PASSWORD": "your_database_password"
      }
    }
  }
}
```

### Available Tools

The server provides 18 comprehensive tools organized into 5 categories:

#### Schema Exploration Tools

##### `list_tables`
List all tables in the database with row counts and types.

**Parameters:**
- `database_path` (string, optional): Path to database file
- `table_names` (array, optional): Filter by specific table names

**Example:**
```json
{
  "tool": "list_tables",
  "arguments": {
    "database_path": "C:\\path\\to\\database.db"
  }
}
```

##### `get_table_schema`
Get detailed schema for one or more tables including columns, types, constraints, foreign keys, and indexes.

**Parameters:**
- `database_path` (string, optional): Path to database file
- `table_name` (string or array, required): Table name(s)

**Example:**
```json
{
  "tool": "get_table_schema",
  "arguments": {
    "table_name": "users"
  }
}
```

##### `list_columns`
List all columns in a table with their types and constraints.

**Parameters:**
- `database_path` (string, optional): Path to database file
- `table_name` (string, required): Table name

##### `get_foreign_keys`
Get foreign key relationships for a table or entire database.

**Parameters:**
- `database_path` (string, optional): Path to database file
- `table_name` (string, optional): Table name (omit for all relationships)

##### `get_indexes`
Get index information for a table or entire database.

**Parameters:**
- `database_path` (string, optional): Path to database file
- `table_name` (string, optional): Table name (omit for all indexes)

#### Database Metadata Tools

##### `get_database_info`
Get database metadata including SQLite version, size, page size, and encoding.

**Parameters:**
- `database_path` (string, optional): Path to database file

##### `get_table_info`
Get detailed information about a specific table including row count and column count.

**Parameters:**
- `database_path` (string, optional): Path to database file
- `table_name` (string, required): Table name

##### `test_connection`
Test database connection without executing queries.

**Parameters:**
- `database_path` (string, optional): Path to database file

#### Query Helper Tools

##### `execute_query`
Execute a SELECT query on the database.

**Parameters:**
- `database_path` (string, optional): Path to database file
- `query` (string, required): SQL SELECT query

**Example:**
```json
{
  "tool": "execute_query",
  "arguments": {
    "query": "SELECT * FROM users LIMIT 10"
  }
}
```

##### `explain_query`
Get query execution plan for optimization analysis.

**Parameters:**
- `database_path` (string, optional): Path to database file
- `query` (string, required): SQL query to explain

##### `validate_query_syntax`
Validate SQL query syntax without executing it.

**Parameters:**
- `database_path` (string, optional): Path to database file
- `query` (string, required): SQL query to validate

##### `suggest_query`
Generate SQL query templates based on table schema and intent.

**Parameters:**
- `database_path` (string, optional): Path to database file
- `table_name` (string, optional): Table name
- `intent` (string, optional): Query intent ("count", "sample", "join", "aggregate", "search")

#### Data Analysis Tools

##### `get_table_statistics`
Get comprehensive statistics for a table including min, max, avg, and distinct counts.

**Parameters:**
- `database_path` (string, optional): Path to database file
- `table_name` (string, required): Table name
- `max_sample_size` (number, optional): Maximum rows to sample (default: 10000)
- `timeout_ms` (number, optional): Timeout in milliseconds (default: 30000)

##### `sample_table_data`
Get a sample of rows from a table for quick preview.

**Parameters:**
- `database_path` (string, optional): Path to database file
- `table_name` (string, required): Table name
- `limit` (number, optional): Number of rows (default: 10)
- `offset` (number, optional): Row offset (default: 0)
- `columns` (array, optional): Specific columns to include

##### `get_column_statistics`
Get detailed statistics for specific columns.

**Parameters:**
- `database_path` (string, optional): Path to database file
- `table_name` (string, required): Table name
- `column_name` (string or array, required): Column name(s)
- `max_sample_size` (number, optional): Maximum sample size (default: 10000)

#### Search and Discovery Tools

##### `search_tables`
Search for tables by name pattern using SQL LIKE syntax.

**Parameters:**
- `database_path` (string, optional): Path to database file
- `pattern` (string, required): SQL LIKE pattern (e.g., "user%")

##### `search_columns`
Search for columns across all tables by name pattern.

**Parameters:**
- `database_path` (string, optional): Path to database file
- `pattern` (string, required): SQL LIKE pattern (e.g., "%_id")

##### `find_related_tables`
Find tables related via foreign keys (incoming and outgoing).

**Parameters:**
- `database_path` (string, optional): Path to database file
- `table_name` (string, required): Table name

### Available Prompts

The server provides 7 interactive prompts for common workflows:

#### `explore_database_schema`
Comprehensive database schema exploration showing all tables and their structures.

**Arguments:**
- `database_path` (optional): Path to database file

#### `describe_table_structure`
Detailed table description including schema, relationships, and sample data.

**Arguments:**
- `database_path` (optional): Path to database file
- `table_name` (required): Table name

#### `find_data_relationships`
Discover and visualize foreign key relationships between tables.

**Arguments:**
- `database_path` (optional): Path to database file
- `table_name` (optional): Focus on specific table

#### `generate_query_template`
Generate SQL query templates based on table schema and intent.

**Arguments:**
- `database_path` (optional): Path to database file
- `table_name` (required): Table name
- `intent` (optional): Query intent

#### `optimize_query`
Analyze query execution plan and provide optimization suggestions.

**Arguments:**
- `database_path` (optional): Path to database file
- `query` (required): SQL query to optimize

#### `analyze_table_data`
Comprehensive data analysis including statistics and quality checks.

**Arguments:**
- `database_path` (optional): Path to database file
- `table_name` (required): Table name

#### `compare_tables`
Compare structure and statistics of two tables.

**Arguments:**
- `database_path` (optional): Path to database file
- `table1_name` (required): First table name
- `table2_name` (required): Second table name

## Features

### Database Support
- **Encrypted Databases**: Full support for SQLCipher-encrypted databases (SQLCipher 3)
- **Unencrypted Databases**: Also supports plain SQLite databases
- **Automatic Detection**: Gracefully handles both encrypted and unencrypted databases

### Output Formats
- **Dual Format**: All tools return both structured JSON and human-readable formatted text
- **Programmatic Access**: JSON format for integration with other tools
- **Human-Friendly**: Formatted text for easy reading and display

### Performance
- **Configurable Limits**: Set maximum sample sizes and timeouts for large tables
- **Efficient Queries**: Optimized database operations for fast response times
- **Batch Operations**: Support for batch operations on multiple tables/columns

## Security Features

- **Read-Only Mode**: Only SELECT queries and read-only PRAGMA statements are allowed
- **Password Protection**: Database password is read from environment variable and never exposed
- **Query Validation**: All queries are validated to prevent SQL injection
- **Strict Error Handling**: Clear error messages without exposing sensitive information
- **Input Sanitization**: Table and column names are validated to prevent injection attacks

## Error Handling

The server handles various error scenarios:

- **Database file not found**: Returns clear error message
- **Invalid password**: Returns generic error (doesn't expose password details)
- **SQL syntax errors**: Returns specific syntax error messages
- **Table/column not found**: Returns specific error messages
- **Non-SELECT queries**: Returns error explaining read-only restriction

## Database Location

The database file path should be provided each time you execute a query. Common locations for Windows applications:

- `C:\Users\<Username>\AppData\Local\<AppName>\database.db`
- `C:\Users\<Username>\AppData\Roaming\<AppName>\database.db`
- `C:\ProgramData\<AppName>\database.db`

## Limitations

- **Read-Only**: Only SELECT queries and read-only PRAGMA statements are supported
- **Single Connection**: Each tool call opens and closes a new database connection
- **Display Limits**: Results are limited to 1000 rows for display (full results available in JSON)
- **SQLCipher 3**: Encrypted databases must use SQLCipher 3 default encryption settings
- **No Caching**: All queries fetch fresh data from the database (no caching)

## Troubleshooting

### "Database password not found" Error
- Ensure `SQLCIPHER_PASSWORD` environment variable is set
- Restart your MCP client after setting the environment variable
- Check that the environment variable is available to the Node.js process

### "Database file not found" Error
- Verify the database path is correct
- Use absolute paths instead of relative paths
- Check file permissions

### "Invalid password" Error
- Verify the password matches the one used to encrypt the database
- Ensure SQLCipher 3 defaults are used (as this server expects)
- Check for extra spaces or special characters in the password

### Connection Issues
- Ensure the database file is not locked by another application
- Verify the database file is a valid SQLCipher database
- Check that SQLCipher 3 encryption was used (not SQLCipher 4)

## Development

### Project Structure

```
SQLLiteMCP/
├── index.js                      # Main MCP server entry point
├── server-http.js                # HTTP test server entry point
├── lib/
│   └── database.js               # Low-level database operations
├── src/
│   ├── config/
│   │   ├── constants.js          # Tool and prompt definitions
│   │   └── environment.js        # Environment variable management
│   ├── handlers/
│   │   ├── mcp-handlers.js       # MCP tool handlers
│   │   ├── prompt-handlers.js    # MCP prompt handlers
│   │   └── http-handlers.js      # HTTP API handlers
│   ├── services/
│   │   └── database-service.js   # Business logic layer
│   ├── utils/
│   │   ├── validators.js         # Input validation
│   │   ├── formatters.js         # Output formatting
│   │   ├── detectors.js          # Database type detection
│   │   └── errors.js             # Error handling
│   └── server/
│       ├── mcp-server.js         # MCP server setup
│       └── http-server.js        # HTTP server setup
├── package.json                  # Project dependencies
└── README.md                     # This file
```

### Dependencies

- `@modelcontextprotocol/sdk`: MCP SDK for Node.js
- `@journeyapps/sqlcipher`: SQLCipher bindings for Node.js

## License

MIT
