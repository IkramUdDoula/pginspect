export type BlockType = "from" | "join" | "select" | "filter" | "sort" | "limit" | "aggregate";

export interface QueryBlock {
  id: string;
  type: BlockType;
  config: Record<string, any>;
}

export interface JoinConfig {
  joinType: "INNER" | "LEFT" | "RIGHT" | "FULL";
  table: string;
  leftCol: string;
  rightCol: string;
}

export interface FilterConfig {
  column: string;
  operator: string;
  value: string;
  value2?: string;
}

export interface SortConfig {
  column: string;
  direction: "ASC" | "DESC";
}

export interface AggregateConfig {
  func: string;
  column: string;
  groupBy: string[];
}

export function blocksToSQL(blocks: QueryBlock[], schema: string): string {
  const fromBlock = blocks.find((b) => b.type === "from");
  if (!fromBlock?.config?.table) return "-- Select a table to begin";

  const table = `"${schema}"."${fromBlock.config.table}"`;
  const joins = blocks.filter((b) => b.type === "join");
  const selectBlock = blocks.find((b) => b.type === "select");
  const filters = blocks.filter((b) => b.type === "filter");
  const sorts = blocks.filter((b) => b.type === "sort");
  const limitBlock = blocks.find((b) => b.type === "limit");
  const aggBlock = blocks.find((b) => b.type === "aggregate");

  // SELECT
  let selectClause = "*";
  if (aggBlock?.config?.func && aggBlock.config.column) {
    const gCols = (aggBlock.config.groupBy || []).filter(Boolean);
    const aggPart = `${aggBlock.config.func}("${aggBlock.config.column}")`;
    selectClause = gCols.length > 0 ? `${gCols.map((c: string) => `"${c}"`).join(", ")}, ${aggPart}` : aggPart;
  } else if (selectBlock?.config?.columns?.length > 0) {
    selectClause = selectBlock.config.columns.map((c: string) => `"${c}"`).join(", ");
  }

  let sql = `SELECT ${selectClause}\nFROM ${table}`;

  // JOINs
  for (const j of joins) {
    const c = j.config as JoinConfig;
    if (c.table && c.leftCol && c.rightCol) {
      sql += `\n${c.joinType} JOIN "${schema}"."${c.table}" ON "${fromBlock.config.table}"."${c.leftCol}" = "${c.table}"."${c.rightCol}"`;
    }
  }

  // WHERE
  const validFilters = filters.filter((f) => f.config.column && f.config.operator);
  if (validFilters.length > 0) {
    const conditions = validFilters.map((f) => {
      const c = f.config as FilterConfig;
      const col = `"${c.column}"`;
      switch (c.operator) {
        case "IS_NULL": return `${col} IS NULL`;
        case "IS_NOT_NULL": return `${col} IS NOT NULL`;
        case "IS_TRUE": return `${col} = true`;
        case "IS_FALSE": return `${col} = false`;
        case "IS_EMPTY": return `${col} = ''`;
        case "IS_NOT_EMPTY": return `${col} != ''`;
        case "LIKE": return `${col} ILIKE '%${c.value}%'`;
        case "NOT LIKE": return `${col} NOT ILIKE '%${c.value}%'`;
        case "STARTS": return `${col} ILIKE '${c.value}%'`;
        case "ENDS": return `${col} ILIKE '%${c.value}'`;
        case "BETWEEN": return `${col} BETWEEN '${c.value}' AND '${c.value2 || c.value}'`;
        case "IN": return `${col} IN (${(c.value || "").split(",").map((v) => `'${v.trim()}'`).join(", ")})`;
        case "LAST_N_DAYS": return `${col} >= NOW() - INTERVAL '${c.value} days'`;
        case "THIS_WEEK": return `${col} >= date_trunc('week', NOW())`;
        case "THIS_MONTH": return `${col} >= date_trunc('month', NOW())`;
        default: return `${col} ${c.operator} '${c.value}'`;
      }
    });
    sql += `\nWHERE ${conditions.join("\n  AND ")}`;
  }

  // GROUP BY
  if (aggBlock?.config?.groupBy?.length > 0) {
    sql += `\nGROUP BY ${aggBlock.config.groupBy.map((c: string) => `"${c}"`).join(", ")}`;
  }

  // ORDER BY
  const validSorts = sorts.filter((s) => s.config.column);
  if (validSorts.length > 0) {
    sql += `\nORDER BY ${validSorts.map((s) => `"${s.config.column}" ${s.config.direction || "ASC"}`).join(", ")}`;
  }

  // LIMIT
  if (limitBlock?.config?.limit) {
    sql += `\nLIMIT ${limitBlock.config.limit}`;
  }

  return sql + ";";
}

let blockCounter = 0;
export function createBlock(type: BlockType, config: Record<string, any> = {}): QueryBlock {
  return { id: `block_${++blockCounter}_${Date.now()}`, type, config };
}

// Build SQL from query blocks (without schema prefix for API)
export function buildSQLFromBlocks(blocks: QueryBlock[]): string {
  const fromBlock = blocks.find((b) => b.type === "from");
  if (!fromBlock?.config?.table) return "";

  const table = fromBlock.config.table;
  const joins = blocks.filter((b) => b.type === "join");
  const selectBlock = blocks.find((b) => b.type === "select");
  const filters = blocks.filter((b) => b.type === "filter");
  const sorts = blocks.filter((b) => b.type === "sort");
  const limitBlock = blocks.find((b) => b.type === "limit");
  const aggBlock = blocks.find((b) => b.type === "aggregate");

  // SELECT
  let selectClause = "*";
  if (aggBlock?.config?.func && aggBlock.config.column) {
    const gCols = (aggBlock.config.groupBy || []).filter(Boolean);
    const aggPart = `${aggBlock.config.func}(${aggBlock.config.column})`;
    selectClause = gCols.length > 0 ? `${gCols.join(", ")}, ${aggPart}` : aggPart;
  } else if (selectBlock?.config?.columns?.length > 0) {
    selectClause = selectBlock.config.columns.join(", ");
  }

  let sql = `SELECT ${selectClause} FROM ${table}`;

  // JOINs
  for (const j of joins) {
    const c = j.config as JoinConfig;
    if (c.table && c.leftCol && c.rightCol) {
      sql += ` ${c.joinType} JOIN ${c.table} ON ${table}.${c.leftCol} = ${c.table}.${c.rightCol}`;
    }
  }

  // WHERE
  const validFilters = filters.filter((f) => f.config.column && f.config.operator);
  if (validFilters.length > 0) {
    const conditions = validFilters.map((f) => {
      const c = f.config as FilterConfig;
      const col = c.column;
      switch (c.operator) {
        case "IS_NULL": return `${col} IS NULL`;
        case "IS_NOT_NULL": return `${col} IS NOT NULL`;
        case "IS_TRUE": return `${col} = true`;
        case "IS_FALSE": return `${col} = false`;
        case "IS_EMPTY": return `${col} = ''`;
        case "IS_NOT_EMPTY": return `${col} != ''`;
        case "LIKE": return `${col} ILIKE '%${c.value}%'`;
        case "NOT LIKE": return `${col} NOT ILIKE '%${c.value}%'`;
        case "STARTS": return `${col} ILIKE '${c.value}%'`;
        case "ENDS": return `${col} ILIKE '%${c.value}'`;
        case "BETWEEN": return `${col} BETWEEN '${c.value}' AND '${c.value2 || c.value}'`;
        case "IN": return `${col} IN (${(c.value || "").split(",").map((v) => `'${v.trim()}'`).join(", ")})`;
        case "LAST_N_DAYS": return `${col} >= NOW() - INTERVAL '${c.value} days'`;
        case "THIS_WEEK": return `${col} >= date_trunc('week', NOW())`;
        case "THIS_MONTH": return `${col} >= date_trunc('month', NOW())`;
        default: return `${col} ${c.operator} '${c.value}'`;
      }
    });
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  // GROUP BY
  if (aggBlock?.config?.groupBy?.length > 0) {
    sql += ` GROUP BY ${aggBlock.config.groupBy.join(", ")}`;
  }

  // ORDER BY
  const validSorts = sorts.filter((s) => s.config.column);
  if (validSorts.length > 0) {
    sql += ` ORDER BY ${validSorts.map((s) => `${s.config.column} ${s.config.direction || "ASC"}`).join(", ")}`;
  }

  // LIMIT
  if (limitBlock?.config?.limit) {
    sql += ` LIMIT ${limitBlock.config.limit}`;
  }

  return sql;
}
