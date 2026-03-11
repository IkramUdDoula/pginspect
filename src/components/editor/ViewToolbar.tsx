// Toolbar for view mode with refresh, edit, and auto-refresh controls

import { useState } from 'react';
import { RefreshCw, Edit, Clock } from 'lucide-react';
import { useViews } from '@/contexts/ViewContext';
import { useConnection } from '@/contexts/ConnectionContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const { setEditorMode, setSqlText } = useConnection();

  const handleEditView = () => {
    if (!currentView) return;

    // Load the view's query into the editor
    setSqlText(currentView.queryText);
    setEditorMode(currentView.queryType);
    
    // Exit view mode to show the editor
    exitViewMode();
    
    toast.info('View loaded in editor for editing');
  };

  const handleRefresh = async () => {
    try {
      await refreshCurrentView();
    } catch (error) {
      toast.error('Failed to refresh view');
    }
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

  const getAutoRefreshLabel = (interval: number) => {
    if (interval === 0) return 'Off';
    if (interval < 60000) return `${interval / 1000}s`;
    return `${interval / 60000}m`;
  };

  if (!currentView) return null;

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card/50 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-foreground">
            {currentView.viewName}
          </div>
          {currentView.description && (
            <div className="text-xs text-muted-foreground">
              {currentView.description}
            </div>
          )}
        </div>
        
        {viewResults && (
          <div className="text-xs text-muted-foreground">
            {viewResults.rowCount} rows • {viewResults.executionTime}ms
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Auto-refresh selector */}
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <Select
            value={autoRefreshInterval.toString()}
            onValueChange={handleAutoRefreshChange}
          >
            <SelectTrigger className="h-8 w-20 text-xs">
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

        {/* Refresh button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-8 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        {/* Edit button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleEditView}
          className="h-8 text-xs"
        >
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Edit View
        </Button>
      </div>
    </div>
  );
}