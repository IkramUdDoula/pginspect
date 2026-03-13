// View details panel for the right sidebar in view mode

import { X, Calendar, Database, FileText, RefreshCw } from "lucide-react";
import { useViews } from "@/contexts/ViewContext";
import { useConnection } from "@/contexts/ConnectionContext";

export function ViewDetailsPanel() {
  const { currentView, viewResults } = useViews();
  const { setIsInspectorOpen } = useConnection();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!currentView) return null;

  return (
    <div className="flex flex-col h-full min-w-[288px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold">View Details</h3>
          <p className="text-xs text-muted-foreground font-mono">{currentView.viewName}</p>
        </div>
        <button onClick={() => setIsInspectorOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {/* Description */}
        {currentView.description && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span className="uppercase tracking-wider font-medium">Description</span>
            </div>
            <p className="text-sm text-foreground/90 pl-5">
              {currentView.description}
            </p>
          </div>
        )}

        {/* Results Info */}
        {viewResults && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="h-3 w-3" />
              <span className="uppercase tracking-wider font-medium">Results</span>
            </div>
            <div className="pl-5 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rows</span>
                <span className="font-mono text-foreground/90">{viewResults.rowCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Columns</span>
                <span className="font-mono text-foreground/90">{viewResults.columns.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Execution Time</span>
                <span className="font-mono text-foreground/90">{viewResults.executionTime}ms</span>
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span className="uppercase tracking-wider font-medium">Metadata</span>
          </div>
          <div className="pl-5 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Schema</span>
              <span className="font-mono text-foreground/90">{currentView.schemaName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Type</span>
              <span className="font-mono text-foreground/90">{currentView.queryType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created</span>
              <span className="text-xs text-foreground/90">{formatDate(currentView.createdAt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Updated</span>
              <span className="text-xs text-foreground/90">{formatDate(currentView.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Auto-refresh */}
        {currentView.autoRefreshInterval && currentView.autoRefreshInterval > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              <span className="uppercase tracking-wider font-medium">Auto-Refresh</span>
            </div>
            <div className="pl-5">
              <span className="text-sm font-mono text-foreground/90">
                {currentView.autoRefreshInterval < 60000 
                  ? `${currentView.autoRefreshInterval / 1000}s`
                  : `${currentView.autoRefreshInterval / 60000}m`}
              </span>
            </div>
          </div>
        )}

        {/* Query */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span className="uppercase tracking-wider font-medium">Query</span>
          </div>
          <div className="pl-5">
            <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap break-words bg-muted/30 p-2 rounded border border-border">
              {currentView.queryText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
