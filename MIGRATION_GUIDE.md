# Migration Guide: Audit Log & PWA

## Quick Start

### 1. Database Migration

Run the schema update to create the audit_logs table:

```bash
# If using Docker
docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < db/schema.sql

# Or connect directly
psql -U postgres -d pgadmin -f db/schema.sql
```

Verify the table was created:
```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audit_logs';
```

### 2. Install Dependencies

All dependencies are already in package.json. Just ensure they're installed:

```bash
npm install
# or
bun install
```

### 3. Development Testing

Start the development server:
```bash
npm run dev
```

Test the audit log:
1. Navigate to http://localhost:8080/app
2. Execute a query
3. Click the Audit icon (scroll icon) in the top navbar
4. View your audit logs

### 4. Production Build

Build for production to enable PWA:
```bash
npm run build
npm start
```

### 5. Test PWA Installation

1. Open in Chrome: http://localhost:3000
2. Look for "Install" button in address bar
3. Click to install
4. App opens in standalone window

## Adding Audit Logging to Other Routes

### Pattern to Follow

```typescript
// 1. Import audit utilities
import { logAudit } from '../middleware/audit';
import { AuditService } from '../services/auditService';

// 2. In your route handler
router.post('/your-endpoint', authMiddleware, async (c) => {
  const startTime = Date.now();
  
  try {
    // Your business logic here
    const result = await doSomething();
    
    // Log success
    await logAudit(c, {
      actionType: 'your_action_type',
      actionCategory: 'connection', // or 'query', 'view', 'data', 'schema', 'auth', 'system'
      actionDescription: 'Human readable description',
      status: 'success',
      connectionId: connectionId, // if applicable
      connectionName: connectionName, // if applicable
      databaseName: databaseName, // if applicable
      executionTimeMs: Date.now() - startTime,
      // Add other relevant fields
    });
    
    return c.json({ success: true, data: result });
  } catch (error) {
    // Log error
    await logAudit(c, {
      actionType: 'your_action_failed',
      actionCategory: 'connection',
      actionDescription: `Action failed: ${error.message}`,
      status: 'error',
      errorMessage: error.message,
      executionTimeMs: Date.now() - startTime,
    });
    
    return c.json({ success: false, error: error.message }, 500);
  }
});
```

### Example: Connection Routes

Add to `src/server/routes/connections.ts`:

```typescript
import { logAudit } from '../middleware/audit';

// In connect endpoint
await logAudit(c, {
  actionType: 'connection_create',
  actionCategory: 'connection',
  actionDescription: `Created connection: ${name}`,
  status: 'success',
  connectionName: name,
  databaseName: info.database,
  metadata: {
    host: info.host,
    port: info.port,
  },
});

// In test endpoint
await logAudit(c, {
  actionType: 'connection_test',
  actionCategory: 'connection',
  actionDescription: `Tested connection`,
  status: result.success ? 'success' : 'error',
  errorMessage: result.error,
  metadata: {
    serverVersion: result.serverVersion,
  },
});

// In delete endpoint
await logAudit(c, {
  actionType: 'connection_delete',
  actionCategory: 'connection',
  actionDescription: `Deleted connection: ${name}`,
  status: 'success',
  connectionName: name,
});
```

### Example: View Routes

Add to `src/server/routes/views.ts`:

```typescript
// In create view endpoint
await logAudit(c, {
  actionType: 'view_create',
  actionCategory: 'view',
  actionDescription: `Created view: ${viewName}`,
  status: 'success',
  connectionId: connectionId,
  schemaName: schemaName,
  resourceType: 'view',
  resourceName: viewName,
  queryText: queryText,
  queryType: queryType,
});

// In execute view endpoint
await logAudit(c, {
  actionType: 'view_execute',
  actionCategory: 'view',
  actionDescription: `Executed view: ${view.viewName}`,
  status: 'success',
  connectionId: view.connectionId,
  schemaName: view.schemaName,
  resourceType: 'view',
  resourceName: view.viewName,
  queryText: view.queryText,
  rowsAffected: result.rowCount,
  executionTimeMs: result.executionTime,
});
```

### Example: Data Routes

Add to `src/server/routes/data.ts`:

```typescript
// In insert endpoint
await logAudit(c, {
  actionType: 'data_insert',
  actionCategory: 'data',
  actionDescription: `Inserted record into ${schema}.${table}`,
  status: 'success',
  databaseName: connectionInfo.database,
  schemaName: schema,
  tableName: table,
  rowsAffected: 1,
  metadata: { data },
});

// In update endpoint
await logAudit(c, {
  actionType: 'data_update',
  actionCategory: 'data',
  actionDescription: `Updated record in ${schema}.${table}`,
  status: 'success',
  databaseName: connectionInfo.database,
  schemaName: schema,
  tableName: table,
  rowsAffected: result.rowsAffected,
  metadata: { where, data },
});

// In delete endpoint
await logAudit(c, {
  actionType: 'data_delete',
  actionCategory: 'data',
  actionDescription: `Deleted record from ${schema}.${table}`,
  status: 'success',
  databaseName: connectionInfo.database,
  schemaName: schema,
  tableName: table,
  rowsAffected: result.rowsAffected,
  metadata: { where },
});
```

## Action Type Naming Convention

Use this pattern: `{category}_{action}_{status?}`

Examples:
- `connection_create`
- `connection_test`
- `connection_delete`
- `query_execute_select`
- `query_execute_insert`
- `query_execute_failed`
- `view_create`
- `view_execute`
- `data_insert`
- `data_update`
- `data_delete`
- `schema_list`
- `schema_inspect`

## Testing Checklist

### Audit Logs
- [ ] Execute a query and verify it appears in audit logs
- [ ] Test all filters (category, status, date range, search)
- [ ] Test pagination with many logs
- [ ] Click on a log to view details
- [ ] Test export as JSON
- [ ] Test export as CSV
- [ ] Verify statistics are accurate
- [ ] Test with multiple users (each sees only their logs)

### PWA
- [ ] Build for production
- [ ] Install app on desktop (Chrome/Edge)
- [ ] Install app on mobile (iOS Safari, Android Chrome)
- [ ] Test offline mode (DevTools > Network > Offline)
- [ ] Verify cached assets load offline
- [ ] Test reconnection behavior
- [ ] Verify theme color applies
- [ ] Test app shortcuts (if supported)

## Troubleshooting

### Audit Logs Not Appearing

1. Check database connection:
```sql
SELECT COUNT(*) FROM audit_logs;
```

2. Check server logs for errors:
```bash
docker-compose logs -f
```

3. Verify user authentication:
- Audit logs require authenticated user
- Check JWT token is valid

### PWA Not Installing

1. Ensure HTTPS (or localhost)
2. Check manifest.json is accessible: http://localhost:3000/manifest.json
3. Check service worker registration in DevTools > Application > Service Workers
4. Verify no console errors
5. Check Lighthouse PWA score in DevTools

### Service Worker Not Updating

1. Unregister old service worker:
   - DevTools > Application > Service Workers
   - Click "Unregister"
2. Clear cache:
   - DevTools > Application > Storage
   - Click "Clear site data"
3. Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)

## Performance Considerations

### Audit Log Volume

If you have high query volume:

1. **Add retention policy** (future enhancement):
```sql
-- Delete logs older than 90 days
DELETE FROM audit_logs 
WHERE timestamp < NOW() - INTERVAL '90 days';
```

2. **Partition table** (for very high volume):
```sql
-- Create partitioned table by month
CREATE TABLE audit_logs_2026_03 PARTITION OF audit_logs
FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
```

3. **Archive old logs**:
```sql
-- Move to archive table
INSERT INTO audit_logs_archive 
SELECT * FROM audit_logs 
WHERE timestamp < NOW() - INTERVAL '90 days';
```

### Service Worker Cache Size

Monitor cache size in DevTools > Application > Cache Storage

If too large:
1. Reduce STATIC_ASSETS in sw.js
2. Implement cache size limits
3. Use cache expiration

## Environment Variables

No new environment variables required. Existing ones apply:

```env
# Database (for audit logs)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# API (existing)
VITE_API_URL=http://localhost:3000
PORT=3000

# Clerk (existing)
VITE_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

## Rollback Plan

If you need to rollback:

1. **Remove audit_logs table**:
```sql
DROP TABLE IF EXISTS audit_logs CASCADE;
```

2. **Revert code changes**:
```bash
git revert <commit-hash>
```

3. **Unregister service worker**:
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

## Support

For issues or questions:
1. Check `IMPLEMENTATION_SUMMARY.md` for details
2. Review `AUDIT_LOG_AND_PWA_IMPLEMENTATION_PLAN.md` for architecture
3. Check server logs for errors
4. Verify database schema is up to date

---

**Ready to Deploy**: Yes ✅
**Breaking Changes**: None
**Database Migration Required**: Yes (audit_logs table)
