import type { ColumnFilter, FilterType } from "@/shared/types";

// Detect filter type from column type string
export function detectFilterType(columnType: string): FilterType {
  const type = columnType.toLowerCase();
  
  if (type.includes('bool')) return 'boolean';
  if (type.includes('int') || type.includes('numeric') || type.includes('decimal') || 
      type.includes('float') || type.includes('double') || type.includes('real')) return 'number';
  if (type.includes('date') || type.includes('time')) return 'date';
  if (type.includes('enum')) return 'enum';
  
  return 'text';
}

// Extract unique values from column (limited to first 1000 rows)
export function extractUniqueValues(
  rows: Record<string, unknown>[],
  columnName: string,
  limit = 100
): string[] {
  const uniqueSet = new Set<string>();
  
  for (const row of rows) {
    if (uniqueSet.size >= limit) break;
    
    const value = row[columnName];
    if (value !== null && value !== undefined) {
      uniqueSet.add(String(value));
    }
  }
  
  return Array.from(uniqueSet).sort();
}

// Apply a single filter to rows
export function applyFilter(
  rows: Record<string, unknown>[],
  filter: ColumnFilter
): Record<string, unknown>[] {
  return rows.filter(row => {
    const cellValue = row[filter.column];
    
    // Handle NULL values
    if (cellValue === null || cellValue === undefined) {
      return filter.includeNull;
    }
    
    // Apply filter based on type and operator
    switch (filter.type) {
      case 'text':
        return applyTextFilter(cellValue, filter);
      case 'number':
        return applyNumberFilter(cellValue, filter);
      case 'boolean':
        return applyBooleanFilter(cellValue, filter);
      case 'date':
        return applyDateFilter(cellValue, filter);
      case 'enum':
        return applyTextFilter(cellValue, filter); // Same as text
      default:
        return true;
    }
  });
}

function applyTextFilter(value: unknown, filter: ColumnFilter): boolean {
  const strValue = String(value).toLowerCase();
  
  if (filter.operator === 'in' && Array.isArray(filter.value)) {
    return filter.value.some(v => String(v).toLowerCase() === strValue);
  }
  
  if (filter.operator === 'contains' && typeof filter.value === 'string') {
    return strValue.includes(filter.value.toLowerCase());
  }
  
  if (filter.operator === 'eq' && typeof filter.value === 'string') {
    return strValue === filter.value.toLowerCase();
  }
  
  if (filter.operator === 'neq' && typeof filter.value === 'string') {
    return strValue !== filter.value.toLowerCase();
  }
  
  return true;
}

function applyNumberFilter(value: unknown, filter: ColumnFilter): boolean {
  const numValue = Number(value);
  if (isNaN(numValue)) return false;
  
  if (filter.operator === 'eq' && typeof filter.value === 'number') {
    return numValue === filter.value;
  }
  
  if (filter.operator === 'neq' && typeof filter.value === 'number') {
    return numValue !== filter.value;
  }
  
  if (filter.operator === 'gt' && typeof filter.value === 'number') {
    return numValue > filter.value;
  }
  
  if (filter.operator === 'lt' && typeof filter.value === 'number') {
    return numValue < filter.value;
  }
  
  if (filter.operator === 'gte' && typeof filter.value === 'number') {
    return numValue >= filter.value;
  }
  
  if (filter.operator === 'lte' && typeof filter.value === 'number') {
    return numValue <= filter.value;
  }
  
  if (filter.operator === 'between' && Array.isArray(filter.value) && filter.value.length === 2) {
    const [min, max] = filter.value as [number, number];
    return numValue >= min && numValue <= max;
  }
  
  return true;
}

function applyBooleanFilter(value: unknown, filter: ColumnFilter): boolean {
  const boolValue = Boolean(value);
  
  if (typeof filter.value === 'boolean') {
    return boolValue === filter.value;
  }
  
  return true;
}

function applyDateFilter(value: unknown, filter: ColumnFilter): boolean {
  const dateValue = new Date(String(value));
  if (isNaN(dateValue.getTime())) return false;
  
  if (filter.operator === 'between' && Array.isArray(filter.value) && filter.value.length === 2) {
    const [start, end] = filter.value as [Date, Date];
    return dateValue >= start && dateValue <= end;
  }
  
  if (filter.operator === 'gte' && filter.value instanceof Date) {
    return dateValue >= filter.value;
  }
  
  if (filter.operator === 'lte' && filter.value instanceof Date) {
    return dateValue <= filter.value;
  }
  
  return true;
}

// Apply all filters to rows (AND logic)
export function applyFilters(
  rows: Record<string, unknown>[],
  filters: Map<string, ColumnFilter>
): Record<string, unknown>[] {
  let filteredRows = rows;
  
  for (const filter of filters.values()) {
    filteredRows = applyFilter(filteredRows, filter);
  }
  
  return filteredRows;
}

// Format filter description for display
export function formatFilterDescription(filter: ColumnFilter): string {
  if (filter.type === 'text' && filter.operator === 'in' && Array.isArray(filter.value)) {
    const count = filter.value.length;
    return count === 1 ? filter.value[0] : `${count} values`;
  }
  
  if (filter.type === 'number' && filter.operator === 'between' && Array.isArray(filter.value)) {
    return `${filter.value[0]} - ${filter.value[1]}`;
  }
  
  if (filter.type === 'boolean' && typeof filter.value === 'boolean') {
    return filter.value ? 'true' : 'false';
  }
  
  if (filter.type === 'date' && filter.operator === 'between' && Array.isArray(filter.value)) {
    const [start, end] = filter.value as [Date, Date];
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }
  
  return String(filter.value);
}
