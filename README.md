# SQLCipher MCP Server

An MCP (Model Context Protocol) server that provides read-only access to SQLCipher-encrypted SQLite databases. This server allows you to query encrypted SQLite databases using SQLCipher 3 default encryption settings.

## Overview

This MCP server enables you to:
- Connect to SQLCipher-encrypted SQLite databases
- Execute SELECT queries (read-only mode)
- Retrieve query results in a structured format
- Use SQLCipher 3 default encryption settings

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

#### `execute_query`

Execute a SELECT query on a SQLCipher-encrypted database.

**Parameters:**
- `database_path` (string, required): Full path to the SQLCipher database file
- `query` (string, required): SQL SELECT query to execute

**Returns:**
- Formatted text output with query results
- JSON representation of results including:
  - `columns`: Array of column names
  - `rows`: Array of row objects
  - `rowCount`: Number of rows returned

**Example Usage:**

```javascript
// Example 1: Simple SELECT query
{
  "tool": "execute_query",
  "arguments": {
    "database_path": "C:\\Users\\Username\\AppData\\Local\\AppName\\database.db",
    "query": "SELECT * FROM users LIMIT 10"
  }
}

// Example 2: SELECT with WHERE clause
{
  "tool": "execute_query",
  "arguments": {
    "database_path": "C:\\Users\\Username\\AppData\\Local\\AppName\\database.db",
    "query": "SELECT id, name, email FROM users WHERE active = 1"
  }
}

// Example 3: SELECT with JOIN
{
  "tool": "execute_query",
  "arguments": {
    "database_path": "C:\\Users\\Username\\AppData\\Local\\AppName\\database.db",
    "query": "SELECT u.name, o.order_id FROM users u JOIN orders o ON u.id = o.user_id"
  }
}
```

## Security Features

- **Read-Only Mode**: Only SELECT queries are allowed. INSERT, UPDATE, DELETE, and other modifying operations are blocked.
- **Password Protection**: Database password is read from environment variable and never exposed in logs or error messages.
- **Query Validation**: All queries are validated to ensure they are SELECT queries only.
- **Error Handling**: Sensitive information is not exposed in error messages.

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

- **Read-Only**: Only SELECT queries are supported
- **Single Connection**: Each query opens and closes a new database connection
- **Result Size**: Results are limited to 1000 rows for display (full results available in JSON)
- **SQLCipher 3 Only**: Uses SQLCipher 3 default encryption settings

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
MyMCP/
├── index.js              # Main MCP server entry point
├── lib/
│   └── database.js       # Database connection and query logic
├── package.json          # Project dependencies
└── README.md             # This file
```

### Dependencies

- `@modelcontextprotocol/sdk`: MCP SDK for Node.js
- `@journeyapps/sqlcipher`: SQLCipher bindings for Node.js

## License

MIT
