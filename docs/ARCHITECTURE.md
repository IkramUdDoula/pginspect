# Architecture Documentation

Technical implementation details and architecture overview.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Browser                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  React App (Port 8080/5000)                      │  │
│  │  - React Router                                   │  │
│  │  - React Query (state management)                │  │
│  │  - Clerk React SDK (auth)                        │  │
│  │  - Monaco Editor (SQL editor)                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/HTTPS + JWT
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API (Port 3000/9000)                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Hono Web Framework                              │  │
│  │  - Clerk Backend SDK (auth middleware)           │  │
│  │  - Connection pooling                            │  │
│  │  - Query execution                               │  │
│  │  - Schema inspection                             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ PostgreSQL Protocol
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  PostgreSQL Databases                    │
│  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │  App Database    │  │  User Databases          │    │
│  │  (Port 5432)     │  │  (Various hosts/ports)   │    │
│  │  - users         │  │  - User connections      │    │
│  │  - connections   │  │  - Query targets         │    │
│  │  - saved_views   │  │                          │    │
│  └──────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

**Core:**
- React 18 - UI library
- TypeScript - Type safety
- Vite - Build tool and dev server

**UI Components:**
- shadcn/ui - Component library
- TailwindCSS - Styling
- Radix UI - Headless components
- Framer Motion - Animations

**State Management:**
- React Query - Server state
- React Context - Client state
- React Hook Form - Form state

**Code Editor:**
- Monaco Editor - SQL editor (VS Code engine)

**Routing:**
- React Router - Client-side routing

### Backend

**Runtime:**
- Bun - JavaScript runtime (primary)
- Node.js - Alternative runtime

**Web Framework:**
- Hono - Lightweight web framework

**Database:**
- postgres.js - PostgreSQL driver
- Connection pooling

**Authentication:**
- Clerk Backend SDK - JWT verification
- User sync service

**Security:**
- bcryptjs - Password hashing
- crypto (Node.js) - AES-256-GCM encryption
- SQL injection prevention

### Database

**Application Database:**
- PostgreSQL 16 - User data, connections, views

**User Databases:**
- PostgreSQL (any version) - User's target databases

## Project Structure

```
pginspect/
├── src/
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── connection/     # Connection management
│   │   ├── dashboard/      # Dashboard view
│   │   ├── editor/         # SQL editor & query builder
│   │   ├── layout/         # Layout components
│   │   ├── results/        # Results panel
│   │   └── ui/             # shadcn/ui components
│   ├── contexts/           # React contexts
│   │   ├── ConnectionContext.tsx
│   │   ├── ViewContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── NavigationContext.tsx
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   │   ├── apiClient.ts    # API client
│   │   ├── encryption.ts   # Encryption utilities
│   │   └── utils.ts        # General utilities
│   ├── pages/              # Page components
│   │   ├── Landing.tsx     # Landing page
│   │   ├── Index.tsx       # Main app
│   │   └── NotFound.tsx    # 404 page
│   ├── server/             # Backend code
│   │   ├── index.ts        # Server entry point
│   │   ├── middleware/     # Express middleware
│   │   │   ├── auth.ts     # Authentication
│   │   │   ├── cors.ts     # CORS configuration
│   │   │   ├── errorHandler.ts
│   │   │   └── validator.ts
│   │   ├── routes/         # API routes
│   │   │   ├── connections.ts
│   │   │   ├── schema.ts
│   │   │   ├── queries.ts
│   │   │   ├── views.ts
│   │   │   └── data.ts
│   │   ├── services/       # Business logic
│   │   │   ├── db.ts       # Connection pooling
│   │   │   ├── queryExecutor.ts
│   │   │   ├── schemaInspector.ts
│   │   │   ├── userConnections.ts
│   │   │   ├── userSync.ts
│   │   │   └── viewsService.ts
│   │   └── utils/          # Server utilities
│   │       ├── logger.ts
│   │       └── security.ts
│   ├── shared/             # Shared types
│   │   └── types.ts        # TypeScript interfaces
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── db/
│   └── schema.sql          # Database schema
├── docs/                   # Documentation
├── public/                 # Static assets
├── scripts/                # Utility scripts
├── docker-compose.yml      # Docker configuration
├── Dockerfile              # Docker image
├── package.json            # Dependencies
└── vite.config.ts          # Vite configuration
```

## Data Flow

### Authentication Flow

1. User clicks "Sign In" on landing page
2. Redirected to Clerk authentication
3. User authenticates with OAuth provider
4. Clerk creates session and returns JWT
5. Frontend stores JWT in memory
6. JWT included in all API requests
7. Backend verifies JWT with Clerk
8. User record synced to app database
9. User redirected to `/app`

### Connection Flow

1. User adds database connection in UI
2. Frontend sends connection details to backend
3. Backend tests connection
4. Password encrypted with AES-256-GCM
5. Connection saved to `user_connections` table
6. Connection ID returned to frontend
7. Frontend stores connection in state
8. User can now query the database

### Query Execution Flow

1. User writes SQL in editor or visual builder
2. User clicks "Execute"
3. Frontend sends query to backend with connection ID
4. Backend validates query (SQL injection check)
5. Backend retrieves connection from pool
6. Query executed with timeout and row limit
7. Results returned to frontend
8. Frontend displays results in table

### Saved Views Flow

1. User writes query and clicks "Save as View"
2. Frontend sends view data to backend
3. Backend saves to `saved_views` table
4. View appears in sidebar
5. User clicks view to execute
6. Backend retrieves view and executes query
7. Results displayed with auto-refresh option

## Security Architecture

### Authentication

**Clerk Integration:**
- OAuth with Google and Microsoft
- JWT token generation and verification
- Session management
- User profile management

**Backend Verification:**
```typescript
// src/server/middleware/auth.ts
export async function authMiddleware(c: Context, next: Next) {
  const token = c.req.header('Authorization')?.substring(7);
  const authResult = await clerkClient.authenticateRequest(request);
  
  if (!authResult.isSignedIn) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  c.set('auth', { userId: authResult.toAuth().userId });
  await next();
}
```

### Password Encryption

**AES-256-GCM:**
```typescript
// src/lib/encryption.ts
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}
```

### SQL Injection Prevention

**Pattern-based Validation:**
```typescript
// src/server/utils/security.ts
const DANGEROUS_PATTERNS = [
  /;\s*(drop|delete|truncate|alter|create|insert|update)\s+/i,
  /union\s+select/i,
  /exec\s*\(/i,
  /xp_/i,
  /sp_/i,
];

export function sanitizeSQL(sql: string) {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sql)) {
      return { safe: false, reason: 'Dangerous pattern detected' };
    }
  }
  return { safe: true };
}
```

### User Isolation

**Database Level:**
- Each user has unique ID from Clerk
- Connections filtered by `user_id`
- Views filtered by `user_id` and `connection_id`
- Foreign key constraints with CASCADE delete

## Database Schema

### users Table

```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,  -- Clerk user ID
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### user_connections Table

```sql
CREATE TABLE user_connections (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  host VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL DEFAULT 5432,
  database VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  password_encrypted TEXT NOT NULL,  -- AES-256-GCM
  ssl_mode VARCHAR(50) DEFAULT 'prefer',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)
);
```

### saved_views Table

```sql
CREATE TABLE saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  connection_id INTEGER NOT NULL,
  schema_name VARCHAR(255) NOT NULL,
  view_name VARCHAR(255) NOT NULL,
  description TEXT,
  query_text TEXT NOT NULL,
  query_type VARCHAR(20) NOT NULL CHECK (query_type IN ('sql', 'visual')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (connection_id) REFERENCES user_connections(id) ON DELETE CASCADE,
  UNIQUE(user_id, connection_id, view_name)
);
```

## API Architecture

### Middleware Stack

```typescript
// src/server/index.ts
const app = new Hono();

// 1. CORS middleware
app.use('*', corsMiddleware);

// 2. Authentication middleware (for protected routes)
app.use('/api/*', authMiddleware);

// 3. Route handlers
app.route('/api/connections', connections);
app.route('/api/schema', schema);
app.route('/api/query', queries);
app.route('/api/views', views);

// 4. Error handler
app.onError(errorHandler);
```

### Service Layer

**Connection Pooling:**
```typescript
// src/server/services/db.ts
const pools = new Map<string, Pool>();

export function getPool(connectionId: string): Pool {
  if (!pools.has(connectionId)) {
    pools.set(connectionId, createPool(connectionId));
  }
  return pools.get(connectionId)!;
}
```

**Query Execution:**
```typescript
// src/server/services/queryExecutor.ts
export async function executeQuery(
  connectionId: string,
  sql: string,
  limit: number = 1000
): Promise<QueryResult> {
  const pool = getPool(connectionId);
  const result = await pool.query(sql);
  return {
    columns: result.fields.map(f => f.name),
    rows: result.rows.slice(0, limit),
    rowCount: result.rowCount,
    executionTime: Date.now() - startTime
  };
}
```

## Performance Optimizations

### Frontend

- Code splitting with React.lazy()
- React Query caching
- Debounced search inputs
- Virtual scrolling for large result sets
- Memoized components with React.memo()

### Backend

- Connection pooling (min: 2, max: 10)
- Query timeout enforcement (30s)
- Result row limits (10,000)
- Schema caching
- Efficient SQL queries

### Database

- Indexed columns (user_id, connection_id, created_at)
- Foreign key constraints
- Automatic timestamp updates via triggers
- Connection pooling

## Deployment Architecture

### Development

```
Local Machine:
├── Frontend (Vite dev server) - Port 8080
├── Backend (Bun with hot reload) - Port 3000
└── PostgreSQL (Docker) - Port 5432
```

### Docker

```
Docker Network:
├── App Container
│   ├── Frontend (Vite) - Port 5000
│   └── Backend (Bun) - Port 9000
└── Database Container (PostgreSQL) - Port 5432
```

### Production

```
Cloud Platform (Railway/Render):
├── App Service
│   ├── Frontend (static files)
│   └── Backend (Bun)
└── PostgreSQL Service (managed database)
```

## Monitoring and Logging

### Logging

```typescript
// src/server/utils/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${message}`, meta);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },
  debug: (message: string, meta?: any) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(`[DEBUG] ${message}`, meta);
    }
  }
};
```

### Health Checks

```typescript
// src/server/routes/health.ts
app.get('/health', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});
```

## Testing Strategy

### Unit Tests

- Service layer functions
- Utility functions
- Encryption/decryption
- SQL validation

### Integration Tests

- API endpoints
- Database operations
- Authentication flow

### E2E Tests

- User authentication
- Connection management
- Query execution
- View management

## Future Enhancements

- Rate limiting
- Query history
- Collaborative features
- Advanced query builder
- Data visualization
- Export to multiple formats
- Scheduled queries
- Webhooks
- API key authentication
- Multi-tenancy

For implementation details, see source code in `src/` directory.
