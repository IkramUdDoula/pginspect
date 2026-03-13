// Dialog for saving queries as views

import React, { useState } from 'react';
import { useConnection } from '@/contexts/ConnectionContext';
import { useViews } from '@/contexts/ViewContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ColumnFilter } from '@/shared/types';
import { appendFiltersToQuery, getFilterSummary } from '@/lib/filterToSQL';

interface SaveViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters?: Map<string, ColumnFilter>;
}

export function SaveViewDialog({ open, onOpenChange, filters }: SaveViewDialogProps) {
  const { activeConnection, activeSchema, sqlText, editorMode } = useConnection();
  const { createView } = useViews();
  
  const hasFilters = filters && filters.size > 0;
  
  const [viewName, setViewName] = useState('');
  const [description, setDescription] = useState('');
  const [includeFilters, setIncludeFilters] = useState(true);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setViewName('');
      setDescription('');
      setIncludeFilters(true);
      setAutoRefreshInterval(0);
    }
  }, [open]);
  
  // Generate query with filters if enabled
  const finalQuery = (includeFilters && hasFilters) 
    ? appendFiltersToQuery(sqlText, filters)
    : sqlText;

  const handleSave = async () => {
    console.log('=== SaveViewDialog: handleSave called ===');
    console.log('SaveViewDialog: viewName =', viewName);
    console.log('SaveViewDialog: description =', description);
    console.log('SaveViewDialog: finalQuery =', finalQuery);

    // Validation
    if (!viewName.trim()) {
      console.log('SaveViewDialog: ERROR - View name is empty');
      toast.error('View name is required');
      return;
    }

    if (!finalQuery.trim()) {
      console.log('SaveViewDialog: ERROR - SQL text is empty');
      toast.error('Query text is required');
      return;
    }

    if (!activeConnection?.id || !activeSchema) {
      console.log('SaveViewDialog: ERROR - No active connection or schema');
      toast.error('No active connection or schema');
      return;
    }

    setIsLoading(true);

    try {
      // Create new view
      let connectionId: number;
      
      console.log('SaveViewDialog: Checking connection ID format...');
      
      if (activeConnection.id.startsWith('saved_')) {
        const rawId = activeConnection.id.replace('saved_', '');
        connectionId = parseInt(rawId, 10);
      } else if (activeConnection.savedConnectionId) {
        connectionId = activeConnection.savedConnectionId;
      } else {
        console.log('SaveViewDialog: ERROR - Runtime connection without saved ID');
        toast.error('Connection must be saved before creating views. Please reconnect to save the connection.');
        return;
      }
      
      if (isNaN(connectionId)) {
        console.log('SaveViewDialog: ERROR - connectionId is NaN');
        toast.error(`Invalid connection ID: ${activeConnection.id}`);
        return;
      }

      console.log('SaveViewDialog: Creating view data object...');
      const viewData = {
        connectionId,
        schemaName: activeSchema,
        viewName: viewName.trim(),
        description: description.trim() || undefined,
        queryText: finalQuery.trim(),
        queryType: editorMode as 'sql' | 'visual',
        autoRefreshInterval: autoRefreshInterval,
      };

      const savedView = await createView(viewData);

      if (savedView) {
        console.log('SaveViewDialog: SUCCESS - View saved successfully');
        toast.success('View saved successfully');
        handleClose();
      } else {
        console.log('SaveViewDialog: ERROR - createView returned null/false');
        toast.error('Failed to save view - no response from server');
      }
    } catch (error) {
      console.log('SaveViewDialog: ERROR - Exception in handleSave');
      console.error('SaveViewDialog: Exception details =', error);
      toast.error('Failed to save view');
    } finally {
      console.log('SaveViewDialog: Setting loading to false');
      setIsLoading(false);
    }
    
    console.log('=== SaveViewDialog: handleSave completed ===');
  };

  const handleClose = () => {
    setViewName('');
    setDescription('');
    setAutoRefreshInterval(0);
    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as View</DialogTitle>
          <DialogDescription>
            Save your current query as a new reusable view
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="view-name" className="text-sm font-medium">
              View Name *
            </Label>
            <Input
              id="view-name"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="Enter view name"
              className="font-mono"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="view-description" className="text-sm font-medium">
              Description (optional)
            </Label>
            <Textarea
              id="view-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this view does"
              className="min-h-[80px] resize-none"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auto-refresh" className="text-sm font-medium">
              Auto-Refresh Interval
            </Label>
            <Select
              value={autoRefreshInterval.toString()}
              onValueChange={(value) => setAutoRefreshInterval(parseInt(value, 10))}
              disabled={isLoading}
            >
              <SelectTrigger id="auto-refresh" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Off</SelectItem>
                <SelectItem value="10000">10 seconds</SelectItem>
                <SelectItem value="30000">30 seconds</SelectItem>
                <SelectItem value="60000">1 minute</SelectItem>
                <SelectItem value="300000">5 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-filters"
                  checked={includeFilters}
                  onCheckedChange={(checked) => setIncludeFilters(!!checked)}
                  disabled={isLoading}
                />
                <Label htmlFor="include-filters" className="text-sm font-medium cursor-pointer">
                  Include current filters ({filters.size})
                </Label>
              </div>
              {includeFilters && (
                <div className="pl-6 space-y-1">
                  {getFilterSummary(filters).map((summary, i) => (
                    <div key={i} className="text-xs text-muted-foreground font-mono">
                      • {summary}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Query Preview</Label>
            <div className="p-3 bg-muted rounded-md border max-h-48 overflow-y-auto scrollbar-thin">
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                {finalQuery || 'No query text'}
              </pre>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Connection: <span className="font-mono">{activeConnection?.name}</span></span>
            <span>Schema: <span className="font-mono">{activeSchema}</span></span>
            <span>Type: <span className="font-mono">{editorMode}</span></span>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? 'Saving...' : 'Save View'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}