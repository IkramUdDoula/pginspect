import { useConnection } from "@/contexts/ConnectionContext";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { apiClient } from "@/lib/apiClient";

export function Dashboard() {
  const { activeConnection, schemaState, setShowDashboard, setSelectedTable, currentTables, connections, setActiveConnection, removeConnection, setIsConnectionManagerOpen } = useConnection();
  const [connectionStats, setConnectionStats] = React.useState<Record<string, { tables: string | number; rows: string; size: string; schemas: string | number }>>({});
  const [loadingStats, setLoadingStats] = React.useState<Set<string>>(new Set());

  console.log('[Dashboard] Rendering with:', {
    connectionsCount: connections.length,
    connections: connections.map(c => ({ name: c.name, status: c.status, id: c.id })),
    activeConnection: activeConnection?.name,
    schemaState: schemaState ? { schemas: schemaState.schemas, tableCount: Object.keys(schemaState.tables).length } : null
  });

  // Fetch stats for all connected connections
  React.useEffect(() => {
    const fetchStats = async () => {
      const connectedConnections = connections.filter(c => c.status === 'connected' && c.id);
      
      for (const conn of connectedConnections) {
        // Skip if already loading or already have stats
        if (loadingStats.has(conn.name) || connectionStats[conn.name]) {
          continue;
        }

        setLoadingStats(prev => new Set(prev).add(conn.name));

        try {
          const response = await apiClient.getConnectionStats(conn.id!);
          
          if (response.success && response.data) {
            setConnectionStats(prev => ({
              ...prev,
              [conn.name]: {
                tables: response.data.tables,
                rows: formatRows(response.data.rows),
                size: formatSize(response.data.sizeBytes / 1024), // Convert bytes to KB
                schemas: response.data.schemas,
              },
            }));
          }
        } catch (error) {
          console.error('[Dashboard] Failed to fetch stats for', conn.name, error);
        } finally {
          setLoadingStats(prev => {
            const next = new Set(prev);
            next.delete(conn.name);
            return next;
          });
        }
      }
    };

    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections.map(c => `${c.name}-${c.status}-${c.id}`).join(',')]);

  // Open connection and navigate to editor
  const handleConnectionClick = async (conn: typeof connections[0]) => {
    console.log('[Dashboard] Opening connection:', conn.name);
    
    // Activate connection
    await setActiveConnection(conn.name);
    
    // Navigate to editor
    setShowDashboard(false);
  };

  // Handle connection removal
  const handleRemoveConnection = (connName: string) => {
    removeConnection(connName);
    // Clear stats for removed connection
    setConnectionStats(prev => {
      const next = { ...prev };
      delete next[connName];
      return next;
    });
  };

  const formatSize = (kb: number) => {
    if (kb >= 1024 * 1024) return `${(kb / (1024 * 1024)).toFixed(1)} GB`;
    if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${kb} KB`;
  };

  const formatRows = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  // Compute analytics per connection (mock: use current schema data for active, placeholders for others)
  const getConnStats = (connName: string) => {
    // Return cached stats if available
    if (connectionStats[connName]) {
      return connectionStats[connName];
    }
    
    // Return loading placeholders
    return { tables: "—", rows: "—", size: "—", schemas: "—" };
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your database connections</p>
          </div>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => setIsConnectionManagerOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> New Connection
          </Button>
        </div>

        {/* Connections table with analytics */}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Host</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Database</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Tables</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Rows</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Size</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Schemas</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {connections.map((conn) => {
                const stats = getConnStats(conn.name);
                const isActive = conn.name === activeConnection?.name;
                console.log('[Dashboard] Rendering connection row:', { name: conn.name, isActive, stats });
                
                return (
                  <tr
                    key={conn.name}
                    className={`border-t border-border hover:bg-surface-hover transition-colors cursor-pointer ${isActive ? "bg-primary/5" : ""}`}
                    onClick={() => handleConnectionClick(conn)}
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${conn.status === "connected" ? "bg-green-500" : conn.status === "error" ? "bg-red-500" : "bg-muted-foreground"}`} />
                        <span className="text-muted-foreground capitalize">{conn.status || "idle"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono font-medium">{conn.name}</td>
                    <td className="px-3 py-3 font-mono text-muted-foreground">{conn.host}:{conn.port}</td>
                    <td className="px-3 py-3 font-mono text-muted-foreground">{conn.database}</td>
                    <td className="px-3 py-3 text-right font-mono text-muted-foreground">{stats.tables}</td>
                    <td className="px-3 py-3 text-right font-mono text-muted-foreground">{stats.rows}</td>
                    <td className="px-3 py-3 text-right font-mono text-muted-foreground">{stats.size}</td>
                    <td className="px-3 py-3 text-right font-mono text-muted-foreground">{stats.schemas}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveConnection(conn.name); }}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remove connection"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {connections.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">No connections yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
