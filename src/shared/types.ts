// Shared types between client and server

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isUnique: boolean;
  comment: string | null;
  enumValues?: string[];
}

export interface IndexInfo {
  name: string;
  columns: string[];
  isUnique: boolean;
  isPrimary: boolean;
}

export interface ForeignKeyInfo {
  name: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface TableInfo {
  name: string;
  schema: string;
  rowCount: number;
  sizeBytes: number;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  foreignKeys: ForeignKeyInfo[];
}

export interface ConnectionInfo {
  id?: string;
  savedConnectionId?: number; // The numeric ID from user_connections table
  name: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  sslMode: string;
  status?: 'connected' | 'disconnected' | 'error';
  connectedAt?: Date;
  lastUsed?: Date;
  serverVersion?: string;
  dbSize?: string;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
  isSimulated: boolean;
}

export interface SchemaState {
  schemas: string[];
  tables: Record<string, TableInfo[]>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface QueryExecutionRequest {
  connectionId: string;
  sql: string;
  limit?: number;
}

export interface QueryExplainRequest {
  connectionId: string;
  sql: string;
}

export interface DataInsertRequest {
  connectionId: string;
  schema: string;
  table: string;
  data: Record<string, unknown>;
}

export interface DataUpdateRequest {
  connectionId: string;
  schema: string;
  table: string;
  where: Record<string, unknown>;
  data: Record<string, unknown>;
}

export interface DataDeleteRequest {
  connectionId: string;
  schema: string;
  table: string;
  where: Record<string, unknown>;
}

export interface SavedView {
  id: string;
  userId: string;
  connectionId: number;
  schemaName: string;
  viewName: string;
  description?: string;
  queryText: string;
  queryType: 'sql' | 'visual';
  autoRefreshInterval?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateViewRequest {
  connectionId: number;
  schemaName: string;
  viewName: string;
  description?: string;
  queryText: string;
  queryType: 'sql' | 'visual';
  autoRefreshInterval?: number;
}

export interface ViewExecutionRequest {
  viewId: string;
}

export interface ViewListResponse {
  views: SavedView[];
}

// Column filtering types
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'between' | 'in' | 'contains';
export type FilterType = 'text' | 'number' | 'boolean' | 'date' | 'enum';

export interface ColumnFilter {
  column: string;
  type: FilterType;
  operator: FilterOperator;
  value: string | number | boolean | string[] | [number, number] | [Date, Date] | null;
  includeNull: boolean;
}
