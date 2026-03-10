import { useState } from "react";
import { Plus, X, ChevronDown, ChevronRight, Table2 } from "lucide-react";
import { useConnection } from "@/contexts/ConnectionContext";
import { createBlock, type BlockType, type QueryBlock } from "@/lib/queryBuilder";
import { filterOperatorsByType, getColumnTypeCategory } from "@/lib/columnHelpers";
import type { ColumnInfo } from "@/shared/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const blockMeta: Record<BlockType, { label: string; keyword: string }> = {
  from: { label: "Table source", keyword: "FROM" },
  join: { label: "Join table", keyword: "JOIN" },
  select: { label: "Columns", keyword: "SELECT" },
  filter: { label: "Filter", keyword: "WHERE" },
  sort: { label: "Sort", keyword: "ORDER BY" },
  limit: { label: "Limit", keyword: "LIMIT" },
  aggregate: { label: "Aggregate", keyword: "GROUP BY" },
};

export function VisualQueryBuilder() {
  const { queryBlocks, setQueryBlocks, currentTables, activeSchema, selectedTable } = useConnection();
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  const allColumns: ColumnInfo[] = (() => {
    const fromBlock = queryBlocks.find((b) => b.type === "from");
    const table = currentTables.find((t) => t.name === fromBlock?.config?.table);
    return table?.columns || [];
  })();

  const toggleExpand = (id: string) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addBlock = (type: BlockType) => {
    const defaults: Record<BlockType, Record<string, any>> = {
      from: { table: "" },
      join: { joinType: "INNER", table: "", leftCol: "", rightCol: "" },
      select: { columns: [] },
      filter: { column: "", operator: "", value: "", value2: "" },
      sort: { column: "", direction: "ASC" },
      limit: { limit: "50" },
      aggregate: { func: "COUNT", column: "", groupBy: [] },
    };
    const newBlock = createBlock(type, defaults[type]);
    setQueryBlocks((prev) => [...prev, newBlock]);
    setExpandedBlocks((prev) => new Set(prev).add(newBlock.id));

    // Auto-add a limit block when adding a FROM block (if no limit block exists)
    if (type === "from") {
      const hasLimitBlock = queryBlocks.some(block => block.type === "limit");
      if (!hasLimitBlock) {
        const limitBlock = createBlock("limit", { limit: "50" });
        setQueryBlocks((prev) => [...prev, limitBlock]);
        setExpandedBlocks((prev) => new Set(prev).add(limitBlock.id));
      }
    }
  };

  const removeBlock = (id: string) => {
    setQueryBlocks((prev) => prev.filter((b) => b.id !== id));
    setExpandedBlocks((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const updateBlock = (id: string, config: Record<string, any>) => {
    setQueryBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, config: { ...b.config, ...config } } : b)));
  };

  const getSummary = (block: QueryBlock): string => {
    switch (block.type) {
      case "from": return block.config.table || "no table selected";
      case "select": {
        const cols = block.config.columns || [];
        if (cols.length === 0) return "all columns";
        if (cols.length <= 3) return cols.join(", ");
        return `${cols.slice(0, 2).join(", ")} +${cols.length - 2} more`;
      }
      case "filter": {
        if (!block.config.column) return "no condition set";
        const op = block.config.operator || "?";
        const val = block.config.value || "";
        return `${block.config.column} ${op} ${val}`.trim();
      }
      case "sort": return block.config.column ? `${block.config.column} ${block.config.direction || "ASC"}` : "no column";
      case "limit": return `${block.config.limit || 50} rows`;
      case "join": return block.config.table ? `${block.config.joinType || "INNER"} ${block.config.table}` : "no table";
      case "aggregate": return block.config.column ? `${block.config.func}(${block.config.column})` : "not configured";
      default: return "";
    }
  };

  const renderBlockContent = (block: QueryBlock) => {
    switch (block.type) {
      case "from":
        return (
          <Select value={block.config.table || ""} onValueChange={(v) => updateBlock(block.id, { table: v })}>
            <SelectTrigger className="w-full h-8 text-xs font-mono">
              <SelectValue placeholder="Select table..." />
            </SelectTrigger>
            <SelectContent>
              {currentTables.map((t) => (
                <SelectItem key={t.name} value={t.name} className="text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Table2 className="h-3 w-3 text-muted-foreground" />
                    <span>{t.name}</span>
                    <span className="text-muted-foreground ml-auto">{t.rowCount.toLocaleString()} rows</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "select":
        return (
          <div className="space-y-1.5">
            {allColumns.length === 0 && <p className="text-xs text-muted-foreground">Select a table first</p>}
            <div className="flex items-center gap-3 text-[10px]">
              <button onClick={() => updateBlock(block.id, { columns: allColumns.map((c) => c.name) })} className="text-accent hover:underline">Select all</button>
              <button onClick={() => updateBlock(block.id, { columns: [] })} className="text-muted-foreground hover:underline">Clear</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allColumns.map((col) => {
                const selected = (block.config.columns || []).includes(col.name);
                return (
                  <button key={col.name} onClick={() => {
                    const cols = block.config.columns || [];
                    updateBlock(block.id, { columns: selected ? cols.filter((c: string) => c !== col.name) : [...cols, col.name] });
                  }} className={`text-[11px] px-2 py-1 rounded font-mono border transition-colors ${selected ? "bg-accent/15 border-accent/30 text-accent" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"}`}>
                    {col.name}
                    <span className="ml-1 text-[9px] opacity-50">{col.type}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case "filter": {
        const selectedCol = allColumns.find((c) => c.name === block.config.column);
        const typeCategory = selectedCol ? getColumnTypeCategory(selectedCol) : "text";
        const operators = filterOperatorsByType[typeCategory] || filterOperatorsByType.text;
        const noValueOps = ["IS_NULL", "IS_NOT_NULL", "IS_TRUE", "IS_FALSE", "IS_EMPTY", "IS_NOT_EMPTY", "THIS_WEEK", "THIS_MONTH", "THIS_YEAR"];
        const needsValue = block.config.operator && !noValueOps.includes(block.config.operator);
        const needsTwoValues = block.config.operator === "BETWEEN";
        const isEnum = selectedCol?.enumValues && selectedCol.enumValues.length > 0;

        return (
          <div className="flex flex-wrap items-center gap-2">
            <Select value={block.config.column || ""} onValueChange={(v) => updateBlock(block.id, { column: v, operator: "", value: "" })}>
              <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs font-mono">
                <SelectValue placeholder="column..." />
              </SelectTrigger>
              <SelectContent>
                {allColumns.map((c) => (
                  <SelectItem key={c.name} value={c.name} className="text-xs font-mono">
                    {c.name} <span className="text-muted-foreground ml-1">{c.type}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={block.config.operator || ""} onValueChange={(v) => updateBlock(block.id, { operator: v })}>
              <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs">
                <SelectValue placeholder="operator..." />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {needsValue && (
              isEnum && (block.config.operator === "=" || block.config.operator === "!=" || block.config.operator === "IN") ? (
                <Select value={block.config.value || ""} onValueChange={(v) => updateBlock(block.id, { value: v })}>
                  <SelectTrigger className="h-8 w-auto min-w-[100px] text-xs font-mono">
                    <SelectValue placeholder="value..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCol!.enumValues!.map((v) => (
                      <SelectItem key={v} value={v} className="text-xs font-mono">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <>
                  <input value={block.config.value || ""} onChange={(e) => updateBlock(block.id, { value: e.target.value })} placeholder="value..." className="h-8 px-2 rounded bg-background border border-border text-xs font-mono w-32 focus:outline-none focus:ring-1 focus:ring-ring" />
                  {needsTwoValues && (
                    <input value={block.config.value2 || ""} onChange={(e) => updateBlock(block.id, { value2: e.target.value })} placeholder="to..." className="h-8 px-2 rounded bg-background border border-border text-xs font-mono w-32 focus:outline-none focus:ring-1 focus:ring-ring" />
                  )}
                </>
              )
            )}
          </div>
        );
      }

      case "sort":
        return (
          <div className="flex items-center gap-2">
            <Select value={block.config.column || ""} onValueChange={(v) => updateBlock(block.id, { column: v })}>
              <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs font-mono">
                <SelectValue placeholder="column..." />
              </SelectTrigger>
              <SelectContent>
                {allColumns.map((c) => (
                  <SelectItem key={c.name} value={c.name} className="text-xs font-mono">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex rounded border border-border overflow-hidden">
              {["ASC", "DESC"].map((d) => (
                <button key={d} onClick={() => updateBlock(block.id, { direction: d })} className={`px-3 py-1.5 text-[10px] font-medium transition-colors ${block.config.direction === d ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground"}`}>
                  {d === "ASC" ? "↑ Asc" : "↓ Desc"}
                </button>
              ))}
            </div>
          </div>
        );

      case "limit":
        return (
          <div className="flex items-center gap-3">
            <input type="number" min="1" max="10000" value={block.config.limit || ""} onChange={(e) => updateBlock(block.id, { limit: e.target.value })} className="w-20 h-8 px-2 rounded bg-background border border-border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring" />
            <input type="range" min="1" max="10000" value={block.config.limit || 50} onChange={(e) => updateBlock(block.id, { limit: e.target.value })} className="flex-1 accent-primary h-1" />
            <span className="text-[10px] text-muted-foreground w-12 text-right">{block.config.limit || 50} rows</span>
          </div>
        );

      case "join":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Select value={block.config.joinType || "INNER"} onValueChange={(v) => updateBlock(block.id, { joinType: v })}>
                <SelectTrigger className="h-8 w-auto min-w-[100px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INNER" className="text-xs">INNER</SelectItem>
                  <SelectItem value="LEFT" className="text-xs">LEFT</SelectItem>
                  <SelectItem value="RIGHT" className="text-xs">RIGHT</SelectItem>
                  <SelectItem value="FULL" className="text-xs">FULL OUTER</SelectItem>
                </SelectContent>
              </Select>
              <Select value={block.config.table || ""} onValueChange={(v) => updateBlock(block.id, { table: v })}>
                <SelectTrigger className="flex-1 h-8 text-xs font-mono">
                  <SelectValue placeholder="table..." />
                </SelectTrigger>
                <SelectContent>
                  {currentTables.map((t) => (
                    <SelectItem key={t.name} value={t.name} className="text-xs font-mono">{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-[10px]">ON</span>
              <Select value={block.config.leftCol || ""} onValueChange={(v) => updateBlock(block.id, { leftCol: v })}>
                <SelectTrigger className="flex-1 h-8 text-xs font-mono">
                  <SelectValue placeholder="left col..." />
                </SelectTrigger>
                <SelectContent>
                  {allColumns.map((c) => (
                    <SelectItem key={c.name} value={c.name} className="text-xs font-mono">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>=</span>
              <Select value={block.config.rightCol || ""} onValueChange={(v) => updateBlock(block.id, { rightCol: v })}>
                <SelectTrigger className="flex-1 h-8 text-xs font-mono">
                  <SelectValue placeholder="right col..." />
                </SelectTrigger>
                <SelectContent>
                  {(() => { const jt = currentTables.find((t) => t.name === block.config.table); return jt?.columns || []; })().map((c) => (
                    <SelectItem key={c.name} value={c.name} className="text-xs font-mono">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "aggregate":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Select value={block.config.func || "COUNT"} onValueChange={(v) => updateBlock(block.id, { func: v })}>
                <SelectTrigger className="h-8 w-auto min-w-[90px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["COUNT", "SUM", "AVG", "MIN", "MAX"].map((f) => (
                    <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[10px] text-muted-foreground">(</span>
              <Select value={block.config.column || ""} onValueChange={(v) => updateBlock(block.id, { column: v })}>
                <SelectTrigger className="flex-1 h-8 text-xs font-mono">
                  <SelectValue placeholder="column..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="*" className="text-xs font-mono">*</SelectItem>
                  {allColumns.map((c) => (
                    <SelectItem key={c.name} value={c.name} className="text-xs font-mono">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[10px] text-muted-foreground">)</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted-foreground">Group by</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {allColumns.map((col) => (
                  <button key={col.name} onClick={() => {
                    const gb = block.config.groupBy || [];
                    updateBlock(block.id, { groupBy: gb.includes(col.name) ? gb.filter((c: string) => c !== col.name) : [...gb, col.name] });
                  }} className={`text-[10px] px-2 py-0.5 rounded font-mono border transition-colors ${(block.config.groupBy || []).includes(col.name) ? "bg-accent/15 border-accent/30 text-accent" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    {col.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Compact block palette */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border">
        {(Object.keys(blockMeta) as BlockType[]).map((type) => {
          const meta = blockMeta[type];
          const exists = type === "from" && queryBlocks.some((b) => b.type === "from");
          if (exists && type === "from") return null;
          return (
            <button key={type} onClick={() => addBlock(type)} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors">
              <Plus className="h-2.5 w-2.5" />
              {meta.keyword}
            </button>
          );
        })}
      </div>

      {/* Clause list — accordion style */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {queryBlocks.map((block) => {
          const meta = blockMeta[block.type];
          const isExpanded = expandedBlocks.has(block.id);
          return (
            <div key={block.id} className="border-b border-border animate-fade-in">
              <button
                onClick={() => toggleExpand(block.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-hover transition-colors group"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                <span className="font-mono font-semibold text-accent tracking-wide">{meta.keyword}</span>
                {!isExpanded && (
                  <span className="text-muted-foreground font-mono truncate">{getSummary(block)}</span>
                )}
                {block.type !== "from" && (
                  <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} className="ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 pl-8">
                  {renderBlockContent(block)}
                </div>
              )}
            </div>
          );
        })}

        {queryBlocks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Click a clause above to start building your query
          </div>
        )}
      </div>
    </div>
  );
}
