# Audit Log & PWA Features

## Overview

pgInspect now includes comprehensive audit logging and Progressive Web App (PWA) capabilities.

## 🔍 Audit Log System

### What Gets Logged

The audit system tracks all user activities including:

- **Query Execution**: Every SQL query with execution time and rows affected
- **Connection Management**: Create, test, and delete database connections
- **View Operations**: Create, update, delete, and execute saved views
- **Data Modifications**: Insert, update, and delete operations
- **Schema Operations**: Schema and table inspections
- **Authentication**: Login, logout, and session events
- **Errors**: All failed operations with error details

### Features

- **Advanced Filtering**: Filter by category, status, date range, and full-text search
- **Detailed View**: Click any log entry to see complete details including query text, metadata, and context
- **Statistics Dashboard**: View total logs, success rate, error rate, and activity breakdown
- **Export**: Download audit logs as CSV or JSON for compliance and analysis
- **User-Scoped**: Each user only sees their own audit logs
- **Performance**: Optimized with indexes for fast queries even with millions of logs

### Accessing Audit Logs

1. Click the **Audit icon** (scroll/document icon) in the top navigation bar
2. Use filters to narrow down logs:
   - **Category**: auth, connection, query, view, data, schema, system
   - **Status**: success, error, warning
   - **Date Range**: Pick start and end dates
   - **Search**: Full-text search across descriptions, queries, and errors
3. Click any log entry to view full details
4. Export logs using the Export button (CSV or JSON)

### For Developers

#### Adding Audit Logging to Your Code

```typescript
import { logAudit } from '@/server/middleware/audit';
import { AuditService } from '@/server/services/auditService';

// In your route handler
await logAudit(c, {
  actionType: 'your_action',
  actionCategory: 'query', // or 'connection', 'view', 'data', 'schema', 'auth', 'system'
  actionDescription: 'Human readable description',
  status: 'success', // or 'error', 'warning'
  queryText: sqlQuery, // optional
  queryType: 'SELECT', // optional
  rowsAffected: 10, // optional
  executionTimeMs: 150, // optional
  errorMessage: error.message, // optional, for errors
  metadata: { key: 'value' }, // optional, any additional data
});
```

See `MIGRATION_GUIDE.md` for detailed examples.

## 📱 Progressive Web App (PWA)

### What is PWA?

pgInspect can now be installed as a standalone application on your desktop or mobile device, providing:

- **Offline Access**: Basic UI loads even without internet
- **Fast Loading**: Cached assets load instantly
- **Native Feel**: Runs in its own window without browser UI
- **App Icon**: Appears in your taskbar/dock/home screen
- **Auto Updates**: Service worker updates automatically

### Installing the App

#### Desktop (Chrome, Edge)

1. Open pgInspect in Chrome or Edge
2. Look for the **Install** button in the address bar (or app menu)
3. Click **Install**
4. App opens in standalone window
5. Access from Start Menu (Windows) or Applications (Mac)

#### Mobile (iOS)

1. Open pgInspect in Safari
2. Tap the **Share** button
3. Tap **Add to Home Screen**
4. Tap **Add**
5. App icon appears on home screen

#### Mobile (Android)

1. Open pgInspect in Chrome
2. Tap the menu (three dots)
3. Tap **Install app** or **Add to Home Screen**
4. Tap **Install**
5. App icon appears on home screen

### Offline Capabilities

When offline:
- ✅ App UI loads from cache
- ✅ View previously loaded pages
- ✅ Access cached audit logs
- ❌ Cannot execute new queries (requires database connection)
- ❌ Cannot fetch new data

An offline indicator appears at the top when you lose connection.

### Uninstalling the App

#### Desktop
- Right-click app icon → Uninstall
- Or: Settings → Apps → pgInspect → Uninstall

#### Mobile
- Long-press app icon → Remove/Delete
- Or: Settings → Apps → pgInspect → Uninstall

## 🔒 Security & Privacy

### Audit Logs
- **User-Scoped**: You only see your own audit logs
- **Immutable**: Logs cannot be edited or deleted
- **Sanitized**: Sensitive data (passwords, tokens) never logged
- **Truncated**: Query text limited to 5000 characters
- **Encrypted**: Database connections use encrypted passwords

### PWA
- **HTTPS Required**: Service worker only works on HTTPS (or localhost)
- **No Sensitive Cache**: API responses not cached
- **Secure Storage**: Uses browser's secure storage APIs
- **Auto Updates**: Service worker updates automatically

## 📊 Use Cases

### Audit Logs

**Compliance & Auditing**
- Track who accessed what data and when
- Export logs for compliance reports (SOC2, HIPAA, etc.)
- Investigate security incidents

**Debugging & Troubleshooting**
- Review failed queries and error messages
- Analyze query performance
- Track down issues reported by users

**Analytics & Optimization**
- Identify most-used features
- Find slow queries
- Monitor error rates

### PWA

**Quick Access**
- Launch app instantly from desktop/home screen
- No need to open browser and navigate

**Offline Work**
- Review audit logs offline
- Access cached query results
- View documentation

**Mobile Database Management**
- Manage databases from phone/tablet
- Quick checks on the go
- Emergency access

## 🎯 Best Practices

### Audit Logs

1. **Regular Review**: Check audit logs weekly for anomalies
2. **Export Regularly**: Download logs monthly for archival
3. **Monitor Errors**: Set up alerts for high error rates
4. **Clean Up**: Archive old logs after 90 days (manual for now)

### PWA

1. **Keep Updated**: Service worker updates automatically, but refresh occasionally
2. **Clear Cache**: If issues occur, clear cache in browser settings
3. **Reinstall**: If app misbehaves, uninstall and reinstall
4. **Use HTTPS**: Always access via HTTPS in production

## 🐛 Troubleshooting

### Audit Logs Not Showing

1. Check you're authenticated (logged in)
2. Execute a query to generate logs
3. Refresh the audit page
4. Check browser console for errors

### PWA Not Installing

1. Ensure you're on HTTPS (or localhost)
2. Check browser supports PWA (Chrome, Edge, Safari)
3. Look for install button in address bar or menu
4. Check browser console for errors
5. Try clearing cache and reloading

### Offline Mode Not Working

1. Ensure app was installed (not just bookmarked)
2. Check service worker is registered (DevTools > Application)
3. Verify cache is populated (DevTools > Cache Storage)
4. Try going offline and back online

### Service Worker Issues

1. Unregister service worker:
   - DevTools > Application > Service Workers
   - Click "Unregister"
2. Clear cache:
   - DevTools > Application > Storage
   - Click "Clear site data"
3. Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
4. Reload page

## 📚 Documentation

- **Implementation Plan**: `AUDIT_LOG_AND_PWA_IMPLEMENTATION_PLAN.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Migration Guide**: `MIGRATION_GUIDE.md`
- **Deployment Checklist**: `DEPLOYMENT_CHECKLIST.md`

## 🚀 Future Enhancements

### Audit Logs
- Real-time log streaming (WebSocket)
- Advanced analytics dashboard
- Anomaly detection (ML-based)
- Automatic retention policies
- Admin view (see all users' logs)
- Compliance report templates

### PWA
- Background sync for offline operations
- Push notifications for alerts
- Periodic background sync
- Advanced caching strategies
- Offline query builder

## 💡 Tips & Tricks

### Audit Logs

**Quick Filters**
- Click category badges to filter by category
- Click status icons to filter by status
- Use search for quick lookups

**Export Tips**
- Use CSV for Excel/spreadsheet analysis
- Use JSON for programmatic processing
- Apply filters before exporting to reduce file size

**Performance**
- Use date range filters for large datasets
- Limit results with pagination
- Export in batches if needed

### PWA

**Desktop Shortcuts**
- Pin app to taskbar for quick access
- Create keyboard shortcuts (OS-dependent)
- Use app switcher (Alt+Tab / Cmd+Tab)

**Mobile Tips**
- Add to home screen for native feel
- Use in landscape for better view
- Enable notifications (future feature)

## ❓ FAQ

**Q: Can I delete audit logs?**
A: No, audit logs are immutable for security and compliance. They can only be archived.

**Q: How long are audit logs kept?**
A: Currently indefinitely. Automatic retention policies coming soon.

**Q: Can I see other users' audit logs?**
A: No, you only see your own logs. Admin view coming in future update.

**Q: Does PWA work offline completely?**
A: UI works offline, but database operations require internet connection.

**Q: How much storage does PWA use?**
A: Typically 5-10 MB for cached assets. Grows with usage but limited by browser.

**Q: Can I use PWA on all browsers?**
A: Chrome, Edge, and Safari support PWA. Firefox has limited support.

**Q: Is my data safe in PWA cache?**
A: Yes, cache uses browser's secure storage. No sensitive data cached.

**Q: How do I update the PWA?**
A: Service worker updates automatically. Refresh page to apply updates.

## 🤝 Support

For issues or questions:
1. Check this documentation
2. Review troubleshooting section
3. Check browser console for errors
4. Contact support team

---

**Version**: 1.0.0
**Last Updated**: 2026-03-14
**Status**: ✅ Production Ready
