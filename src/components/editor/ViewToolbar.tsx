// Toolbar for view mode with refresh, edit, and auto-refresh controls

import { RefreshCw, Edit, Download } from 'lucide-react';
import { useViews } from '@/contexts/ViewContext';
import { useConnection } from '@/contexts/ConnectionContext';
import { Button } from '@/components/ui/button';
import { createBlock } from '@/lib/queryBuilder';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CircularTimer } from './CircularTimer';
import { toast } from 'sonner';

export function ViewToolbar() {
  const { 
    currentView, 
    viewResults, 
    isLoading, 
    autoRefreshInterval, 
    setAutoRefresh, 
    refreshCurrentView,
    exitViewMode
  } = useViews();
  const { 
    setEditorMode, 
    setSqlText, 
    setQueryBlocks, 
    setShowDashboard,
    setSelectedTable,
    currentTables,
    activeSchema
  } = useConnection();

  const handleEditView = () => {
    if (!currentView) {
      console.log('[ViewToolbar] handleEditView: No current view');
      return;
    }

    console.log('[ViewToolbar] ========== EDIT VIEW STARTED ==========');
    console.log('[ViewToolbar] Current view:', {
      id: currentView.id,
      name: currentView.viewName,
      queryType: currentView.queryType,
      queryText: currentView.queryText,
      hasQueryBlocks: !!currentView.queryBlocks,
      queryBlocksValue: currentView.queryBlocks,
      schemaName: currentView.schemaName
    });

    // Load the view's query into the editor
    console.log('[ViewToolbar] Setting SQL text:', currentView.queryText);
    setSqlText(currentView.queryText);
    
    // Set the editor mode based on the view's query type
    console.log('[ViewToolbar] Setting editor mode:', currentView.queryType);
    setEditorMode(currentView.queryType);
    
    // Try to extract and select the table from the query
    try {
      // Parse table name from SQL query (handles various formats)
      const fromMatch = currentView.queryText.match(/FROM\s+(?:"?(\w+)"?\.)?(?:"?(\w+)"?)/i);
      if (fromMatch) {
        const tableName = fromMatch[2] || fromMatch[1];
        console.log('[ViewToolbar] Extracted table name from query:', tableName);
        
        // Find the table in current tables
        const table = currentTables.find(t => t.name === tableName);
        if (table) {
          console.log('[ViewToolbar] Found table in current tables:', table.name);
          setSelectedTable(table);
        } else {
          console.log('[ViewToolbar] Table not found in current tables. Available tables:', 
            currentTables.map(t => t.name));
          setSelectedTable(null);
        }
      } else {
        console.log('[ViewToolbar] Could not extract table name from query');
        setSelectedTable(null);
      }
    } catch (error) {
      console.error('[ViewToolbar] Error extracting table name:', error);
      setSelectedTable(null);
    }
    
    // Handle query blocks restoration
    if (currentView.queryType === 'visual' && currentView.queryBlocks) {
      // Visual mode with saved blocks - restore them
      try {
        console.log('[ViewToolbar] Visual mode: Parsing saved query blocks from JSON');
        const blocks = JSON.parse(currentView.queryBlocks);
        console.log('[ViewToolbar] Parsed blocks:', blocks);
        setQueryBlocks(blocks);
      } catch (error) {
        console.error('[ViewToolbar] Failed to parse query blocks:', error);
        console.log('[ViewToolbar] Falling back to SQL parsing');
        parseQueryToBlocks(currentView.queryText);
      }
    } else {
      // SQL mode OR visual mode without saved blocks - parse SQL to create blocks
      console.log('[ViewToolbar] Parsing SQL to create query blocks');
      parseQueryToBlocks(currentView.queryText);
    }
    
    // Exit view mode and show the editor (not dashboard)
    console.log('[ViewToolbar] Exiting view mode');
    exitViewMode();
    console.log('[ViewToolbar] Hiding dashboard');
    setShowDashboard(false);
    
    console.log('[ViewToolbar] ========== EDIT VIEW COMPLETED ==========');
    toast.info(`View loaded in ${currentView.queryType === 'visual' ? 'visual builder' : 'SQL editor'} - ready to execute`);
  };

  const parseQueryToBlocks = (queryText: string) => {
    try {
      const fromMatch = queryText.match(/FROM\s+(?:"?(\w+)"?\.)?(?:"?(\w+)"?)/i);
      if (!fromMatch) {
        console.log('[ViewToolbar] Could not parse query, using empty blocks');
        setQueryBlocks([createBlock("from", { table: "" })]);
        return;
      }

      const tableName = fromMatch[2] || fromMatch[1];
      console.log('[ViewToolbar] Creating FROM block with table:', tableName);
      
      const blocks: any[] = [createBlock("from", { table: tableName })];
      
      // Try to extract selected columns
      const selectMatch = queryText.match(/SELECT\s+(.*?)\s+FROM/is);
      let columns: string[] = [];
      
      if (selectMatch && selectMatch[1].trim() !== '*') {
        // Parse column names (remove quotes and clean up)
        columns = selectMatch[1]
          .split(',')
          .map(col => {
            // Remove quotes, trim, and extract just the column name (ignore aliases)
            const cleaned = col.trim().replace(/^"|"$/g, '').split(/\s+AS\s+/i)[0].trim();
            // Remove table prefix if present (e.g., "table"."column" -> column)
            return cleaned.replace(/^"?\w+"?\."?(\w+)"?$/, '$1').replace(/"/g, '');
          })
          .filter(col => col && !col.includes('(') && col !== '*');
        
        if (columns.length > 0) {
          console.log('[ViewToolbar] Extracted columns:', columns);
          blocks.push(createBlock("select", { columns }));
        }
      }
      
      // Try to extract WHERE conditions
      const whereMatch = queryText.match(/WHERE\s+(.*?)(?:ORDER BY|GROUP BY|LIMIT|$)/is);
      if (whereMatch) {
        const whereClause = whereMatch[1].trim();
        console.log('[ViewToolbar] Found WHERE clause:', whereClause);
        
        // Parse simple conditions (column operator value)
        const conditions = whereClause.split(/\s+AND\s+/i);
        conditions.forEach(condition => {
          const simpleMatch = condition.match(/"?(\w+)"?\s*(=|!=|>|<|>=|<=|LIKE|ILIKE)\s*'([^']+)'/i);
          if (simpleMatch) {
            const [, column, operator, value] = simpleMatch;
            console.log('[ViewToolbar] Adding filter:', { column, operator, value });
            blocks.push(createBlock("filter", { 
              column: column.replace(/"/g, ''), 
              operator: operator.toUpperCase(), 
              value 
            }));
          }
        });
      }
      
      // Try to extract ORDER BY
      const orderMatch = queryText.match(/ORDER BY\s+(.*?)(?:LIMIT|$)/is);
      if (orderMatch) {
        const orderClause = orderMatch[1].trim();
        const orderParts = orderClause.split(',')[0].trim(); // Take first order clause
        const orderMatch2 = orderParts.match(/"?(\w+)"?\s+(ASC|DESC)/i);
        if (orderMatch2) {
          const [, column, direction] = orderMatch2;
          console.log('[ViewToolbar] Adding sort:', { column, direction });
          blocks.push(createBlock("sort", { 
            column: column.replace(/"/g, ''), 
            direction: direction.toUpperCase() 
          }));
        }
      }
      
      // Try to extract LIMIT
      const limitMatch = queryText.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        const limit = parseInt(limitMatch[1]);
        console.log('[ViewToolbar] Adding limit:', limit);
        blocks.push(createBlock("limit", { limit }));
      }
      
      console.log('[ViewToolbar] Created blocks:', blocks);
      setQueryBlocks(blocks);
    } catch (error) {
      console.error('[ViewToolbar] Error parsing SQL to blocks:', error);
      setQueryBlocks([createBlock("from", { table: "" })]);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshCurrentView();
    } catch (error) {
      toast.error('Failed to refresh view');
    }
  };

  const handleExportCSV = () => {
    if (!viewResults) return;
    
    const header = viewResults.columns.join(",");
    const rows = viewResults.rows.map((r) => 
      viewResults.columns.map((c) => JSON.stringify(r[c] ?? "")).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentView?.viewName || 'view'}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const handleAutoRefreshChange = (value: string) => {
    const interval = parseInt(value, 10);
    setAutoRefresh(interval);
    
    if (interval > 0) {
      toast.success(`Auto-refresh enabled (${interval / 1000}s)`);
    } else {
      toast.info('Auto-refresh disabled');
    }
  };

  if (!currentView) return null;

  return (
    <div className="flex flex-col gap-2 px-2 sm:px-3 py-2 border-b border-border bg-card/50 flex-shrink-0">
      {/* Top row - View name and row details + time */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="text-sm sm:text-base font-bold text-foreground truncate">
            {currentView.viewName}
          </div>
          {currentView.description && (
            <div className="text-xs text-muted-foreground truncate hidden lg:block">
              {currentView.description}
            </div>
          )}
        </div>
        
        {viewResults && (
          <div className="text-xs sm:text-sm text-muted-foreground font-medium whitespace-nowrap flex-shrink-0">
            {viewResults.rowCount} rows • {viewResults.executionTime}ms
          </div>
        )}
      </div>

      {/* Bottom row - Action buttons spread across full width */}
      <div className="flex items-center justify-between gap-2 w-full">
        {/* Auto-refresh selector with timer */}
        <div className="flex items-center gap-2">
          {autoRefreshInterval > 0 ? (
            <CircularTimer
              duration={autoRefreshInterval}
              isActive={!isLoading}
              onComplete={handleRefresh}
              size={16}
              strokeWidth={2}
            />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/20" />
          )}
          <Select
            value={autoRefreshInterval.toString()}
            onValueChange={handleAutoRefreshChange}
          >
            <SelectTrigger className="h-8 sm:h-9 w-20 sm:w-24 text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Off</SelectItem>
              <SelectItem value="10000">10s</SelectItem>
              <SelectItem value="30000">30s</SelectItem>
              <SelectItem value="60000">1m</SelectItem>
              <SelectItem value="300000">5m</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* CSV Export button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!viewResults}
            className="h-8 sm:h-9 px-3 sm:px-4 text-xs font-medium"
            title="Export to CSV"
          >
            <Download className="h-4 w-4" />
          </Button>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 sm:h-9 px-3 sm:px-4 text-xs font-medium"
            title="Refresh view"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Edit button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditView}
            className="h-8 sm:h-9 px-3 sm:px-4 text-xs font-medium"
            title="Edit view"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}