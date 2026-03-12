# Features Guide

Complete guide to pgInspect's features and capabilities.

## Visual Query Builder

Build complex SQL queries without writing code.

### How to Use

1. Click "Visual Builder" tab in the editor
2. Add query blocks:
   - **FROM**: Select table
   - **JOIN**: Add table joins
   - **WHERE**: Add filter conditions
   - **SELECT**: Choose columns
   - **ORDER BY**: Sort results
   - **LIMIT**: Limit rows
3. See generated SQL in real-time
4. Click "Execute" to run query

### Supported Operations

- Table selection with schema
- INNER, LEFT, RIGHT, FULL OUTER joins
- Multiple WHERE conditions with AND/OR
- Column selection with aliases
- Sorting (ASC/DESC)
- Row limiting

### Example

**Visual Builder:**
```
FROM: users
JOIN: orders ON users.id = orders.user_id
WHERE: users.status = 'active'
SELECT: users.name, COUNT(orders.id) as order_count
ORDER BY: order_count DESC
LIMIT: 10
```

**Generated SQL:**
```sql
SELECT users.name, COUNT(orders.id) as order_count
FROM users
INNER JOIN orders ON users.id = orders.user_id
WHERE users.status = 'active'
ORDER BY order_count DESC
LIMIT 10;
```

## SQL Editor

Monaco-powered editor (same as VS Code) with PostgreSQL syntax highlighting.

### Features

- Syntax highlighting
- Auto-complete
- Multi-query support
- Error detection
- Line numbers
- Code folding

### Keyboard Shortcuts

- `Ctrl+Enter` / `Cmd+Enter`: Execute query
- `Ctrl+S` / `Cmd+S`: Save as view
- `Ctrl+/` / `Cmd+/`: Toggle comment
- `Ctrl+F` / `Cmd+F`: Find
- `Ctrl+H` / `Cmd+H`: Replace

### Tips

- Write multiple queries separated by semicolons
- Use comments for documentation: `-- This is a comment`
- Format SQL for readability
- Test queries before saving as views

## Saved Views

Save frequently-used queries for instant access.

### Creating a View

1. Write your query in SQL Editor or Visual Builder
2. Click "Save as View" button in toolbar
3. Enter:
   - View name (required)
   - Description (optional)
4. Click "Save View"

### Accessing Views

1. Click "Views" tab in left sidebar
2. See all saved views for current connection
3. Click any view to execute instantly

### Managing Views

Right-click on any view for options:
- **Execute**: Run the view
- **Edit**: Load query back into editor
- **Rename**: Update name and description
- **Delete**: Remove permanently

### Auto-Refresh

Perfect for monitoring and dashboards:

1. Execute a saved view
2. Click auto-refresh dropdown in toolbar
3. Choose interval:
   - Off (default)
   - 10 seconds
   - 30 seconds
   - 1 minute
   - 5 minutes
4. View refreshes automatically

**Use Cases:**
- System monitoring dashboards
- Real-time data tracking
- Live reporting
- Database health checks

### Technical Details

- Views stored securely in application database
- Isolated per user and connection
- Supports both SQL and Visual query types
- Includes complete query text and metadata
- Auto-refresh uses efficient background timers

## Schema Inspector

Explore your database structure in detail.

### Features

- **Schemas**: List all schemas in database
- **Tables**: View all tables in schema
- **Columns**: See column details:
  - Name
  - Data type
  - Nullable
  - Default value
  - Primary key
  - Unique constraint
- **Indexes**: View table indexes
- **Foreign Keys**: See relationships
- **Statistics**: Row count and table size

### How to Use

1. Connect to a database
2. Right sidebar shows schema tree
3. Expand schemas to see tables
4. Click table to see details
5. View columns, indexes, and foreign keys

### Quick Actions

- Click column to add to query
- Click table to generate SELECT query
- View relationships between tables
- Check table statistics

## Results Panel

Interactive data tables with powerful features.

### Features

- **Sorting**: Click column headers to sort
- **Filtering**: Search within results
- **Pagination**: Navigate large result sets
- **Export**: Download as CSV, JSON, or SQL
- **Copy**: Copy cells or rows
- **Column Resize**: Adjust column widths

### Export Formats

**CSV:**
```csv
id,name,email
1,John Doe,john@example.com
2,Jane Smith,jane@example.com
```

**JSON:**
```json
[
  {"id": 1, "name": "John Doe", "email": "john@example.com"},
  {"id": 2, "name": "Jane Smith", "email": "jane@example.com"}
]
```

**SQL:**
```sql
INSERT INTO users (id, name, email) VALUES
(1, 'John Doe', 'john@example.com'),
(2, 'Jane Smith', 'jane@example.com');
```

## Connection Management

Manage multiple database connections.

### Adding Connections

See [CONNECTIONS.md](CONNECTIONS.md) for detailed guide.

### Features

- Save unlimited connections
- Encrypted password storage
- Quick connection switching
- Connection testing
- Connection status indicators

### Connection Status

- 🟢 **Connected**: Active connection
- 🔴 **Disconnected**: Not connected
- ⚠️ **Error**: Connection failed

## Theme Support

Switch between dark and light themes.

### How to Change

1. Click theme toggle in top navigation
2. Or use keyboard shortcut: `Ctrl+Shift+T` / `Cmd+Shift+T`

### Features

- Persistent theme preference
- Smooth transitions
- Consistent across all components
- Optimized for readability

## Security Features

### Password Encryption

- AES-256-GCM encryption
- Unique encryption key per installation
- Passwords never stored in plain text

### User Isolation

- Database-level user separation
- Connections isolated per user
- Views isolated per user and connection

### SQL Injection Prevention

- Query validation
- Pattern-based detection
- Parameterized queries
- Operation whitelisting

### Authentication

- OAuth with Google and Microsoft
- JWT token verification
- Session management via Clerk
- Automatic user sync

## Performance Features

### Connection Pooling

- Configurable pool size
- Automatic connection cleanup
- Resource limits

### Query Optimization

- Query timeout enforcement (default 30s)
- Result row limits (default 10,000)
- Efficient data fetching

### Caching

- Schema caching via React Query
- Connection state caching
- Optimized re-renders

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Execute query |
| `Ctrl+S` / `Cmd+S` | Save as view |
| `Ctrl+/` / `Cmd+/` | Toggle comment |
| `Ctrl+F` / `Cmd+F` | Find |
| `Ctrl+H` / `Cmd+H` | Replace |
| `Ctrl+Shift+T` / `Cmd+Shift+T` | Toggle theme |

## Tips & Best Practices

1. **Use Saved Views** for frequently-run queries
2. **Test connections** before saving
3. **Use SSL** for cloud databases
4. **Limit result rows** for large tables
5. **Use auto-refresh** for monitoring
6. **Export results** for reporting
7. **Comment your SQL** for documentation
8. **Use Visual Builder** for complex joins

## Limitations

- Maximum 10,000 rows per query (configurable)
- 30-second query timeout (configurable)
- SELECT queries only (security feature)
- Single statement per execution

For configuration, see [SETUP.md](SETUP.md).
