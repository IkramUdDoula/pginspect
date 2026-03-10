import { useState } from "react";
import { Search, Table2, LayoutDashboard, PanelLeftClose, PanelLeft, RefreshCw, Plus, Trash2, X } from "lucide-react";
import { useConnection } from "@/contexts/ConnectionContext";
import { useTableCache } from "@/hooks/use-table-cache";
import { createBlock } from "@/lib/queryBuilder";
import { TableListSkeleton, CollapsedTableListSkeleton } from "./TableListSkeleton";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export function LeftSidebar() {
  const { 
    selectedTable, 
    setSelectedTable, 
    setQueryBlocks, 
    setShowDashboard, 
    showDashboard, 
    setQueryResult, 
    activeSchema, 
    setCreatingRecord, 
    setEditingRecord,
    activeConnection
  } = useConnection();
  
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [showDeleteTableDialog, setShowDeleteTableDialog] = useState(false);
  const [showAddTableDialog, setShowAddTableDialog] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [columns, setColumns] = useState<Array<{
    name: string;
    type: string;
    nullable: boolean;
    primaryKey: boolean;
    unique: boolean;
    defaultValue: string;
  }>>([
    { name: "id", type: "SERIAL", nullable: false, primaryKey: true, unique: false, defaultValue: "" }
  ]);

  // Use the table cache hook
  const { tables, isLoading, hasCachedData, refetch } = useTableCache(
    activeConnection?.id || null, 
    activeSchema
  );

  // Show cached data immediately if available, otherwise show loading
  const currentTables = tables;
  const showSkeleton = isLoading && !hasCachedData(activeConnection?.id || '', activeSchema);

  const filtered = currentTables.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  const handleRefresh = async () => {
    await refetch();
  };

  const handleTableClick = (table: typeof currentTables[0]) => {
    setSelectedTable(table);
    setQueryBlocks([
      createBlock("from", { table: table.name }),
      createBlock("select", { columns: table.columns.map((c) => c.name) }),
    ]);
    setShowDashboard(false);
    setQueryResult(null);
    // Close any create/edit modes
    setCreatingRecord(false);
    setEditingRecord(null);
  };

  const formatCount = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  const handleAddTable = async () => {
    if (!newTableName.trim()) {
      toast.error("Table name is required");
      return;
    }
    
    if (!activeConnection) {
      toast.error("No active connection");
      return;
    }
    
    // Validate columns
    const validColumns = columns.filter(col => col.name.trim());
    if (validColumns.length === 0) {
      toast.error("At least one column is required");
      return;
    }

    // Generate CREATE TABLE SQL
    const columnDefs = validColumns.map(col => {
      let def = `  ${col.name} ${col.type}`;
      if (col.primaryKey) def += " PRIMARY KEY";
      if (!col.nullable && !col.primaryKey) def += " NOT NULL";
      if (col.unique && !col.primaryKey) def += " UNIQUE";
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
      return def;
    }).join(",\n");

    const createTableSQL = `CREATE TABLE ${newTableName} (\n${columnDefs}\n);`;
    
    try {
      // Execute the CREATE TABLE query
      const response = await apiClient.executeQuery({
        connectionId: activeConnection.id,
        sql: createTableSQL,
        limit: 0,
      });

      if (!response.success) {
        toast.error(response.error || "Failed to create table");
        return;
      }

      toast.success(`Table "${newTableName}" created successfully`);
      
      // Reset form
      setNewTableName("");
      setColumns([{ name: "id", type: "SERIAL", nullable: false, primaryKey: true, unique: false, defaultValue: "" }]);
      setShowAddTableDialog(false);
      
      // Refresh table list
      await handleRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create table");
    }
  };

  const addColumn = () => {
    setColumns([...columns, { name: "", type: "VARCHAR(255)", nullable: true, primaryKey: false, unique: false, defaultValue: "" }]);
  };

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const updateColumn = (index: number, field: string, value: any) => {
    const updated = [...columns];
    updated[index] = { ...updated[index], [field]: value };
    setColumns(updated);
  };

  const handleDeleteTable = async () => {
    if (!selectedTable) return;
    if (!activeConnection) {
      toast.error("No active connection");
      return;
    }

    const dropTableSQL = `DROP TABLE IF EXISTS ${selectedTable.name};`;
    
    try {
      // Execute the DROP TABLE query
      const response = await apiClient.executeQuery({
        connectionId: activeConnection.id,
        sql: dropTableSQL,
        limit: 0,
      });

      if (!response.success) {
        toast.error(response.error || "Failed to delete table");
        return;
      }

      toast.success(`Table "${selectedTable.name}" deleted successfully`);
      setShowDeleteTableDialog(false);
      setSelectedTable(null);
      
      // Refresh table list
      await handleRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete table");
    }
  };

  return (
    <aside
      className="border-r border-border bg-card/30 flex flex-col flex-shrink-0 h-full overflow-hidden transition-all duration-300 ease-in-out"
      style={{ width: collapsed ? 48 : 240 }}
    >
      {collapsed ? (
        <>
          <div className="flex flex-col items-center py-2 gap-1">
            <button
              onClick={() => setCollapsed(false)}
              className="p-2 rounded-md hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
              title="Expand sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => { setShowDashboard(true); setSelectedTable(null); setCreatingRecord(false); setEditingRecord(null); }}
              className={`p-2 rounded-md hover:bg-surface-hover transition-colors ${showDashboard ? "text-primary bg-primary/5" : "text-muted-foreground"}`}
              title="Dashboard"
            >
              <LayoutDashboard className="h-4 w-4" />
            </button>

            <div className="w-6 border-t border-border my-1" />
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col items-center gap-0.5 w-full">
            {showSkeleton ? (
              <CollapsedTableListSkeleton />
            ) : (
              filtered.map((table) => (
                <button
                  key={table.name}
                  onClick={() => handleTableClick(table)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-hover transition-colors ${selectedTable?.name === table.name && !showDashboard ? "bg-primary/5 text-primary" : "text-muted-foreground"}`}
                  title={`${table.name} (${formatCount(table.rowCount)})`}
                >
                  <Table2 className="h-3.5 w-3.5" />
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* Dashboard + collapse */}
          <div className="flex items-center justify-between border-b border-border">
            <button onClick={() => { setShowDashboard(true); setSelectedTable(null); setCreatingRecord(false); setEditingRecord(null); }} className={`flex items-center gap-2 px-3 py-2.5 text-sm transition-colors flex-1 whitespace-nowrap ${showDashboard ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
              <span>Go to Dashboard</span>
            </button>
            <button
              onClick={() => setCollapsed(true)}
              className="p-2 mr-1 rounded-md hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter tables..."
                className="w-full h-8 pl-8 pr-3 rounded-md bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Schema label */}
          <div className="flex items-center justify-between px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground font-medium whitespace-nowrap border-b border-border">
            <span>{activeSchema} · {showSkeleton ? '...' : `${filtered.length} tables`}</span>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1 rounded hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Refresh tables"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Table actions */}
          <div className="flex items-center gap-1 px-2 py-2 border-b border-border bg-card/50">
            <button
              onClick={() => setShowAddTableDialog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors w-full justify-center"
              title="Add new table"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Table</span>
            </button>
          </div>

          {/* Table list */}
          {showSkeleton ? (
            <TableListSkeleton />
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {filtered.map((table) => (
                <div
                  key={table.name}
                  className={`relative w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-hover transition-colors group whitespace-nowrap ${selectedTable?.name === table.name && !showDashboard ? "bg-primary/5 text-primary border-r-2 border-primary" : "text-foreground/80"}`}
                >
                  <button
                    onClick={() => handleTableClick(table)}
                    className="flex items-center gap-2 flex-1 min-w-0"
                  >
                    <Table2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="font-mono text-xs flex-1 text-left truncate">{table.name}</span>
                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded font-mono group-hover:opacity-0 transition-opacity">
                      {formatCount(table.rowCount)}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTable(table);
                      setShowDeleteTableDialog(true);
                    }}
                    className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    title={`Delete ${table.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Table Dialog */}
      <Dialog open={showAddTableDialog} onOpenChange={setShowAddTableDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New Table</DialogTitle>
            <DialogDescription>
              Define your table structure with columns and constraints
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4 py-4 px-1">
            <div className="space-y-2 px-1">
              <Label htmlFor="table-name" className="text-sm font-medium">Table Name</Label>
              <Input
                id="table-name"
                placeholder="e.g., users, products, orders"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-3 px-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Columns</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addColumn}
                  className="h-8 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Column
                </Button>
              </div>
              
              <div className="space-y-3">
                {columns.map((col, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg bg-card space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Column name"
                          value={col.name}
                          onChange={(e) => updateColumn(index, "name", e.target.value)}
                          className="h-9 text-sm font-mono"
                        />
                      </div>
                      <div className="flex-1">
                        <Select
                          value={col.type}
                          onValueChange={(value) => updateColumn(index, "type", value)}
                        >
                          <SelectTrigger className="h-9 text-sm font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="SERIAL" className="font-mono text-sm">SERIAL</SelectItem>
                            <SelectItem value="INTEGER" className="font-mono text-sm">INTEGER</SelectItem>
                            <SelectItem value="BIGINT" className="font-mono text-sm">BIGINT</SelectItem>
                            <SelectItem value="VARCHAR(255)" className="font-mono text-sm">VARCHAR(255)</SelectItem>
                            <SelectItem value="TEXT" className="font-mono text-sm">TEXT</SelectItem>
                            <SelectItem value="BOOLEAN" className="font-mono text-sm">BOOLEAN</SelectItem>
                            <SelectItem value="DATE" className="font-mono text-sm">DATE</SelectItem>
                            <SelectItem value="TIMESTAMP" className="font-mono text-sm">TIMESTAMP</SelectItem>
                            <SelectItem value="TIMESTAMPTZ" className="font-mono text-sm">TIMESTAMPTZ</SelectItem>
                            <SelectItem value="NUMERIC" className="font-mono text-sm">NUMERIC</SelectItem>
                            <SelectItem value="DECIMAL" className="font-mono text-sm">DECIMAL</SelectItem>
                            <SelectItem value="REAL" className="font-mono text-sm">REAL</SelectItem>
                            <SelectItem value="JSON" className="font-mono text-sm">JSON</SelectItem>
                            <SelectItem value="JSONB" className="font-mono text-sm">JSONB</SelectItem>
                            <SelectItem value="UUID" className="font-mono text-sm">UUID</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {columns.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeColumn(index)}
                          className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`pk-${index}`}
                          checked={col.primaryKey}
                          onCheckedChange={(checked) => {
                            updateColumn(index, "primaryKey", checked);
                            if (checked) {
                              updateColumn(index, "nullable", false);
                            }
                          }}
                        />
                        <label
                          htmlFor={`pk-${index}`}
                          className="text-xs font-medium cursor-pointer select-none"
                        >
                          Primary Key
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`nn-${index}`}
                          checked={!col.nullable}
                          disabled={col.primaryKey}
                          onCheckedChange={(checked) => updateColumn(index, "nullable", !checked)}
                        />
                        <label
                          htmlFor={`nn-${index}`}
                          className={`text-xs font-medium cursor-pointer select-none ${col.primaryKey ? 'opacity-50' : ''}`}
                        >
                          NOT NULL
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`uq-${index}`}
                          checked={col.unique}
                          disabled={col.primaryKey}
                          onCheckedChange={(checked) => updateColumn(index, "unique", checked)}
                        />
                        <label
                          htmlFor={`uq-${index}`}
                          className={`text-xs font-medium cursor-pointer select-none ${col.primaryKey ? 'opacity-50' : ''}`}
                        >
                          UNIQUE
                        </label>
                      </div>
                      
                      <div className="flex-1 min-w-[140px]">
                        <Input
                          placeholder="Default value"
                          value={col.defaultValue}
                          onChange={(e) => updateColumn(index, "defaultValue", e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddTableDialog(false);
                setNewTableName("");
                setColumns([{ name: "id", type: "SERIAL", nullable: false, primaryKey: true, unique: false, defaultValue: "" }]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddTable} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Create Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Table Dialog */}
      <AlertDialog open={showDeleteTableDialog} onOpenChange={setShowDeleteTableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the table <span className="font-mono font-semibold text-foreground">{selectedTable?.name}</span>?
              This action cannot be undone and will permanently delete all data in this table.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTable} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Table
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
