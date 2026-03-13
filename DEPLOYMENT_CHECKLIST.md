# Deployment Checklist: Audit Log & PWA

## Pre-Deployment

### Code Review
- [x] All files created and properly structured
- [x] TypeScript types defined in shared/types.ts
- [x] No syntax errors or linting issues
- [x] Imports are correct
- [x] Components follow existing patterns

### Database
- [ ] Backup existing database
- [ ] Review schema changes in db/schema.sql
- [ ] Test migration on development database
- [ ] Verify indexes are created
- [ ] Check table permissions

### Testing
- [ ] Run `npm run lint` - no errors
- [ ] Run `npm run build` - successful build
- [ ] Test in development mode
- [ ] Test audit log creation
- [ ] Test audit log filtering
- [ ] Test audit log export
- [ ] Test PWA installation
- [ ] Test offline mode

## Deployment Steps

### 1. Database Migration

```bash
# Backup first!
pg_dump -U postgres pgadmin > backup_$(date +%Y%m%d).sql

# Run migration
docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < db/schema.sql

# Verify
docker exec -it pginspect-database-1 psql -U postgres -d pgadmin -c "\d audit_logs"
```

### 2. Build Application

```bash
# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Verify build output
ls -la dist/
```

### 3. Deploy Backend

```bash
# If using Docker
npm run docker:rebuild

# Or restart services
npm run docker:down
npm run docker:up

# Check logs
npm run docker:logs
```

### 4. Deploy Frontend

```bash
# If separate frontend deployment
# Upload dist/ folder to your hosting

# Or if integrated with backend
# Already included in docker build
```

### 5. Verify Deployment

```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Check audit endpoint (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/audit/stats

# Check manifest
curl http://localhost:3000/manifest.json

# Check service worker
curl http://localhost:3000/sw.js
```

## Post-Deployment Verification

### Functional Tests

#### Audit Logs
- [ ] Navigate to /app/audit
- [ ] Page loads without errors
- [ ] Statistics display correctly
- [ ] Execute a query in main app
- [ ] Verify query appears in audit log
- [ ] Test category filter
- [ ] Test status filter
- [ ] Test date range filter
- [ ] Test search functionality
- [ ] Click on log entry - detail modal opens
- [ ] Export as JSON - file downloads
- [ ] Export as CSV - file downloads
- [ ] Pagination works with many logs

#### PWA Features
- [ ] Open app in Chrome/Edge
- [ ] Install prompt appears (or install button in address bar)
- [ ] Click install - app installs successfully
- [ ] App opens in standalone window
- [ ] App icon appears in taskbar/dock
- [ ] Close and reopen - app launches quickly
- [ ] Go offline (DevTools > Network > Offline)
- [ ] Offline indicator appears
- [ ] Basic UI still loads
- [ ] Go back online - indicator disappears
- [ ] Service worker registered (DevTools > Application)
- [ ] Cache populated (DevTools > Application > Cache Storage)

#### Mobile Testing (if applicable)
- [ ] Open on iOS Safari
- [ ] "Add to Home Screen" option available
- [ ] Add to home screen
- [ ] App icon appears on home screen
- [ ] Launch from home screen - opens in standalone
- [ ] Test on Android Chrome
- [ ] Install prompt appears
- [ ] Install and test

### Performance Tests

#### Audit Log Performance
- [ ] Load page with 1000+ logs - loads in < 2s
- [ ] Filter logs - results in < 1s
- [ ] Search logs - results in < 1s
- [ ] Export 10,000 logs - completes in < 10s
- [ ] Pagination smooth and responsive

#### PWA Performance
- [ ] Lighthouse PWA score > 90
- [ ] Lighthouse Performance score > 80
- [ ] First load < 3s
- [ ] Subsequent loads < 1s (cached)
- [ ] Offline load < 1s

### Security Tests

#### Audit Logs
- [ ] User A cannot see User B's logs
- [ ] Unauthenticated requests rejected (401)
- [ ] SQL injection attempts logged and blocked
- [ ] Sensitive data not logged (passwords, tokens)
- [ ] Query text truncated at 5000 chars
- [ ] Error messages sanitized

#### PWA
- [ ] Service worker only on HTTPS (or localhost)
- [ ] No sensitive data in cache
- [ ] API calls not cached
- [ ] Manifest served with correct MIME type

## Monitoring Setup

### Metrics to Track

#### Audit Logs
- [ ] Total logs per day
- [ ] Error rate (errors / total)
- [ ] Most common actions
- [ ] Average query execution time
- [ ] Database table size growth

#### PWA
- [ ] Install rate
- [ ] Offline usage
- [ ] Service worker errors
- [ ] Cache hit rate

### Alerts to Configure

- [ ] Audit log error rate > 10%
- [ ] Audit log table size > 10GB
- [ ] Service worker registration failures
- [ ] PWA install errors

## Rollback Plan

### If Issues Detected

1. **Immediate Rollback**
```bash
# Restore previous version
git checkout <previous-commit>
npm run docker:rebuild

# Restore database (if needed)
psql -U postgres pgadmin < backup_YYYYMMDD.sql
```

2. **Partial Rollback** (keep audit logs, disable PWA)
```bash
# Unregister service worker
# Add to public/sw.js:
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', () => {
  self.registration.unregister();
});
```

3. **Database Rollback** (if audit_logs causing issues)
```sql
-- Disable audit logging temporarily
ALTER TABLE audit_logs RENAME TO audit_logs_disabled;

-- Or drop if needed
DROP TABLE audit_logs CASCADE;
```

## Documentation Updates

- [ ] Update README.md with audit log feature
- [ ] Update README.md with PWA installation instructions
- [ ] Add screenshots to docs/
- [ ] Update API documentation
- [ ] Update user guide

## Communication

### Internal Team
- [ ] Notify team of deployment
- [ ] Share new features (audit logs, PWA)
- [ ] Provide training on audit log usage
- [ ] Share troubleshooting guide

### Users (if applicable)
- [ ] Announce new audit log feature
- [ ] Explain PWA installation benefits
- [ ] Provide installation instructions
- [ ] Highlight offline capabilities

## Success Criteria

### Must Have (Blocking)
- [x] Audit logs table created successfully
- [x] Audit logs API endpoints working
- [x] Audit log UI accessible and functional
- [x] PWA manifest valid
- [x] Service worker registered
- [x] No breaking changes to existing features

### Should Have (Important)
- [ ] Query execution logged automatically
- [ ] Audit log export working
- [ ] PWA installable on major browsers
- [ ] Offline indicator working
- [ ] Install prompt appearing

### Nice to Have (Optional)
- [ ] All routes have audit logging
- [ ] Real-time audit log updates
- [ ] Advanced analytics
- [ ] Push notifications

## Known Issues / Limitations

Document any known issues:

1. **Audit Logs**
   - No automatic retention policy (manual cleanup needed)
   - No real-time updates (manual refresh required)
   - Users only see their own logs (no admin view yet)

2. **PWA**
   - Firefox has limited PWA support
   - iOS requires "Add to Home Screen" (no install prompt)
   - Offline mode limited (can't execute queries)

3. **Performance**
   - Large audit log exports may be slow
   - Service worker cache grows over time

## Next Steps After Deployment

### Week 1
- [ ] Monitor error rates
- [ ] Collect user feedback
- [ ] Fix any critical bugs
- [ ] Optimize slow queries

### Week 2-4
- [ ] Add audit logging to remaining routes
- [ ] Implement retention policy
- [ ] Add admin view for audit logs
- [ ] Improve PWA offline capabilities

### Future Enhancements
- [ ] Real-time audit log streaming
- [ ] Advanced analytics dashboard
- [ ] Anomaly detection
- [ ] Compliance reports
- [ ] Background sync for offline operations
- [ ] Push notifications

---

## Sign-Off

- [ ] Developer: Code complete and tested
- [ ] QA: All tests passed
- [ ] DevOps: Deployment successful
- [ ] Product: Features verified
- [ ] Security: Security review complete

**Deployment Date**: _______________
**Deployed By**: _______________
**Version**: 1.0.0
**Status**: ✅ Ready for Production
