import type { ColumnFilter } from "@/shared/types";

/**
 * Escape SQL string values to prevent injection
 */
function escapeSQLString(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Convert a single filter to SQL WHERE condition
 */
function filterToCondition(filter: ColumnFilter): string {
  const column = filter.column;
  
  // Handle NULL-only filter
  if (filter.value === null && filter.includeNull) {
    return `${column} IS NULL`;
  }
  
  let condition = '';
  
  switch (filter.type) {
    case 'text':
    case 'enum':
      if (filter.operator === 'in' && Array.isArray(filter.value)) {
        const values = filter.value.map(v => `'${escapeSQLString(String(v))}'`).join(', ');
        condition = `${column} IN (${values})`;
      } else if (filter.operator === 'eq' && typeof filter.value === 'string') {
        condition = `${column} = '${escapeSQLString(filter.value)}'`;
      } else if (filter.operator === 'neq' && typeof filter.value === 'string') {
        condition = `${column} != '${escapeSQLString(filter.value)}'`;
      } else if (filter.operator === 'contains' && typeof filter.value === 'string') {
        condition = `${column} ILIKE '%${escapeSQLString(filter.value)}%'`;
      }
      break;
      
    case 'number':
      if (filter.operator === 'between' && Array.isArray(filter.value) && filter.value.length === 2) {
        condition = `${column} BETWEEN ${filter.value[0]} AND ${filter.value[1]}`;
      } else if (typeof filter.value === 'number') {
        switch (filter.operator) {
          case 'eq':
            condition = `${column} = ${filter.value}`;
            break;
          case 'neq':
            condition = `${column} != ${filter.value}`;
            break;
          case 'gt':
            condition = `${column} > ${filter.value}`;
            break;
          case 'lt':
            condition = `${column} < ${filter.value}`;
            break;
          case 'gte':
            condition = `${column} >= ${filter.value}`;
            break;
          case 'lte':
            condition = `${column} <= ${filter.value}`;
            break;
        }
      }
      break;
      
    case 'boolean':
      if (typeof filter.value === 'boolean') {
        condition = `${column} = ${filter.value}`;
      }
      break;
      
    case 'date':
      if (filter.operator === 'between' && Array.isArray(filter.value) && filter.value.length === 2) {
        const start = filter.value[0] instanceof Date ? filter.value[0].toISOString() : filter.value[0];
        const end = filter.value[1] instanceof Date ? filter.value[1].toISOString() : filter.value[1];
        condition = `${column} BETWEEN '${start}' AND '${end}'`;
      }
      break;
  }
  
  // Add NULL handling
  if (condition && filter.includeNull) {
    condition = `(${condition} OR ${column} IS NULL)`;
  }
  
  return condition;
}

/**
 * Convert all filters to a WHERE clause
 */
export function filtersToWhereClause(filters: Map<string, ColumnFilter>): string {
  if (filters.size === 0) {
    return '';
  }
  
  const conditions: string[] = [];
  
  for (const filter of filters.values()) {
    const condition = filterToCondition(filter);
    if (condition) {
      conditions.push(condition);
    }
  }
  
  if (conditions.length === 0) {
    return '';
  }
  
  return conditions.join(' AND ');
}

/**
 * Append filters to an existing SQL query
 */
export function appendFiltersToQuery(
  originalQuery: string,
  filters: Map<string, ColumnFilter>
): string {
  const whereClause = filtersToWhereClause(filters);
  
  if (!whereClause) {
    return originalQuery;
  }
  
  // Remove trailing semicolon if present
  let query = originalQuery.trim();
  if (query.endsWith(';')) {
    query = query.slice(0, -1).trim();
  }
  
  // Check if query already has a WHERE clause (case-insensitive)
  const whereMatch = query.match(/\bWHERE\b/i);
  
  if (whereMatch) {
    // Query has WHERE clause - append with AND
    // Find the position after WHERE and any existing conditions
    query = `${query} AND (${whereClause})`;
  } else {
    // No WHERE clause - add one
    // Check if query has ORDER BY, GROUP BY, HAVING, LIMIT, etc.
    const clauseMatch = query.match(/\b(ORDER\s+BY|GROUP\s+BY|HAVING|LIMIT|OFFSET)\b/i);
    
    if (clauseMatch && clauseMatch.index !== undefined) {
      // Insert WHERE before these clauses
      const beforeClause = query.slice(0, clauseMatch.index).trim();
      const afterClause = query.slice(clauseMatch.index).trim();
      query = `${beforeClause} WHERE ${whereClause} ${afterClause}`;
    } else {
      // No special clauses - append WHERE at the end
      query = `${query} WHERE ${whereClause}`;
    }
  }
  
  return query + ';';
}

/**
 * Get a human-readable description of filters
 */
export function getFilterSummary(filters: Map<string, ColumnFilter>): string[] {
  const summaries: string[] = [];
  
  for (const [column, filter] of filters.entries()) {
    let summary = `${column}: `;
    
    if (filter.type === 'text' && filter.operator === 'in' && Array.isArray(filter.value)) {
      summary += `${filter.value.length} value(s)`;
    } else if (filter.type === 'number' && filter.operator === 'between' && Array.isArray(filter.value)) {
      summary += `${filter.value[0]} - ${filter.value[1]}`;
    } else if (filter.type === 'boolean' && typeof filter.value === 'boolean') {
      summary += filter.value ? 'true' : 'false';
    } else {
      summary += String(filter.value);
    }
    
    if (filter.includeNull) {
      summary += ' (+ NULL)';
    }
    
    summaries.push(summary);
  }
  
  return summaries;
}
