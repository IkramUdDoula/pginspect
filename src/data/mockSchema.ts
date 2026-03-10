// ── Types ──────────────────────────────────────────────
export interface ColumnInfo {
  name: string;
  type: string;
  isPrimary: boolean;
  isNullable: boolean;
  defaultValue?: string;
  enumValues?: string[];
  foreignKey?: { table: string; column: string };
}

export interface IndexInfo {
  name: string;
  columns: string[];
  type: string;
}

export interface ForeignKeyInfo {
  column: string;
  refTable: string;
  refColumn: string;
}

export interface TableInfo {
  name: string;
  rowCount: number;
  sizeKb: number;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  foreignKeys: ForeignKeyInfo[];
}

export interface ConnectionInfo {
  name: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  schema: string;
  sslMode: string;
  status: "connected" | "idle" | "error" | "never";
  connectedAt?: Date;
  serverVersion?: string;
  dbSize?: string;
  lastUsed?: Date;
}

export interface SchemaState {
  schemas: string[];
  tables: Record<string, TableInfo[]>;
}

// ── Filter operators by type ──────────────────────────
export const filterOperatorsByType: Record<string, { label: string; value: string; inputs?: number }[]> = {
  text: [
    { label: "equals", value: "=" },
    { label: "does not equal", value: "!=" },
    { label: "contains", value: "LIKE" },
    { label: "does not contain", value: "NOT LIKE" },
    { label: "starts with", value: "STARTS" },
    { label: "ends with", value: "ENDS" },
    { label: "is empty", value: "IS_EMPTY" },
    { label: "is not empty", value: "IS_NOT_EMPTY" },
    { label: "is one of", value: "IN" },
  ],
  numeric: [
    { label: "equals", value: "=" },
    { label: "does not equal", value: "!=" },
    { label: "greater than", value: ">" },
    { label: "greater or equal", value: ">=" },
    { label: "less than", value: "<" },
    { label: "less or equal", value: "<=" },
    { label: "is between", value: "BETWEEN", inputs: 2 },
    { label: "is null", value: "IS_NULL" },
    { label: "is not null", value: "IS_NOT_NULL" },
  ],
  bool: [
    { label: "is true", value: "IS_TRUE" },
    { label: "is false", value: "IS_FALSE" },
    { label: "is null", value: "IS_NULL" },
    { label: "is not null", value: "IS_NOT_NULL" },
  ],
  timestamp: [
    { label: "equals", value: "=" },
    { label: "is before", value: "<" },
    { label: "is after", value: ">" },
    { label: "is between", value: "BETWEEN", inputs: 2 },
    { label: "in last N days", value: "LAST_N_DAYS" },
    { label: "this week", value: "THIS_WEEK" },
    { label: "this month", value: "THIS_MONTH" },
    { label: "is null", value: "IS_NULL" },
    { label: "is not null", value: "IS_NOT_NULL" },
  ],
  uuid: [
    { label: "equals", value: "=" },
    { label: "does not equal", value: "!=" },
    { label: "is null", value: "IS_NULL" },
    { label: "is not null", value: "IS_NOT_NULL" },
  ],
  jsonb: [
    { label: "has key", value: "HAS_KEY" },
    { label: "does not have key", value: "NOT_HAS_KEY" },
    { label: "is null", value: "IS_NULL" },
    { label: "is not null", value: "IS_NOT_NULL" },
  ],
  enum: [
    { label: "equals", value: "=" },
    { label: "does not equal", value: "!=" },
    { label: "is one of", value: "IN" },
  ],
};

export function getColumnTypeCategory(col: ColumnInfo): string {
  if (col.enumValues && col.enumValues.length > 0) return "enum";
  const t = col.type.toLowerCase();
  if (t.includes("bool")) return "bool";
  if (t.includes("int") || t.includes("numeric") || t.includes("decimal") || t.includes("float") || t.includes("real")) return "numeric";
  if (t.includes("timestamp") || t.includes("date")) return "timestamp";
  if (t === "uuid") return "uuid";
  if (t === "jsonb" || t === "json") return "jsonb";
  return "text";
}

// ── Mock Schema Data ──────────────────────────────────
export const mockSchemaData: SchemaState = {
  schemas: ["public", "analytics", "auth"],
  tables: {
    public: [
      {
        name: "users",
        rowCount: 8420,
        sizeKb: 1840,
        columns: [
          { name: "id", type: "uuid", isPrimary: true, isNullable: false, defaultValue: "gen_random_uuid()" },
          { name: "name", type: "text", isPrimary: false, isNullable: false },
          { name: "email", type: "text", isPrimary: false, isNullable: false },
          { name: "country", type: "text", isPrimary: false, isNullable: true },
          { name: "plan", type: "text", isPrimary: false, isNullable: true, enumValues: ["free", "pro", "enterprise"] },
          { name: "is_active", type: "bool", isPrimary: false, isNullable: false, defaultValue: "true" },
          { name: "created_at", type: "timestamptz", isPrimary: false, isNullable: false, defaultValue: "now()" },
          { name: "avatar_url", type: "text", isPrimary: false, isNullable: true },
        ],
        indexes: [
          { name: "users_pkey", columns: ["id"], type: "PRIMARY KEY" },
          { name: "users_email_idx", columns: ["email"], type: "UNIQUE" },
        ],
        foreignKeys: [],
      },
      {
        name: "orders",
        rowCount: 24381,
        sizeKb: 5120,
        columns: [
          { name: "id", type: "uuid", isPrimary: true, isNullable: false },
          { name: "user_id", type: "uuid", isPrimary: false, isNullable: false, foreignKey: { table: "users", column: "id" } },
          { name: "status", type: "text", isPrimary: false, isNullable: false, enumValues: ["pending", "processing", "completed", "cancelled", "refunded"] },
          { name: "total_amount", type: "numeric", isPrimary: false, isNullable: false },
          { name: "currency", type: "text", isPrimary: false, isNullable: false, defaultValue: "'USD'" },
          { name: "created_at", type: "timestamptz", isPrimary: false, isNullable: false },
          { name: "shipped_at", type: "timestamptz", isPrimary: false, isNullable: true },
          { name: "notes", type: "text", isPrimary: false, isNullable: true },
        ],
        indexes: [
          { name: "orders_pkey", columns: ["id"], type: "PRIMARY KEY" },
          { name: "orders_user_id_idx", columns: ["user_id"], type: "INDEX" },
        ],
        foreignKeys: [{ column: "user_id", refTable: "users", refColumn: "id" }],
      },
      {
        name: "products",
        rowCount: 312,
        sizeKb: 128,
        columns: [
          { name: "id", type: "uuid", isPrimary: true, isNullable: false },
          { name: "name", type: "text", isPrimary: false, isNullable: false },
          { name: "price", type: "numeric", isPrimary: false, isNullable: false },
          { name: "category_id", type: "uuid", isPrimary: false, isNullable: true, foreignKey: { table: "categories", column: "id" } },
          { name: "stock", type: "int4", isPrimary: false, isNullable: false, defaultValue: "0" },
          { name: "is_published", type: "bool", isPrimary: false, isNullable: false, defaultValue: "false" },
          { name: "created_at", type: "timestamptz", isPrimary: false, isNullable: false },
        ],
        indexes: [{ name: "products_pkey", columns: ["id"], type: "PRIMARY KEY" }],
        foreignKeys: [{ column: "category_id", refTable: "categories", refColumn: "id" }],
      },
      {
        name: "categories",
        rowCount: 18,
        sizeKb: 16,
        columns: [
          { name: "id", type: "uuid", isPrimary: true, isNullable: false },
          { name: "name", type: "text", isPrimary: false, isNullable: false },
          { name: "slug", type: "text", isPrimary: false, isNullable: false },
          { name: "parent_id", type: "uuid", isPrimary: false, isNullable: true, foreignKey: { table: "categories", column: "id" } },
        ],
        indexes: [],
        foreignKeys: [],
      },
      {
        name: "order_items",
        rowCount: 61240,
        sizeKb: 9800,
        columns: [
          { name: "id", type: "uuid", isPrimary: true, isNullable: false },
          { name: "order_id", type: "uuid", isPrimary: false, isNullable: false, foreignKey: { table: "orders", column: "id" } },
          { name: "product_id", type: "uuid", isPrimary: false, isNullable: false, foreignKey: { table: "products", column: "id" } },
          { name: "quantity", type: "int4", isPrimary: false, isNullable: false },
          { name: "unit_price", type: "numeric", isPrimary: false, isNullable: false },
        ],
        indexes: [],
        foreignKeys: [
          { column: "order_id", refTable: "orders", refColumn: "id" },
          { column: "product_id", refTable: "products", refColumn: "id" },
        ],
      },
    ],
    analytics: [
      {
        name: "page_views",
        rowCount: 1240000,
        sizeKb: 245000,
        columns: [
          { name: "id", type: "uuid", isPrimary: true, isNullable: false },
          { name: "session_id", type: "uuid", isPrimary: false, isNullable: false },
          { name: "user_id", type: "uuid", isPrimary: false, isNullable: true },
          { name: "path", type: "text", isPrimary: false, isNullable: false },
          { name: "referrer", type: "text", isPrimary: false, isNullable: true },
          { name: "viewed_at", type: "timestamptz", isPrimary: false, isNullable: false },
        ],
        indexes: [],
        foreignKeys: [],
      },
      {
        name: "events",
        rowCount: 3820000,
        sizeKb: 680000,
        columns: [
          { name: "id", type: "uuid", isPrimary: true, isNullable: false },
          { name: "name", type: "text", isPrimary: false, isNullable: false },
          { name: "properties", type: "jsonb", isPrimary: false, isNullable: true },
          { name: "user_id", type: "uuid", isPrimary: false, isNullable: true },
          { name: "occurred_at", type: "timestamptz", isPrimary: false, isNullable: false },
        ],
        indexes: [],
        foreignKeys: [],
      },
    ],
    auth: [
      {
        name: "accounts",
        rowCount: 8420,
        sizeKb: 920,
        columns: [
          { name: "id", type: "uuid", isPrimary: true, isNullable: false },
          { name: "user_id", type: "uuid", isPrimary: false, isNullable: false, foreignKey: { table: "users", column: "id" } },
          { name: "provider", type: "text", isPrimary: false, isNullable: false, enumValues: ["email", "google", "github", "facebook"] },
          { name: "provider_id", type: "text", isPrimary: false, isNullable: false },
          { name: "created_at", type: "timestamptz", isPrimary: false, isNullable: false },
        ],
        indexes: [],
        foreignKeys: [],
      },
      {
        name: "audit_log",
        rowCount: 192840,
        sizeKb: 41000,
        columns: [
          { name: "id", type: "uuid", isPrimary: true, isNullable: false },
          { name: "actor_id", type: "uuid", isPrimary: false, isNullable: true },
          { name: "action", type: "text", isPrimary: false, isNullable: false },
          { name: "table_name", type: "text", isPrimary: false, isNullable: false },
          { name: "record_id", type: "uuid", isPrimary: false, isNullable: true },
          { name: "old_values", type: "jsonb", isPrimary: false, isNullable: true },
          { name: "new_values", type: "jsonb", isPrimary: false, isNullable: true },
          { name: "ip_address", type: "inet", isPrimary: false, isNullable: true },
          { name: "occurred_at", type: "timestamptz", isPrimary: false, isNullable: false },
        ],
        indexes: [],
        foreignKeys: [],
      },
    ],
  },
};
