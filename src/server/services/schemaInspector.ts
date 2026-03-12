// Database schema inspection service

import type postgres from 'postgres';
import { logger } from '../utils/logger';
import type { TableInfo, ColumnInfo, IndexInfo, ForeignKeyInfo } from '../../shared/types';

export async function getSchemas(sql: postgres.Sql): Promise<string[]> {
  try {
    const result = await sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name
    `;

    return result.map(row => row.schema_name as string);
  } catch (error) {
    logger.error('Failed to fetch schemas', error);
    throw new Error('Failed to fetch schemas');
  }
}

export async function getTables(sql: postgres.Sql, schemaName: string): Promise<TableInfo[]> {
  try {
    const result = await sql`
      SELECT 
        t.table_name,
        t.table_schema,
        COALESCE(s.n_live_tup, -1) as row_count_estimate,
        COALESCE(pg_total_relation_size(quote_ident(t.table_schema)||'.'||quote_ident(t.table_name)), 0) as size_bytes
      FROM information_schema.tables t
      LEFT JOIN pg_stat_user_tables s ON s.schemaname = t.table_schema AND s.relname = t.table_name
      WHERE t.table_schema = ${schemaName}
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `;

    const tables: TableInfo[] = [];

    for (const row of result) {
      const tableName = row.table_name as string;
      const schema = row.table_schema as string;
      let rowCount = Number(row.row_count_estimate);

      // If statistics are not available (0 or -1), get actual count
      // This happens in fresh Docker databases or when ANALYZE hasn't run
      if (rowCount <= 0) {
        try {
          const countResult = await sql`
            SELECT COUNT(*) as count 
            FROM ${sql(schema)}.${sql(tableName)}
          `;
          rowCount = Number(countResult[0].count) || 0;
        } catch (countError) {
          logger.warn('Failed to get exact count, using estimate', { schema, tableName, error: countError });
          rowCount = 0;
        }
      }

      // Get columns, indexes, and foreign keys in parallel
      const [columns, indexes, foreignKeys] = await Promise.all([
        getColumns(sql, schema, tableName),
        getIndexes(sql, schema, tableName),
        getForeignKeys(sql, schema, tableName),
      ]);

      tables.push({
        name: tableName,
        schema,
        rowCount,
        sizeBytes: Number(row.size_bytes) || 0,
        columns,
        indexes,
        foreignKeys,
      });
    }

    return tables;
  } catch (error) {
    logger.error('Failed to fetch tables', error, { schemaName });
    throw new Error('Failed to fetch tables');
  }
}

export async function getTableDetails(
  sql: postgres.Sql,
  schemaName: string,
  tableName: string
): Promise<TableInfo> {
  try {
    const [columns, indexes, foreignKeys, stats] = await Promise.all([
      getColumns(sql, schemaName, tableName),
      getIndexes(sql, schemaName, tableName),
      getForeignKeys(sql, schemaName, tableName),
      getTableStats(sql, schemaName, tableName),
    ]);

    return {
      name: tableName,
      schema: schemaName,
      rowCount: stats.rowCount,
      sizeBytes: stats.sizeBytes,
      columns,
      indexes,
      foreignKeys,
    };
  } catch (error) {
    logger.error('Failed to fetch table details', error, { schemaName, tableName });
    throw new Error('Failed to fetch table details');
  }
}

async function getColumns(
  sql: postgres.Sql,
  schemaName: string,
  tableName: string
): Promise<ColumnInfo[]> {
  const result = await sql`
    SELECT 
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default,
      CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
      CASE WHEN u.column_name IS NOT NULL THEN true ELSE false END as is_unique,
      pgd.description as comment
    FROM information_schema.columns c
    LEFT JOIN (
      SELECT ku.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = ${schemaName}
        AND tc.table_name = ${tableName}
    ) pk ON pk.column_name = c.column_name
    LEFT JOIN (
      SELECT ku.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = ${schemaName}
        AND tc.table_name = ${tableName}
    ) u ON u.column_name = c.column_name
    LEFT JOIN pg_catalog.pg_statio_all_tables st ON st.schemaname = c.table_schema AND st.relname = c.table_name
    LEFT JOIN pg_catalog.pg_description pgd ON pgd.objoid = st.relid AND pgd.objsubid = c.ordinal_position
    WHERE c.table_schema = ${schemaName}
      AND c.table_name = ${tableName}
    ORDER BY c.ordinal_position
  `;

  return result.map(row => ({
    name: row.column_name as string,
    type: row.data_type as string,
    nullable: row.is_nullable === 'YES',
    defaultValue: row.column_default as string | null,
    isPrimaryKey: row.is_primary_key as boolean,
    isUnique: row.is_unique as boolean,
    comment: row.comment as string | null,
  }));
}

async function getIndexes(
  sql: postgres.Sql,
  schemaName: string,
  tableName: string
): Promise<IndexInfo[]> {
  const result = await sql`
    SELECT
      i.indexname as index_name,
      i.indexdef,
      ix.indisunique as is_unique,
      ix.indisprimary as is_primary
    FROM pg_indexes i
    JOIN pg_class c ON c.relname = i.indexname
    JOIN pg_index ix ON ix.indexrelid = c.oid
    WHERE i.schemaname = ${schemaName}
      AND i.tablename = ${tableName}
    ORDER BY i.indexname
  `;

  return result.map(row => {
    // Extract column names from index definition
    const indexDef = row.indexdef as string;
    const match = indexDef.match(/\(([^)]+)\)/);
    const columns = match ? match[1].split(',').map(c => c.trim()) : [];

    return {
      name: row.index_name as string,
      columns,
      isUnique: row.is_unique as boolean,
      isPrimary: row.is_primary as boolean,
    };
  });
}

async function getForeignKeys(
  sql: postgres.Sql,
  schemaName: string,
  tableName: string
): Promise<ForeignKeyInfo[]> {
  const result = await sql`
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = ${schemaName}
      AND tc.table_name = ${tableName}
    ORDER BY tc.constraint_name
  `;

  return result.map(row => ({
    name: row.constraint_name as string,
    column: row.column_name as string,
    referencedTable: row.referenced_table as string,
    referencedColumn: row.referenced_column as string,
  }));
}

async function getTableStats(
  sql: postgres.Sql,
  schemaName: string,
  tableName: string
): Promise<{ rowCount: number; sizeBytes: number }> {
  const result = await sql`
    SELECT 
      COALESCE(s.n_live_tup, -1) as row_count_estimate,
      COALESCE(pg_total_relation_size(quote_ident(${schemaName})||'.'||quote_ident(${tableName})), 0) as size_bytes
    FROM pg_stat_user_tables s
    WHERE s.schemaname = ${schemaName}
      AND s.relname = ${tableName}
  `;

  let rowCount = 0;
  let sizeBytes = 0;

  if (result.length > 0) {
    rowCount = Number(result[0].row_count_estimate);
    sizeBytes = Number(result[0].size_bytes) || 0;
  }

  // If statistics are not available (0 or -1), get actual count
  if (rowCount <= 0) {
    try {
      const countResult = await sql`
        SELECT COUNT(*) as count 
        FROM ${sql(schemaName)}.${sql(tableName)}
      `;
      rowCount = Number(countResult[0].count) || 0;
    } catch (countError) {
      logger.warn('Failed to get exact count, using estimate', { schemaName, tableName, error: countError });
      rowCount = 0;
    }
  }

  return {
    rowCount,
    sizeBytes,
  };
}
