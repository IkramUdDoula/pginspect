import { useState, useEffect, useRef } from "react";
import { X, Key, Hash, Link2, Save, ArrowLeft, Trash2, Download } from "lucide-react";
import { useConnection } from "@/contexts/ConnectionContext";
import { useViews } from "@/contexts/ViewContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import html2canvas from "html2canvas";
import { ViewDetailsPanel } from "./ViewDetailsPanel";
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

export function RightInspector() {
  const { 
    selectedTable, 
    isInspectorOpen, 
    setIsInspectorOpen, 
    editingRecord, 
    setEditingRecord, 
    creatingRecord, 
    setCreatingRecord,
    activeConnection,
    activeSchema
  } = useConnection();
  const { isViewMode, currentView } = useViews();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const rowDetailsRef = useRef<HTMLDivElement>(null);

  // In view mode, always treat as read-only
  const isReadOnly = isViewMode && editingRecord;

  useEffect(() => {
    if (editingRecord) {
      setFormData({ ...editingRecord });
    } else if (creatingRecord && selectedTable) {
      // Initialize form with empty values for create mode
      const defaultData: Record<string, unknown> = {};
      selectedTable.columns.forEach(col => {
        // Initialize all non-auto-generated fields
        if (!col.isPrimaryKey || !col.defaultValue) {
          defaultData[col.name] = col.type === 'boolean' ? false : '';
        }
      });
      setFormData(defaultData);
    } else if (!editingRecord && !creatingRecord) {
      // Clear form when neither editing nor creating
      setFormData({});
    }
  }, [editingRecord, creatingRecord, selectedTable]);

  const isVisible = isInspectorOpen && (!!selectedTable || !!editingRecord || isViewMode);
  const targetWidth = isVisible ? (editingRecord || creatingRecord ? 320 : 288) : 0;

  const formatCell = (value: unknown): string => {
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const formatSize = (bytes: number) => {
    const kb = bytes / 1024;
    if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${kb.toFixed(1)} KB`;
  };

  const handleSave = async () => {
    if (!activeConnection?.id || !selectedTable) {
      toast.error("No active connection or table selected");
      return;
    }

    setIsSaving(true);
    try {
      if (editingRecord) {
        // Build WHERE clause from primary key(s)
        const where: Record<string, unknown> = {};
        selectedTable.columns
          .filter(col => col.isPrimaryKey)
          .forEach(col => {
            where[col.name] = editingRecord[col.name];
          });

        if (Object.keys(where).length === 0) {
          toast.error("Cannot update: no primary key found");
          return;
        }

        // Build data object (exclude primary keys)
        const data: Record<string, unknown> = {};
        Object.keys(formData).forEach(key => {
          const col = selectedTable.columns.find(c => c.name === key);
          if (col && !col.isPrimaryKey) {
            data[key] = formData[key];
          }
        });

        console.log('=== UPDATE RECORD ===');
        console.log('Table:', `${activeSchema}.${selectedTable.name}`);
        console.log('WHERE:', where);
        console.log('Data:', data);

        const response = await apiClient.updateData(
          activeConnection.id,
          activeSchema,
          selectedTable.name,
          where,
          data
        );

        console.log('Update response:', response);

        if (response.success) {
          console.log('✓ Record updated successfully');
          toast.success(`Record updated successfully`);
          setEditingRecord(null);
        } else {
          console.error('✗ Update failed:', response.error);
          toast.error(response.error || "Failed to update record");
        }
      } else if (creatingRecord) {
        // Prepare data for insert (exclude auto-generated primary keys)
        const data: Record<string, unknown> = {};
        Object.keys(formData).forEach(key => {
          const col = selectedTable.columns.find(c => c.name === key);
          // Skip auto-generated primary keys
          if (col && !(col.isPrimaryKey && col.defaultValue)) {
            const value = formData[key];
            // Only include non-empty values or explicitly set values
            if (value !== '' && value !== null && value !== undefined) {
              data[key] = value;
            } else if (col.nullable) {
              data[key] = null;
            }
          }
        });

        console.log('=== CREATE RECORD ===');
        console.log('Table:', `${activeSchema}.${selectedTable.name}`);
        console.log('Data:', data);

        const response = await apiClient.insertData(
          activeConnection.id,
          activeSchema,
          selectedTable.name,
          data
        );

        console.log('Insert response:', response);

        if (response.success) {
          console.log('✓ Record created successfully');
          if (response.data && 'row' in response.data) {
            console.log('Created row:', response.data.row);
          }
          toast.success(`Record created successfully`);
          // Reset form for next create
          const defaultData: Record<string, unknown> = {};
          selectedTable.columns.forEach(col => {
            if (!col.isPrimaryKey || !col.defaultValue) {
              defaultData[col.name] = col.type === 'boolean' ? false : '';
            }
          });
          setFormData(defaultData);
        } else {
          console.error('✗ Insert failed:', response.error);
          toast.error(response.error || "Failed to create record");
        }
      }
    } catch (error) {
      console.error('✗ Operation exception:', error);
      toast.error(error instanceof Error ? error.message : "Operation failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (colName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [colName]: value }));
  };

  const handleDownloadRowSnapshot = async () => {
    if (!editingRecord || !rowDetailsRef.current) return;
    
    setIsDownloading(true);
    try {
      // Capture the row details panel as canvas
      const canvas = await html2canvas(rowDetailsRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2, // Higher quality
        logging: false,
        windowWidth: rowDetailsRef.current.scrollWidth,
        windowHeight: rowDetailsRef.current.scrollHeight,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to generate snapshot');
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const name = isViewMode && currentView ? currentView.viewName : selectedTable?.name || 'row';
        a.download = `${name}_row_snapshot_${timestamp}_${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success('Row snapshot downloaded');
      });
    } catch (error) {
      console.error('Failed to download snapshot:', error);
      toast.error('Failed to download snapshot');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingRecord || !activeConnection?.id || !selectedTable) {
      return;
    }

    setIsSaving(true);
    try {
      // Build WHERE clause from primary key(s)
      const where: Record<string, unknown> = {};
      selectedTable.columns
        .filter(col => col.isPrimaryKey)
        .forEach(col => {
          where[col.name] = editingRecord[col.name];
        });

      if (Object.keys(where).length === 0) {
        toast.error("Cannot delete: no primary key found");
        return;
      }

      console.log('=== DELETE RECORD ===');
      console.log('Table:', `${activeSchema}.${selectedTable.name}`);
      console.log('WHERE:', where);

      const response = await apiClient.deleteData(
        activeConnection.id,
        activeSchema,
        selectedTable.name,
        where
      );

      console.log('Delete response:', response);

      if (response.success) {
        console.log('✓ Record deleted successfully');
        toast.success("Record deleted successfully");
        setEditingRecord(null);
        setShowDeleteDialog(false);
      } else {
        console.error('✗ Delete failed:', response.error);
        toast.error(response.error || "Failed to delete record");
      }
    } catch (error) {
      console.error('✗ Delete exception:', error);
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <aside
      className="border-l border-border bg-card/30 flex flex-col flex-shrink-0 h-full overflow-hidden transition-all duration-300 ease-in-out"
      style={{ width: targetWidth }}
    >
      {/* Show ViewDetailsPanel when in view mode with no row selected */}
      {isViewMode && !editingRecord ? (
        <ViewDetailsPanel />
      ) : (selectedTable || editingRecord) ? (
        <div className="flex flex-col h-full min-w-[288px]">
          {isReadOnly ? (
            <>
              {/* Read-only view mode */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditingRecord(null); }} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h3 className="text-sm font-semibold">Row Details</h3>
                    <p className="text-xs text-muted-foreground">{isViewMode ? 'View mode' : 'Read-only'}</p>
                  </div>
                </div>
                <button onClick={() => { setEditingRecord(null); setIsInspectorOpen(false); }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div ref={rowDetailsRef} className="flex-1 overflow-y-auto scrollbar-thin bg-card">
                {/* Header for snapshot */}
                <div className="px-4 py-3 border-b border-border bg-card/50">
                  <div className="text-xs font-semibold text-foreground mb-1">
                    {isViewMode && currentView ? currentView.viewName : selectedTable?.name || 'Row Details'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Snapshot: {new Date().toLocaleString()}
                  </div>
                </div>
                
                {/* Row data */}
                <div className="p-3 space-y-2">
                  {Object.entries(editingRecord || {}).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs text-muted-foreground font-mono">{key}</label>
                      <div className={`px-2 py-1.5 text-xs font-mono ${
                        value === null || value === undefined ? 'text-muted-foreground/40 italic' : 'text-foreground/90'
                      }`}>
                        {formatCell(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download button for row snapshot */}
              <div className="p-3 border-t border-border">
                <Button
                  onClick={handleDownloadRowSnapshot}
                  disabled={isDownloading}
                  className="w-full h-9 text-xs"
                  variant="outline"
                >
                  <Download className="h-3.5 w-3.5 mr-2" />
                  {isDownloading ? 'Generating...' : 'Download Row Snapshot'}
                </Button>
              </div>
            </>
          ) : editingRecord || creatingRecord ? (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditingRecord(null); setCreatingRecord(false); }} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h3 className="text-sm font-semibold">{editingRecord ? "Edit Record" : "Create Record"}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{selectedTable.name}</p>
                  </div>
                </div>
                <button onClick={() => { setEditingRecord(null); setCreatingRecord(false); setIsInspectorOpen(false); }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
                {selectedTable.columns.map((col) => {
                  const value = formData[col.name];
                  const isPk = col.isPrimaryKey;
                  const isAutoGen = isPk && col.defaultValue && creatingRecord;
                  // Check if column has a foreign key reference
                  const hasForeignKey = selectedTable.foreignKeys.some(fk => fk.column === col.name);
                  return (
                    <div key={col.name} className="space-y-1">
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {isPk ? <Key className="h-3 w-3 text-primary" /> : hasForeignKey ? <Link2 className="h-3 w-3 text-accent" /> : <Hash className="h-3 w-3 text-muted-foreground/50" />}
                        <span className="font-mono">{col.name}</span>
                        <span className="text-[10px] bg-secondary px-1 py-0.5 rounded">{col.type}</span>
                        {!col.nullable && !col.defaultValue && !isPk && creatingRecord && (
                          <span className="text-[9px] text-destructive font-medium">required</span>
                        )}
                      </label>
                      {isAutoGen ? (
                        <div className="h-8 px-2 flex items-center rounded bg-secondary/50 border border-border text-xs text-muted-foreground font-mono">
                          auto-generated
                        </div>
                      ) : col.type === "boolean" ? (
                        <div className="flex items-center gap-2">
                          <Switch checked={Boolean(value)} onCheckedChange={(checked) => handleFieldChange(col.name, checked)} disabled={isPk && !!editingRecord} />
                          <span className="text-xs text-muted-foreground">{value ? "true" : "false"}</span>
                        </div>
                      ) : (
                        <Input
                          value={value === null || value === undefined ? "" : String(value)}
                          onChange={(e) => handleFieldChange(col.name, e.target.value)}
                          disabled={isPk && !!editingRecord}
                          className="h-8 text-xs font-mono bg-background"
                          placeholder={col.nullable ? "NULL" : col.defaultValue ? `Default: ${col.defaultValue}` : ""}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-3 border-t border-border flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => { setEditingRecord(null); setCreatingRecord(false); }} disabled={isSaving}>Cancel</Button>
                {editingRecord && (
                  <Button variant="destructive" size="sm" className="text-xs" onClick={() => setShowDeleteDialog(true)} disabled={isSaving}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button size="sm" className="flex-1 text-xs" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-3.5 w-3.5 mr-1" /> {isSaving ? "Saving..." : editingRecord ? "Update" : "Create"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold font-mono">{selectedTable.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedTable.rowCount.toLocaleString()} rows · {formatSize(selectedTable.sizeBytes)}</p>
                </div>
                <button onClick={() => setIsInspectorOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="p-3">
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">Columns ({selectedTable.columns.length})</h4>
                  <div className="space-y-1">
                    {selectedTable.columns.map((col) => {
                      const hasForeignKey = selectedTable.foreignKeys.some(fk => fk.column === col.name);
                      return (
                        <div key={col.name} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-hover text-xs group">
                          {col.isPrimaryKey ? <Key className="h-3 w-3 text-primary flex-shrink-0" /> : hasForeignKey ? <Link2 className="h-3 w-3 text-accent flex-shrink-0" /> : <Hash className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                          <span className="font-mono flex-1 truncate">{col.name}</span>
                          <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{col.type}</span>
                          {col.nullable && <span className="text-[10px] text-muted-foreground/60">null</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedTable.indexes.length > 0 && (
                  <div className="p-3 border-t border-border">
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">Indexes ({selectedTable.indexes.length})</h4>
                    <div className="space-y-1">
                      {selectedTable.indexes.map((idx) => (
                        <div key={idx.name} className="px-2 py-1.5 rounded hover:bg-surface-hover text-xs">
                          <div className="font-mono text-foreground/80">{idx.name}</div>
                          <div className="text-muted-foreground">{idx.isUnique ? 'unique' : 'index'} ({idx.columns.join(", ")})</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTable.foreignKeys.length > 0 && (
                  <div className="p-3 border-t border-border">
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">Foreign Keys ({selectedTable.foreignKeys.length})</h4>
                    <div className="space-y-1">
                      {selectedTable.foreignKeys.map((fk, i) => (
                        <div key={i} className="px-2 py-1.5 rounded hover:bg-surface-hover text-xs">
                          <span className="font-mono text-accent">{fk.column}</span>
                          <span className="text-muted-foreground"> → </span>
                          <span className="font-mono text-foreground/80">{fk.referencedTable}.{fk.referencedColumn}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* Delete Record Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this record from <span className="font-mono font-semibold text-foreground">{selectedTable?.name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
