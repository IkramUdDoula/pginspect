-- pgInspect Database Schema
-- This schema is automatically applied on first Docker startup via docker-entrypoint-initdb.d
-- To manually run after deployment: npm run db:init
-- Or via Docker: docker exec -i pginspect-db psql -U postgres -d pgadmin < db/schema.sql

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Stores user information synced from Clerk authentication
-- Users are automatically created/updated when they sign in

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,  -- Clerk user ID (e.g., user_2abc...)
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ============================================================================
-- USER CONNECTIONS TABLE
-- ============================================================================
-- Stores database connections per user with encrypted passwords

CREATE TABLE IF NOT EXISTS user_connections (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,  -- References users(id) from Clerk
  name VARCHAR(255) NOT NULL,
  host VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL DEFAULT 5432,
  database VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  password_encrypted TEXT NOT NULL,  -- AES-256-GCM encrypted
  ssl_mode VARCHAR(50) DEFAULT 'prefer',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)  -- Each user can have one connection with a given name
);

-- Indexes for user_connections table
CREATE INDEX IF NOT EXISTS idx_user_connections_user_id ON user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_created_at ON user_connections(created_at);

-- ============================================================================
-- SAVED VIEWS TABLE
-- ============================================================================
-- Stores user-created saved views with query metadata

CREATE TABLE IF NOT EXISTS saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,  -- References users(id) from Clerk
  connection_id INTEGER NOT NULL,  -- References user_connections(id)
  schema_name VARCHAR(255) NOT NULL,
  view_name VARCHAR(255) NOT NULL,
  description TEXT,
  query_text TEXT NOT NULL,
  query_type VARCHAR(20) NOT NULL CHECK (query_type IN ('sql', 'visual')),
  auto_refresh_interval INTEGER,  -- Auto-refresh interval in seconds (NULL = disabled)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (connection_id) REFERENCES user_connections(id) ON DELETE CASCADE,
  UNIQUE(user_id, connection_id, view_name)  -- Unique view names per user per connection
);

-- Indexes for saved_views table
CREATE INDEX IF NOT EXISTS idx_saved_views_user_id ON saved_views(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_views_connection_id ON saved_views(connection_id);
CREATE INDEX IF NOT EXISTS idx_saved_views_updated_at ON saved_views(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_views_user_connection ON saved_views(user_id, connection_id);

-- Comment on auto_refresh_interval column
COMMENT ON COLUMN saved_views.auto_refresh_interval IS 'Auto-refresh interval in milliseconds. 0 = disabled';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================
-- Function to automatically update updated_at timestamp

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Automatically update updated_at on record updates

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_connections_updated_at 
  BEFORE UPDATE ON user_connections 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_views_updated_at 
  BEFORE UPDATE ON saved_views 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Display created tables

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================
-- Tracks all user activities and database operations for compliance and security

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who performed the action
  user_id VARCHAR(255) NOT NULL,  -- References users(id) from Clerk
  user_email VARCHAR(255) NOT NULL,  -- Denormalized for quick access
  user_name VARCHAR(255),  -- Denormalized for display
  
  -- What action was performed
  action_type VARCHAR(50) NOT NULL,  -- e.g., 'query_execute', 'connection_create', 'view_save'
  action_category VARCHAR(30) NOT NULL,  -- e.g., 'query', 'connection', 'view', 'data', 'auth'
  action_description TEXT NOT NULL,  -- Human-readable description
  
  -- When it happened
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- Where it happened (database context)
  connection_id INTEGER,  -- References user_connections(id), nullable
  connection_name VARCHAR(255),  -- Denormalized connection name
  database_name VARCHAR(255),  -- Target database
  schema_name VARCHAR(255),  -- Target schema
  table_name VARCHAR(255),  -- Target table (if applicable)
  
  -- What was affected
  resource_type VARCHAR(50),  -- e.g., 'table', 'view', 'connection', 'query'
  resource_id VARCHAR(255),  -- ID of affected resource
  resource_name VARCHAR(255),  -- Name of affected resource
  
  -- Query details (for query operations)
  query_text TEXT,  -- SQL query executed (truncated if too long)
  query_type VARCHAR(20),  -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DDL', etc.
  rows_affected INTEGER,  -- Number of rows affected
  execution_time_ms INTEGER,  -- Query execution time in milliseconds
  
  -- Operation status
  status VARCHAR(20) NOT NULL,  -- 'success', 'error', 'warning'
  error_message TEXT,  -- Error details if status is 'error'
  
  -- Request metadata
  ip_address VARCHAR(45),  -- IPv4 or IPv6 address
  user_agent TEXT,  -- Browser/client information
  request_id VARCHAR(100),  -- Unique request identifier for tracing
  
  -- Additional context (JSON for flexibility)
  metadata JSONB,  -- Additional structured data
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for audit_logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_category ON audit_logs(action_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_connection_id ON audit_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category_timestamp ON audit_logs(action_category, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_database_name ON audit_logs(database_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);

-- GIN index for JSONB metadata queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON audit_logs USING GIN (metadata);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_category_timestamp 
  ON audit_logs(user_id, action_category, timestamp DESC);

-- Comment on table
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail of all user activities and database operations';

-- Trigger for audit_logs updated_at
CREATE TRIGGER update_audit_logs_updated_at 
  BEFORE UPDATE ON audit_logs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Users table is populated automatically when users sign in via Clerk
-- 2. User connections are created when users add database connections in the UI
-- 3. Passwords are encrypted using AES-256-GCM before storage
-- 4. Audit logs track all user activities for compliance and security
-- ============================================================================
