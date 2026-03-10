// Column type helpers and filter operators

import type { ColumnInfo } from '@/shared/types';

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
