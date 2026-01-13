# Project Architecture

This document describes the reorganized architecture of the SQLCipher MCP Server project.

## Overview

The project has been reorganized following clean code principles with clear separation of concerns, modular design, and maintainability in mind.

## Directory Structure

```
SQLLiteMCP/
├── src/                          # Source code (organized structure)
│   ├── config/                   # Configuration management
│   │   ├── constants.js          # Core application constants
│   │   └── environment.js        # Environment variable management
│   ├── definitions/              # MCP definitions (separated for clarity)
│   │   ├── tools.js              # Tool definitions (18 tools)
│   │   └── prompts.js            # Prompt definitions (7 prompts)
│   ├── handlers/                 # Request handlers
│   │   ├── mcp-handlers.js       # MCP tool handlers (18 tools)
│   │   ├── prompt-handlers.js    # MCP prompt handlers (7 prompts)
│   │   └── http-handlers.js      # HTTP API handlers (20 endpoints)
│   ├── services/                 # Business logic layer
│   │   └── database-service.js   # Database operations service
│   ├── utils/                    # Utility functions
│   │   ├── validators.js         # Input validation
│   │   ├── formatters.js         # Output formatting
│   │   ├── errors.js             # Error handling
│   │   ├── detectors.js          # Database type detection
│   │   └── database-operations.js # Low-level database operations
│   └── server/                   # Server initialization
│       ├── mcp-server.js         # MCP server setup
│       └── http-server.js        # HTTP server setup
├── index.js                      # MCP server entry point
├── server-http.js                # HTTP server entry point
├── postman-collection.json       # Postman API testing collection
└── package.json                  # Project configuration
```

## Architecture Layers

### 1. Entry Points
- **index.js**: Minimal entry point for the MCP server
- **server-http.js**: Minimal entry point for the HTTP test server

### 2. Configuration Layer (`src/config/`)
Centralizes all configuration management:
- **constants.js**: Core application constants (server name, version, configs)
- **environment.js**: Environment variable reading and validation

### 3. Definitions Layer (`src/definitions/`)
Contains MCP protocol definitions:
- **tools.js**: Tool definitions for all 18 MCP tools
- **prompts.js**: Prompt definitions for all 7 MCP prompts

### 4. Server Layer (`src/server/`)
Handles server initialization and setup:
- **mcp-server.js**: Creates and configures the MCP server with tool and prompt handlers
- **http-server.js**: Creates and configures the Express HTTP server with 20 endpoints

### 5. Handler Layer (`src/handlers/`)
Processes incoming requests:
- **mcp-handlers.js**: Handles MCP tool requests (18 tools for database operations)
- **prompt-handlers.js**: Handles MCP prompt requests (7 prompts for workflows)
- **http-handlers.js**: Handles HTTP API requests (20 endpoints with full tool parity)

### 6. Service Layer (`src/services/`)
Contains business logic:
- **database-service.js**: Wraps database operations with error handling and connection management

### 7. Utility Layer (`src/utils/`)
Reusable utility functions:
- **validators.js**: Input validation and sanitization for all parameters
- **formatters.js**: Output formatting for all tool responses
- **errors.js**: Standardized error response creation
- **detectors.js**: Database type detection (SQLCipher vs plain SQLite)
- **database-operations.js**: Low-level SQLCipher database operations

## Data Flow

### MCP Server Request Flow (Tools)

```
index.js
  → startMcpServer() [src/server/mcp-server.js]
    → createMcpServer() registers tool and prompt handlers
    → MCP Tool Request received
      → handleListTools() [src/handlers/mcp-handlers.js]
        OR
      → handleExecuteQuery() [src/handlers/mcp-handlers.js] (1 of 18 tools)
        → validateArguments() [src/utils/validators.js]
        → resolveDatabasePath() [src/utils/validators.js]
        → getDatabasePassword() [src/config/environment.js]
        → executeQueryOnDatabase() [src/services/database-service.js]
          → connectDatabase() [src/utils/database-operations.js]
          → executeQuery() [src/utils/database-operations.js]
          → closeConnection() [src/utils/database-operations.js]
        → formatQueryResults() [src/utils/formatters.js]
        → createMcpSuccessResponse() [src/utils/errors.js]
```

### MCP Server Request Flow (Prompts)

```
index.js
  → startMcpServer() [src/server/mcp-server.js]
    → MCP Prompt Request received
      → handleListPrompts() [src/handlers/prompt-handlers.js]
        OR
      → handleExploreDatabaseSchemaPrompt() [src/handlers/prompt-handlers.js] (1 of 7 prompts)
        → resolveDatabasePath() [src/utils/validators.js]
        → getDatabasePassword() [src/config/environment.js]
        → getTableListFromDatabase() [src/services/database-service.js]
          → getTableList() [src/utils/database-operations.js]
        → Return prompt messages with data
```

### HTTP Server Request Flow

```
server-http.js
  → startHttpServer() [src/server/http-server.js]
    → createHttpApp() registers 20 routes
    → HTTP Request received
      → handleHealthCheck() [src/handlers/http-handlers.js]
        OR
      → handleInfo() [src/handlers/http-handlers.js]
        OR
      → handleQuery() [src/handlers/http-handlers.js]
        OR
      → handleListTables() [src/handlers/http-handlers.js] (1 of 17 tool endpoints)
        → resolveDatabasePath() [src/utils/validators.js]
        → validateTableName() [src/utils/validators.js] (if needed)
        → getDatabasePassword() [src/config/environment.js]
        → getTableListFromDatabase() [src/services/database-service.js]
          → connectDatabase() [src/utils/database-operations.js]
          → getTableList() [src/utils/database-operations.js]
          → closeConnection() [src/utils/database-operations.js]
        → Return simplified JSON response
```

## Key Design Principles

### 1. Separation of Concerns
Each module has a single, well-defined responsibility:
- Configuration is separate from business logic
- Handlers don't contain validation logic
- Services don't format output
- Utilities are pure functions

### 2. DRY (Don't Repeat Yourself)
Common functionality is extracted and reused:
- Validation logic shared between MCP and HTTP handlers
- Error response creation standardized
- Database operations centralized in service layer

### 3. Single Responsibility Principle
Each file/function does one thing well:
- `validators.js`: Only validation
- `formatters.js`: Only formatting
- `database-service.js`: Only database operations

### 4. Dependency Injection
Functions receive dependencies as parameters:
- Handlers receive validated data
- Services receive configuration
- Easy to test and mock

### 5. Error Handling
Consistent error handling throughout:
- Errors are caught at appropriate layers
- Error responses are standardized
- User-friendly error messages

## Tool and Endpoint Coverage

### MCP Server Capabilities
- **18 Tools**: Complete database exploration and analysis
  - Schema Exploration: 6 tools
  - Database & Table Info: 3 tools
  - Query Helpers: 4 tools
  - Data Analysis: 3 tools
  - Search: 2 tools
- **7 Prompts**: Guided workflows for common tasks
  - Database exploration, table structure, relationships, query generation, optimization, analysis, comparison

### HTTP Server Capabilities
- **20 Endpoints**: Full feature parity with MCP server
  - Server Status: 2 endpoints (health, info)
  - Query Execution: 1 endpoint (backward compatible)
  - Tools: 17 endpoints (all tools accessible via HTTP)
- **URL Pattern**: `/api/tool/{tool_name}` for consistency
- **Response Format**: Simplified HTTP-friendly JSON

## Benefits of This Architecture

### Maintainability
- Easy to locate and modify specific functionality
- Clear module boundaries and separation of concerns
- Self-documenting structure with organized folders
- Definitions separated from implementation

### Testability
- Each module can be tested independently
- Pure functions are easy to test
- Dependencies can be mocked
- Service layer abstraction enables testing without database

### Scalability
- Easy to add new tools (define in `definitions/`, implement in handlers)
- Easy to add new validation rules (extend `validators.js`)
- Easy to add new formatters (extend `formatters.js`)
- Easy to add new HTTP endpoints (follow existing pattern)

### Code Quality
- No debug code in production
- Consistent code style across all modules
- Clear naming conventions
- Code reuse between MCP and HTTP servers

### Feature Parity
- HTTP server has all MCP tool capabilities
- Both servers use same service layer
- Consistent behavior across protocols
- Single source of truth for business logic

## Module Responsibilities

### Configuration (`src/config/`)
- Read environment variables
- Provide configuration values
- Validate configuration
- Export core constants (SERVER_CONFIG, QUERY_CONFIG, HTTP_CONFIG)

### Definitions (`src/definitions/`)
- Define MCP tool schemas (18 tools)
- Define MCP prompt schemas (7 prompts)
- Export TOOL_DEFINITIONS and PROMPT_DEFINITIONS

### Handlers (`src/handlers/`)
- Parse request parameters
- Coordinate service calls
- Format responses
- **mcp-handlers.js**: Handle 18 MCP tools
- **prompt-handlers.js**: Handle 7 MCP prompts
- **http-handlers.js**: Handle 20 HTTP endpoints

### Services (`src/services/`)
- Execute business logic
- Manage database connections
- Handle errors
- Provide 18+ service functions for all tools

### Utils (`src/utils/`)
- **validators.js**: Validate all input types
- **formatters.js**: Format all tool outputs
- **errors.js**: Create error responses
- **detectors.js**: Detect database encryption type
- **database-operations.js**: Execute low-level database operations

### Server (`src/server/`)
- Initialize servers
- Register handlers
- Configure middleware
- **mcp-server.js**: Register tool and prompt handlers
- **http-server.js**: Register 20 HTTP routes

## Testing Strategy

With this architecture, testing becomes straightforward:

1. **Unit Tests**: Test individual functions in `utils/`
2. **Integration Tests**: Test handlers with mocked services
3. **Service Tests**: Test services with mocked database
4. **End-to-End Tests**: Test complete request flow

## Evolution and Recent Changes

### Major Refactorings

#### 1. Tool and Prompt Definitions Separation
- **Moved**: `TOOL_DEFINITIONS` and `PROMPT_DEFINITIONS` from `src/config/constants.js`
- **To**: `src/definitions/tools.js` and `src/definitions/prompts.js`
- **Benefit**: Better organization, clearer separation of concerns

#### 2. Database Operations Consolidation
- **Moved**: `lib/database.js` to `src/utils/database-operations.js`
- **Removed**: `lib/` folder (no longer needed)
- **Benefit**: All utilities in one place, consistent structure

#### 3. HTTP Server Expansion
- **Added**: 17 new HTTP endpoints for all tools
- **Pattern**: `/api/tool/{tool_name}` for consistency
- **Benefit**: Full feature parity between MCP and HTTP servers

#### 4. Enhanced Capabilities
- **18 MCP Tools**: Comprehensive database operations
- **7 MCP Prompts**: Guided workflows
- **20 HTTP Endpoints**: Complete REST API

### What Stayed the Same
- Public API unchanged (same entry points)
- Environment variables work the same way
- Core functionality preserved
- Backward compatibility maintained

### Backward Compatibility
- Entry points (`index.js`, `server-http.js`) work the same way
- Environment variables work the same way
- Original `/api/query` endpoint unchanged
- API responses maintain consistent format

## API Testing

### Postman Collection
The project includes a comprehensive Postman collection (`postman-collection.json`) with:
- All 20 HTTP endpoints pre-configured
- Example request bodies for each endpoint
- Organized by category (Schema, Analysis, Search, etc.)
- Ready to import and test

### Testing Strategy
1. **Unit Tests**: Test individual functions in `utils/`
2. **Integration Tests**: Test handlers with mocked services
3. **Service Tests**: Test services with mocked database
4. **End-to-End Tests**: Test complete request flow
5. **HTTP Tests**: Use Postman collection for manual/automated testing

## Future Enhancements

This architecture makes it easy to add:
- Additional MCP tools (define in `definitions/`, implement in handlers)
- Additional HTTP endpoints (follow `/api/tool/` pattern)
- Additional validation rules (extend `validators.js`)
- Additional output formats (extend `formatters.js`)
- Logging and monitoring (add to service layer)
- Caching layer (add between handlers and services)
- Rate limiting (add to HTTP server middleware)
- Authentication/Authorization (add middleware)
- Unit tests (modular structure enables easy testing)
- Integration tests (service abstraction enables mocking)
- WebSocket support (add new server in `src/server/`)
- GraphQL API (add new handler layer)
