# SQLCipher MCP Server

A Model Context Protocol (MCP) server that provides comprehensive access to both SQLCipher-encrypted and unencrypted SQLite databases. Query, explore schemas, analyze data, and optimize queries through MCP tools or HTTP endpoints.

## Features

- **Dual Database Support**: Works with both SQLCipher-encrypted and plain SQLite databases
- **18 Powerful Tools**: Complete database exploration, schema analysis, query optimization, and data profiling
- **7 Interactive Prompts**: Guided workflows for common database tasks
- **HTTP API**: Full REST API with 20 endpoints for testing and integration
- **Read-Only Mode**: Safe exploration without risk of data modification

## Prerequisites

- Node.js v18.0.0 or higher
- npm package manager

## Integration Options

Choose the integration method that works best for your workflow:

### Option 1: VS Code Integration

Integrate the MCP server into VS Code to use database tools directly in your editor.

**Step 1:** Create the MCP configuration folder

In your project root directory, create a `.vscode` folder:

```bash
mkdir .vscode
```

**Step 2:** Create the MCP configuration file

Inside the `.vscode` folder, create a file named `mcp.json` with the following content:

```json
{
  "servers": {
    "sqlcipher": {
      "command": "npx",
      "args": [
        "-y",
        "sqlcipher-mcp-server@2.0.0"
      ],
      "env": {
        "SQLCIPHER_DATABASE_PATH": "C:\\path\\to\\your\\database.db"
      }
    }
  }
}
```

**Step 3:** Configure environment variables

- **SQLCIPHER_DATABASE_PATH** (required): Full path to your SQLite database file
- **SQLCIPHER_PASSWORD** (optional): Only needed if your database is encrypted with SQLCipher

**Example with encrypted database:**

```json
{
  "servers": {
    "sqlcipher": {
      "command": "npx",
      "args": [
        "-y",
        "sqlcipher-mcp-server@2.0.0"
      ],
      "env": {
        "SQLCIPHER_DATABASE_PATH": "C:\\Users\\YourName\\AppData\\Local\\MyApp\\database.db",
        "SQLCIPHER_PASSWORD": "your_database_password"
      }
    }
  }
}
```

**Step 4:** Restart VS Code

Close and reopen VS Code to load the MCP server configuration.

---

### Option 2: Cursor IDE Integration

Cursor IDE has built-in support for MCP servers, making integration straightforward.

**Step 1:** Open Cursor Settings

1. Open Cursor IDE
2. Go to **Settings** (File > Preferences > Settings or `Ctrl/Cmd + ,`)
3. Search for "MCP" or navigate to the MCP configuration section

**Step 2:** Add MCP Server Configuration

In the MCP settings, add a new server with the following configuration:

**Server Name:** `sqlcipher`

**Command:** `npx`

**Property:**
```json
[
    "sqlcipher": {
      "command": "npx",
      "args": [
        "-y",
        "sqlcipher-mcp-server@2.0.0"
      ],
      "env": {
        "SQLCIPHER_DATABASE_PATH": "C:\\Users\\YourName\\AppData\\Local\\MyApp\\database.db"
      }
    }
]
```

**Environment Variables:**

| Variable | Value | Required |
|----------|-------|----------|
| SQLCIPHER_DATABASE_PATH | Full path to your database file | Yes |
| SQLCIPHER_PASSWORD | Your database password | Only for encrypted databases |

**Example Configuration (JSON format):**

```json
{
  "servers": {
    "sqlcipher": {
      "command": "npx",
      "args": [
        "-y",
        "sqlcipher-mcp-server@2.0.0"
      ],
      "env": {
        "SQLCIPHER_DATABASE_PATH": "C:\\Users\\YourName\\AppData\\Local\\MyApp\\database.db",
        "SQLCIPHER_PASSWORD": "your_database_password"
      }
    }
  }
}
```

**Step 3:** Save and Restart

Save the configuration and restart Cursor IDE to activate the MCP server.

---

### Option 3: HTTP Server (Local Development)

Run the server as a standalone HTTP API for testing, development, or integration with other tools.

**Step 1:** Clone and Install

```bash
git clone https://github.com/sathiraguruge/SQLLiteMCP.git
cd SQLLiteMCP
npm install
```

**Step 2:** Configure Environment Variables

Set your database path and password (if encrypted):

**Windows (PowerShell):**
```powershell
$env:SQLCIPHER_DATABASE_PATH = "C:\path\to\your\database.db"
$env:SQLCIPHER_PASSWORD = "your_password"  # Optional
```

**Windows (Command Prompt):**
```cmd
set SQLCIPHER_DATABASE_PATH=C:\path\to\your\database.db
set SQLCIPHER_PASSWORD=your_password
```

**Linux/macOS:**
```bash
export SQLCIPHER_DATABASE_PATH="/path/to/your/database.db"
export SQLCIPHER_PASSWORD="your_password"  # Optional
```

**Step 3:** Start the HTTP Server

```bash
npm run start:http
```

The server will start on **port 3000** by default.

**Step 4:** Test with Postman

The project includes a comprehensive Postman collection with all 20 endpoints pre-configured.

1. Open Postman
2. Click **Import**
3. Select the `postman-collection.json` file from the project root
4. The collection will load with all endpoints organized by category:
   - Server Status (health, info)
   - Query Execution
   - Schema Exploration (6 endpoints)
   - Database & Table Info (3 endpoints)
   - Query Helpers (4 endpoints)
   - Data Analysis (3 endpoints)
   - Search & Discovery (3 endpoints)

**Available Endpoints:**

- `GET /health` - Server health check
- `GET /api/info` - List all available endpoints
- `POST /api/query` - Execute SQL queries
- `POST /api/tool/{tool_name}` - Access any of the 17 specialized tools

All endpoints return JSON responses with the format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

---

## Quick Troubleshooting

### Database File Not Found

**Error:** `Database file not found`

**Solution:**
- Verify the path in `SQLCIPHER_DATABASE_PATH` is correct
- Use absolute paths, not relative paths
- On Windows, use double backslashes (`\\`) or forward slashes (`/`)
- Check file permissions

### Connection Issues with Encrypted Databases

**Error:** `Unable to open database` or `file is not a database`

**Solution:**
- Verify `SQLCIPHER_PASSWORD` is set correctly
- Ensure the database was encrypted with SQLCipher 3 (not SQLCipher 4)
- Check for extra spaces or special characters in the password
- If the database is unencrypted, remove the `SQLCIPHER_PASSWORD` variable

### Environment Variable Issues

**Error:** `Database password not found` or variables not recognized

**Solution:**
- Restart your IDE after setting environment variables
- For VS Code/Cursor: Ensure variables are in the `mcp.json` file, not system environment
- Verify the JSON syntax in your configuration file (check for missing commas, quotes)

### HTTP Server Port Conflicts

**Error:** `Port 3000 already in use`

**Solution:**
- Stop other applications using port 3000
- Or set a custom port:
  ```bash
  PORT=3001 npm run start:http
  ```

---

## What's Included

### MCP Tools (18 total)
- **Schema Exploration**: List tables, get schemas, find relationships, view indexes
- **Database Metadata**: Database info, table info, connection testing
- **Query Helpers**: Execute queries, explain plans, validate syntax, generate templates
- **Data Analysis**: Table statistics, data sampling, column profiling
- **Search & Discovery**: Search tables/columns, find related tables

### MCP Prompts (7 total)
- Explore database schema
- Describe table structure
- Find data relationships
- Generate query templates
- Optimize queries
- Analyze table data
- Compare tables

### Security Features
- Read-only mode (only SELECT queries allowed)
- Query validation to prevent SQL injection
- Password protection (never exposed in responses)
- Input sanitization for table/column names

---

## License

MIT

---

## Links

- **GitHub Repository**: https://github.com/sathiraguruge/SQLLiteMCP
- **npm Package**: https://www.npmjs.com/package/sqlcipher-mcp-server
- **Issues**: https://github.com/sathiraguruge/SQLLiteMCP/issues
