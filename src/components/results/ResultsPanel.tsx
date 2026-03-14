import { useState, useMemo, useEffect } from "react";
import { Download, ChevronLeft, ChevronRight, X, Save } from "lucide-react";
import { useConnection } from "@/contexts/ConnectionContext";
import { useViews } from "@/contexts/ViewContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SaveViewDialog } from "@/components/editor/SaveViewDialog";
import { ColumnFilter } from "./ColumnFilter";
import { applyFilters, formatFilterDescription } from "@/lib/filterHelpers";
import type { ColumnFilter as ColumnFilterType } from "@/shared/types";

export function ResultsPanel() {
  const { queryResult, setEditingRecord, setIsInspectorOpen } = useConnection();
  const { viewResults, isViewMode, currentView } = useViews();
  const [page, setPage] = useState(0);
  const [columnFilters, setColumnFilters] = useState<Map<string, ColumnFilterType>>(new Map());
  const [showSaveViewDialog, setShowSaveViewDialog] = useState(false);

  // Use view results if in view mode, otherwise use regular query results
  const currentResult = isViewMode ? viewResults : queryResult;

  // Apply filters to rows
  const filteredRows = useMemo(() => {
    if (!currentResult || columnFilters.size === 0) {
      return currentResult?.rows || [];
    }
    return applyFilters(currentResult.rows, columnFilters);
  }, [currentResult, columnFilters]);

  // Reset filters when result changes
  useEffect(() => {
    setColumnFilters(new Map());
    setPage(0);
  }, [currentResult]);

  // Reset page when filters change
  const handleFilterChange = () => {
    setPage(0);
  };

  if (!currentResult) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        {isViewMode ? 'Select a view to see results' : 'Run a query to see results'}
      </div>
    );
  }

  const pageSize = 50;
  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const pageRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);

  const handleApplyFilter = (filter: ColumnFilterType) => {
    setColumnFilters(prev => {
      const next = new Map(prev);
      next.set(filter.column, filter);
      return next;
    });
    handleFilterChange();
  };

  const handleClearFilter = (columnName: string) => {
    setColumnFilters(prev => {
      const next = new Map(prev);
      next.delete(columnName);
      return next;
    });
    handleFilterChange();
  };

  const handleClearAllFilters = () => {
    setColumnFilters(new Map());
    handleFilterChange();
  };

  const handleRowClick = (row: Record<string, unknown>) => {
    if (!isViewMode) {
      setEditingRecord(row);
    } else {
      setEditingRecord(row);
    }
    setIsInspectorOpen(true);
  };

  const exportCSV = () => {
    const header = currentResult.columns.join(",");
    const rows = filteredRows.map((r) => currentResult.columns.map((c) => JSON.stringify(r[c] ?? "")).join(","));
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
    <>
    <div className="flex flex-col h-full" data-results-panel>
      {/* Status bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 px-2 sm:px-3 py-2 sm:py-1.5 border-b border-border text-[10px] sm:text-xs text-muted-foreground">
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {columnFilters.size > 0 && (
            <>
              <span className="whitespace-nowrap">
                {filteredRows.length} of {currentResult.rowCount} rows (filtered)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllFilters}
                className="h-5 px-1.5 sm:px-2 text-[9px] sm:text-[10px] text-muted-foreground"
              >
                Clear all
              </Button>
              {!isViewMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSaveViewDialog(true)}
                  className="h-5 px-1.5 sm:px-2 text-[9px] sm:text-[10px] text-primary"
                >
                  <Save className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-0.5 sm:mr-1" /> <span className="hidden sm:inline">Save Filtered View</span><span className="sm:hidden">Save</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Active filters */}
      {columnFilters.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border flex-wrap">
          {Array.from(columnFilters.entries()).map(([column, filter]) => (
            <Badge key={column} variant="secondary" className="text-[10px] gap-1">
              <span className="font-mono">{column}:</span>
              <span>{formatFilterDescription(filter)}</span>
              <button
                onClick={() => handleClearFilter(column)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card z-10">
            <tr>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border w-10">#</th>
              {currentResult.columns.map((col) => (
                <th key={col} className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span className="font-mono">{col}</span>
                    <ColumnFilter
                      columnName={col}
                      columnType="text"
                      rows={currentResult.rows}
                      currentFilter={columnFilters.get(col)}
                      onApplyFilter={handleApplyFilter}
                      onClearFilter={() => handleClearFilter(col)}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={i} className="hover:bg-surface-hover transition-colors border-b border-border/50">
                <td
                  className="px-3 py-1.5 text-muted-foreground font-mono cursor-pointer hover:text-primary hover:bg-primary/5 transition-colors"
                  onClick={() => handleRowClick(row)}
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
        <div className="flex items-center justify-center gap-2 px-2 sm:px-3 py-2 border-t border-border text-[10px] sm:text-xs text-muted-foreground">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="disabled:opacity-30 p-1">
            <ChevronLeft className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
          </button>
          <span className="whitespace-nowrap">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="disabled:opacity-30 p-1">
            <ChevronRight className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
          </button>
        </div>
      )}
    </div>

    {/* Save View Dialog */}
    <SaveViewDialog 
      open={showSaveViewDialog} 
      onOpenChange={setShowSaveViewDialog}
      filters={columnFilters}
    />
    </>
  );
}
