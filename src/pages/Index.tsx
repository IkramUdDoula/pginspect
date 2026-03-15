import { useState, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useConnection } from "@/contexts/ConnectionContext";
import { useViews } from "@/contexts/ViewContext";
import { ConnectionManager } from "@/components/connection/ConnectionManager";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightInspector } from "@/components/layout/RightInspector";
import { VisualQueryBuilder } from "@/components/editor/VisualQueryBuilder";
import { SQLEditor } from "@/components/editor/SQLEditor";
import { SaveViewDialog } from "@/components/editor/SaveViewDialog";
import { ViewToolbar } from "@/components/editor/ViewToolbar";
import { ResultsPanel } from "@/components/results/ResultsPanel";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { AuditLogView } from "@/components/audit/AuditLogView";
import { blocksToSQL } from "@/lib/queryBuilder";
import { Play, Layers, Code, PanelRight, Plus, Save } from "lucide-react";

function AppContent() {
  const ctx = useConnection();
  const {
    activeConnection, connections, isConnectionManagerOpen, setIsConnectionManagerOpen,
    addConnection, editorMode, setEditorMode, queryBlocks, activeSchema,
    setSqlText, sqlText, runQuery, showDashboard, showAudit, isInspectorOpen, setIsInspectorOpen,
    selectedTable, setCreatingRecord, setEditingRecord, isInitialLoad,
  } = ctx;

  const { isViewMode } = useViews();
  const [showSaveViewDialog, setShowSaveViewDialog] = useState(false);

  const showConnectionManager = !isInitialLoad && connections.length === 0 && !activeConnection;

  // Sync visual blocks → SQL (only when in visual mode)
  useEffect(() => {
    if (editorMode === "visual") {
      const generatedSQL = blocksToSQL(queryBlocks, activeSchema);
      // Only update if the generated SQL is different to avoid unnecessary updates
      if (generatedSQL !== sqlText) {
        setSqlText(generatedSQL);
      }
    }
    // Note: We don't sync when switching FROM visual to SQL mode
    // This preserves manually edited SQL content
  }, [queryBlocks, activeSchema, editorMode]);

  if (showConnectionManager || isConnectionManagerOpen) {
    return (
      <ConnectionManager
        isFullscreen={showConnectionManager}
        onConnect={(conn) => { addConnection(conn); setIsConnectionManagerOpen(false); }}
        onClose={showConnectionManager ? undefined : () => setIsConnectionManagerOpen(false)}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopNavbar />
      <div className="flex flex-1 overflow-hidden">
        {!showDashboard && !showAudit && <LeftSidebar />}

        {/* Center workspace */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {showDashboard ? (
            <Dashboard />
          ) : showAudit ? (
            <AuditLogView />
          ) : (
            <>
              {/* Editor toolbar or View toolbar */}
              {isViewMode ? (
                <ViewToolbar />
              ) : (
                <div className="flex items-center justify-between px-2 sm:px-3 py-2 border-b border-border flex-shrink-0 relative z-10 bg-background gap-2 overflow-x-auto scrollbar-thin">
                  <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5 flex-shrink-0">
                    <button onClick={() => setEditorMode("visual")} className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${editorMode === "visual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      <Layers className="h-3.5 w-3.5 flex-shrink-0" /> <span className="hidden sm:inline">Visual Builder</span>
                    </button>
                    <button onClick={() => setEditorMode("sql")} className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${editorMode === "sql" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      <Code className="h-3.5 w-3.5 flex-shrink-0" /> <span className="hidden sm:inline">SQL Editor</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    {selectedTable && (
                      <span className="text-xs text-muted-foreground font-mono hidden md:inline">{selectedTable.name}</span>
                    )}
                    <button onClick={() => setIsInspectorOpen(!isInspectorOpen)} className={`p-1.5 rounded hover:bg-surface-hover flex-shrink-0 ${isInspectorOpen ? "text-primary" : "text-muted-foreground"}`} title="Toggle Inspector">
                      <PanelRight className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => {
                        if (!selectedTable) return;
                        setCreatingRecord(true);
                        setEditingRecord(null);
                        setIsInspectorOpen(true);
                      }}
                      disabled={!selectedTable}
                      className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
                      title="Create new record"
                    >
                      <Plus className="h-3.5 w-3.5 flex-shrink-0" /> <span className="hidden sm:inline">Create</span>
                    </button>
                    <button 
                      onClick={() => setShowSaveViewDialog(true)}
                      disabled={!sqlText.trim() || !activeConnection}
                      className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
                      title="Save as View"
                    >
                      <Save className="h-3.5 w-3.5 flex-shrink-0" /> <span className="hidden sm:inline">Save as View</span>
                    </button>
                    <button onClick={runQuery} className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors whitespace-nowrap flex-shrink-0" title="Run query">
                      <Play className="h-3.5 w-3.5 flex-shrink-0" /> <span className="hidden sm:inline">Run</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Editor + Results split */}
              <PanelGroup direction="vertical" className="flex-1">
                {!isViewMode && (
                  <>
                    <Panel defaultSize={50} minSize={20}>
                      <div className="h-full overflow-hidden">
                        {editorMode === "visual" ? <VisualQueryBuilder /> : <SQLEditor />}
                      </div>
                    </Panel>

                    {/* SQL Preview (visual mode) */}
                    {editorMode === "visual" && sqlText && (
                      <div className="border-t border-border px-3 py-2 bg-card/50 flex-shrink-0">
                        <div className="text-[10px] uppercase text-muted-foreground mb-1">Generated SQL</div>
                        <pre className="text-xs font-mono text-foreground/70 whitespace-pre-wrap max-h-16 overflow-y-auto scrollbar-thin">{sqlText}</pre>
                      </div>
                    )}

                    <PanelResizeHandle className="h-1 bg-border hover:bg-primary/40 transition-colors cursor-row-resize" />
                  </>
                )}

                <Panel defaultSize={isViewMode ? 100 : 50} minSize={15}>
                  <div className={`h-full ${isViewMode ? '' : 'border-t border-border'} overflow-hidden`}>
                    <ResultsPanel />
                  </div>
                </Panel>
              </PanelGroup>
            </>
          )}
        </div>

        {!showDashboard && !showAudit && <RightInspector />}
      </div>

      {/* Save View Dialog */}
      <SaveViewDialog 
        open={showSaveViewDialog} 
        onOpenChange={setShowSaveViewDialog} 
      />
    </div>
  );
}

export default function Index() {
  return <AppContent />;
}
