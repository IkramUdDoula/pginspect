# API Reference

Complete reference for pgInspect backend API endpoints.

## Base URL

- Development: `http://localhost:3000/api`
- Docker: `http://localhost:9000/api`
- Production: `https://your-domain.com/api`

## Authentication

All API endpoints (except `/health`) require authentication via Clerk JWT token.

**Headers:**
```
Authorization: Bearer <clerk-jwt-token>
```

## Endpoints

### Health Check

#### GET /health

Check server health status.

**Request:**
```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 12345,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Connections

#### POST /connections/test

Test database connection without saving.

**Request:**
```bash
curl -X POST http://localhost:3000/api/connections/test \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "connectionString": "postgresql://user:pass@host:5432/db"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "serverVersion": "16.1",
    "dbSize": "8.5 MB"
  }
}
```

#### POST /connections

Create and save new connection.

**Request:**
```json
{
  "name": "My Database",
  "host": "localhost",
  "port": 5432,
  "database": "mydb",
  "user": "postgres",
  "password": "password",
  "sslMode": "disable"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "conn_123",
    "savedConnectionId": 1,
    "name": "My Database",
    "status": "connected"
  }
}
```

#### GET /connections

List all saved connections for authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "My Database",
      "host": "localhost",
      "port": 5432,
      "database": "mydb",
      "user": "postgres",
      "sslMode": "disable",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### DELETE /connections/:id

Delete saved connection.

**Response:**
```json
{
  "success": true,
  "message": "Connection deleted"
}
```

### Schema

#### GET /schema/:connectionId/schemas

List all schemas in database.

**Response:**
```json
{
  "success": true,
  "data": {
    "schemas": ["public", "information_schema", "pg_catalog"]
  }
}
```

#### GET /schema/:connectionId/:schemaName/tables

List all tables in schema.

**Response:**
```json
{
  "success": true,
  "data": {
    "tables": [
      {
        "name": "users",
        "schema": "public",
        "rowCount": 100,
        "sizeBytes": 8192
      }
    ]
  }
}
```

#### GET /schema/:connectionId/:schemaName/:tableName

Get detailed table information.

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "users",
    "schema": "public",
    "rowCount": 100,
    "sizeBytes": 8192,
    "columns": [
      {
        "name": "id",
        "type": "integer",
        "nullable": false,
        "defaultValue": "nextval('users_id_seq')",
        "isPrimaryKey": true,
        "isUnique": true
      }
    ],
    "indexes": [
      {
        "name": "users_pkey",
        "columns": ["id"],
        "isUnique": true,
        "isPrimary": true
      }
    ],
    "foreignKeys": []
  }
}
```

### Queries

#### POST /query/execute

Execute SQL query.

**Request:**
```json
{
  "connectionId": "conn_123",
  "sql": "SELECT * FROM users LIMIT 10",
  "limit": 1000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "columns": ["id", "name", "email"],
    "rows": [
      {"id": 1, "name": "John", "email": "john@example.com"}
    ],
    "rowCount": 1,
    "executionTime": 15
  }
}
```

#### POST /query/explain

Get query execution plan.

**Request:**
```json
{
  "connectionId": "conn_123",
  "sql": "SELECT * FROM users WHERE id = 1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": [
      {
        "QUERY PLAN": "Index Scan using users_pkey on users"
      }
    ]
  }
}
```

### Views

#### GET /views

List all saved views for connection.

**Query Parameters:**
- `connectionId` (required): Connection ID

**Response:**
```json
{
  "success": true,
  "data": {
    "views": [
      {
        "id": "uuid-123",
        "userId": "user_123",
        "connectionId": 1,
        "schemaName": "public",
        "viewName": "Active Users",
        "description": "List of active users",
        "queryText": "SELECT * FROM users WHERE status = 'active'",
        "queryType": "sql",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### GET /views/:id

Get specific view details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "viewName": "Active Users",
    "queryText": "SELECT * FROM users WHERE status = 'active'",
    "queryType": "sql"
  }
}
```

#### POST /views

Create new saved view.

**Request:**
```json
{
  "connectionId": 1,
  "schemaName": "public",
  "viewName": "Active Users",
  "description": "List of active users",
  "queryText": "SELECT * FROM users WHERE status = 'active'",
  "queryType": "sql"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "viewName": "Active Users"
  }
}
```

#### PUT /views/:id

Update existing view.

**Request:**
```json
{
  "viewName": "Updated Name",
  "description": "Updated description",
  "queryText": "SELECT * FROM users WHERE status = 'active' LIMIT 100"
}
```

**Response:**
```json
{
  "success": true,
  "message": "View updated"
}
```

#### DELETE /views/:id

Delete saved view.

**Response:**
```json
{
  "success": true,
  "message": "View deleted"
}
```

#### POST /views/:id/execute

Execute saved view.

**Response:**
```json
{
  "success": true,
  "data": {
    "columns": ["id", "name", "email"],
    "rows": [
      {"id": 1, "name": "John", "email": "john@example.com"}
    ],
    "rowCount": 1,
    "executionTime": 15
  }
}
```

### Data Manipulation

#### POST /data/insert

Insert data into table.

**Request:**
```json
{
  "connectionId": "conn_123",
  "schema": "public",
  "table": "users",
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST /data/update

Update table data.

**Request:**
```json
{
  "connectionId": "conn_123",
  "schema": "public",
  "table": "users",
  "where": {"id": 1},
  "data": {"name": "Jane Doe"}
}
```

#### POST /data/delete

Delete table data.

**Request:**
```json
{
  "connectionId": "conn_123",
  "schema": "public",
  "table": "users",
  "where": {"id": 1}
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

### Common Error Codes

- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding rate limiting via Clerk or a reverse proxy.

## CORS

CORS is configured via `CORS_ORIGIN` environment variable. Default allows:
- `http://localhost:8080` (development frontend)
- `http://localhost:3000` (development backend)

For production, update to your domain:
```env
CORS_ORIGIN=https://your-domain.com
```

## Security

- All endpoints (except `/health`) require authentication
- Passwords are encrypted before storage (AES-256-GCM)
- SQL queries are validated for injection patterns
- Query timeout enforced (default 30s)
- Result row limits enforced (default 10,000)

## Testing

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test with authentication
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/connections
```

For more details, see [ARCHITECTURE.md](ARCHITECTURE.md).
