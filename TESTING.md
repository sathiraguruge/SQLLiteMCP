# Testing Guide for SQLCipher MCP Server

## Server Status

The HTTP server is running on **http://localhost:3000**

## Setup

1. **Set the database password** (if not already set):
   ```powershell
   $env:SQLCIPHER_PASSWORD = "your_database_password"
   ```

2. **Restart the server** after setting the password:
   ```powershell
   npm run start:http
   ```

## Postman Testing

### Import Collection

1. Open Postman
2. Click **Import** button
3. Select the `postman-collection.json` file from this directory
4. The collection will be imported with 3 requests

### Available Endpoints

#### 1. Health Check
- **Method**: GET
- **URL**: `http://localhost:3000/health`
- **Description**: Check if the server is running and if password is configured
- **Expected Response**:
  ```json
  {
    "status": "ok",
    "message": "SQLCipher MCP HTTP Server is running",
    "passwordConfigured": true
  }
  ```

#### 2. Server Info
- **Method**: GET
- **URL**: `http://localhost:3000/api/info`
- **Description**: Get server information and available endpoints
- **Expected Response**:
  ```json
  {
    "name": "sqlcipher-mcp-server",
    "version": "1.0.0",
    "description": "HTTP wrapper for SQLCipher MCP Server",
    "endpoints": {...},
    "passwordConfigured": true
  }
  ```

#### 3. Execute Query
- **Method**: POST
- **URL**: `http://localhost:3000/api/query`
- **Headers**: 
  - `Content-Type: application/json`
- **Body** (JSON):
  ```json
  {
    "database_path": "C:\\Users\\Username\\AppData\\Local\\AppName\\database.db",
    "query": "SELECT * FROM table_name LIMIT 10"
  }
  ```
- **Expected Response** (Success):
  ```json
  {
    "success": true,
    "data": {
      "columns": ["id", "name", "email"],
      "rows": [
        {"id": 1, "name": "John", "email": "john@example.com"}
      ],
      "rowCount": 1
    },
    "message": "Query executed successfully. 1 row(s) returned."
  }
  ```
- **Expected Response** (Error):
  ```json
  {
    "error": "Failed to connect to database: Database file not found: ..."
  }
  ```

## Example Queries

### Simple SELECT
```json
{
  "database_path": "C:\\path\\to\\database.db",
  "query": "SELECT * FROM users LIMIT 10"
}
```

### SELECT with WHERE
```json
{
  "database_path": "C:\\path\\to\\database.db",
  "query": "SELECT id, name, email FROM users WHERE active = 1"
}
```

### SELECT with JOIN
```json
{
  "database_path": "C:\\path\\to\\database.db",
  "query": "SELECT u.name, o.order_id FROM users u JOIN orders o ON u.id = o.user_id"
}
```

## Common Issues

### "Database password not configured"
- **Solution**: Set the `SQLCIPHER_PASSWORD` environment variable and restart the server

### "Database file not found"
- **Solution**: Check the `database_path` - use absolute paths and ensure the file exists

### "Invalid password or database is corrupted"
- **Solution**: Verify the password matches the one used to encrypt the database
- Ensure SQLCipher 3 defaults were used (as this server expects)

### "Only SELECT queries are allowed"
- **Solution**: This server is read-only. Only SELECT queries are supported.

## Testing with cURL

### Health Check
```bash
curl http://localhost:3000/health
```

### Execute Query
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d "{\"database_path\": \"C:\\\\path\\\\to\\\\database.db\", \"query\": \"SELECT * FROM users LIMIT 10\"}"
```

## Testing with PowerShell

### Health Check
```powershell
Invoke-RestMethod -Uri http://localhost:3000/health -Method Get
```

### Execute Query
```powershell
$body = @{
    database_path = "C:\path\to\database.db"
    query = "SELECT * FROM users LIMIT 10"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/query -Method Post -Body $body -ContentType "application/json"
```
