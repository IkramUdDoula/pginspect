import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pgadmin';

async function runSchema() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    const schemaPath = join(__dirname, '..', 'db', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');

    console.log('\nExecuting schema migration...');
    console.log('This may take a moment...\n');
    
    // Execute the full schema - PostgreSQL will handle IF NOT EXISTS clauses
    try {
      await client.query(schema);
      console.log('✓ Schema executed successfully!');
    } catch (error) {
      // Handle common errors gracefully
      if (error.message.includes('already exists')) {
        console.log('✓ Schema objects already exist (this is normal for updates)');
      } else if (error.message.includes('trigger') && error.message.includes('already exists')) {
        console.log('✓ Triggers already exist (continuing...)');
      } else {
        console.error('✗ Error executing schema:', error.message);
        throw error;
      }
    }
    
    // Verify all expected tables exist
    console.log('\nVerifying database tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const expectedTables = ['users', 'user_connections', 'saved_views', 'audit_logs'];
    const existingTables = result.rows.map(row => row.table_name);
    
    console.log('\nDatabase tables:');
    expectedTables.forEach(table => {
      const exists = existingTables.includes(table);
      console.log(`  ${exists ? '✓' : '✗'} ${table}`);
    });
    
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log(`\n⚠ Warning: ${missingTables.length} table(s) missing: ${missingTables.join(', ')}`);
    } else {
      console.log(`\n✓ All ${expectedTables.length} tables verified successfully!`);
    }
    
    console.log('\n✓ Database migration complete!');

  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSchema();
