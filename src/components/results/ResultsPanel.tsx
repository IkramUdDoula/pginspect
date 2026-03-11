import { useState } from "react";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useConnection } from "@/contexts/ConnectionContext";
import { useViews } from "@/contexts/ViewContext";
import { Button } from "@/components/ui/button";

export function ResultsPanel() {
  const { queryResult, setEditingRecord, setIsInspectorOpen } = useConnection();
  const { viewResults, isViewMode } = useViews();
  const [page, setPage] = useState(0);

  // Use view results if in view mode, otherwise use regular query results
  const currentResult = isViewMode ? viewResults : queryResult;

  if (!currentResult) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        {isViewMode ? 'Select a view to see results' : 'Run a query to see results'}
      </div>
    );
  }

  const pageSize = 50;
  const totalPages = Math.ceil(currentResult.rows.length / pageSize);
  const pageRows = currentResult.rows.slice(page * pageSize, (page + 1) * pageSize);

  const exportCSV = () => {
    const header = currentResult.columns.join(",");
    const rows = currentResult.rows.map((r) => currentResult.columns.map((c) => JSON.stringify(r[c] ?? "")).join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = isViewMode ? `${viewResults?.view.name || 'view'}_results.csv` : "query_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCell = (value: unknown): string => {
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border text-xs text-muted-foreground">
        <span>
          {currentResult.rowCount} rows{currentResult.isSimulated ? " · simulated" : ""} · {currentResult.executionTime}ms
          {isViewMode && viewResults?.view && (
            <span className="ml-2 text-primary">· {viewResults.view.name}</span>
          )}
        </span>
        <Button variant="ghost" size="sm" onClick={exportCSV} className="h-6 px-2 text-[10px] text-muted-foreground">
          <Download className="h-3 w-3 mr-1" /> CSV
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card z-10">
            <tr>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border w-10">#</th>
              {currentResult.columns.map((col) => (
                <th key={col} className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border whitespace-nowrap">
                  <span className="font-mono">{col}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={i} className="hover:bg-surface-hover transition-colors border-b border-border/50">
                <td
                  className="px-3 py-1.5 text-muted-foreground font-mono cursor-pointer hover:text-primary hover:bg-primary/5 transition-colors"
                  onClick={() => { setEditingRecord(row); setIsInspectorOpen(true); }}
                >
                  {page * pageSize + i + 1}
                </td>
                {currentResult.columns.map((col) => {
                  const val = row[col];
                  const isNull = val === null || val === undefined;
                  return (
                    <td key={col} className={`px-3 py-1.5 font-mono whitespace-nowrap max-w-[200px] truncate ${isNull ? "text-muted-foreground/40 italic" : "text-foreground/90"}`}>
                      {formatCell(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-3 py-2 border-t border-border text-xs text-muted-foreground">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="disabled:opacity-30">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span>Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="disabled:opacity-30">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
