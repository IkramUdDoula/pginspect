#!/usr/bin/env bun
/**
 * Database Migration Script for Railway
 * Applies schema.sql to the PostgreSQL database
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.log('⚠️  DATABASE_URL not set, skipping migration');
  process.exit(0);
}

async function migrate() {
  console.log('🚀 Starting database migration...');
  
  const sql = postgres(DATABASE_URL!, {
    ssl: 'require',
    max: 1,
  });

  try {
    // Read schema file
    const schemaPath = join(process.cwd(), 'db', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    console.log('📄 Applying schema from db/schema.sql...');
    
    // Execute schema
    await sql.unsafe(schema);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log(`📊 Created ${tables.length} tables:`);
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
