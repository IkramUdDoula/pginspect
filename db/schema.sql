-- pgInspect Database Schema
-- Run this after docker-compose up to initialize the database
-- Usage: docker exec -i pginspect-database-1 psql -U postgres -d pgadmin < db/schema.sql

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
-- NOTES
-- ============================================================================
-- 1. Users table is populated automatically when users sign in via Clerk
-- 2. User connections are created when users add database connections in the UI
-- 3. Passwords are encrypted using AES-256-GCM before storage
-- ============================================================================
