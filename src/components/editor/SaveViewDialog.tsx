// Dialog for saving queries as views

import { useState } from 'react';
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

interface SaveViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveViewDialog({ open, onOpenChange }: SaveViewDialogProps) {
  const { activeConnection, activeSchema, sqlText, editorMode } = useConnection();
  const { createView } = useViews();
  const [viewName, setViewName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    console.log('=== SaveViewDialog: handleSave called ===');
    console.log('SaveViewDialog: viewName =', viewName);
    console.log('SaveViewDialog: description =', description);
    console.log('SaveViewDialog: sqlText =', sqlText);
    console.log('SaveViewDialog: activeConnection =', activeConnection);
    console.log('SaveViewDialog: activeSchema =', activeSchema);
    console.log('SaveViewDialog: editorMode =', editorMode);

    if (!viewName.trim()) {
      console.log('SaveViewDialog: ERROR - View name is empty');
      toast.error('View name is required');
      return;
    }

    if (!sqlText.trim()) {
      console.log('SaveViewDialog: ERROR - SQL text is empty');
      toast.error('Query text is required');
      return;
    }

    if (!activeConnection?.id || !activeSchema) {
      console.log('SaveViewDialog: ERROR - No active connection or schema');
      console.log('SaveViewDialog: activeConnection?.id =', activeConnection?.id);
      console.log('SaveViewDialog: activeSchema =', activeSchema);
      toast.error('No active connection or schema');
      return;
    }

    let connectionId: number;
    
    console.log('SaveViewDialog: Checking connection ID format...');
    console.log('SaveViewDialog: activeConnection.id =', activeConnection.id);
    console.log('SaveViewDialog: activeConnection.savedConnectionId =', activeConnection.savedConnectionId);
    
    if (activeConnection.id.startsWith('saved_')) {
      // This is a saved connection, extract the numeric ID
      const rawId = activeConnection.id.replace('saved_', '');
      console.log('SaveViewDialog: Extracted raw ID =', rawId);
      connectionId = parseInt(rawId, 10);
      console.log('SaveViewDialog: Parsed connectionId =', connectionId);
    } else if (activeConnection.savedConnectionId) {
      // This is a runtime connection but we have the saved connection ID
      connectionId = activeConnection.savedConnectionId;
      console.log('SaveViewDialog: Using savedConnectionId =', connectionId);
    } else {
      // This is a runtime connection without a saved connection ID
      console.log('SaveViewDialog: ERROR - Runtime connection without saved ID');
      toast.error('Connection must be saved before creating views. Please reconnect to save the connection.');
      return;
    }
    
    if (isNaN(connectionId)) {
      console.log('SaveViewDialog: ERROR - connectionId is NaN');
      console.log('SaveViewDialog: Original activeConnection.id =', activeConnection.id);
      toast.error(`Invalid connection ID: ${activeConnection.id}`);
      return;
    }

    console.log('SaveViewDialog: Creating view data object...');
    const viewData = {
      connectionId,
      schemaName: activeSchema,
      viewName: viewName.trim(),
      description: description.trim() || undefined,
      queryText: sqlText.trim(),
      queryType: editorMode as 'sql' | 'visual',
    };
    console.log('SaveViewDialog: viewData =', viewData);

    setIsLoading(true);
    console.log('SaveViewDialog: Set loading to true, calling createView...');

    try {
      const savedView = await createView(viewData);
      console.log('SaveViewDialog: createView response =', savedView);

      if (savedView) {
        console.log('SaveViewDialog: SUCCESS - View saved successfully');
        toast.success('View saved successfully');
        handleClose();
      } else {
        console.log('SaveViewDialog: ERROR - createView returned null/false');
        toast.error('Failed to save view - no response from server');
      }
    } catch (error) {
      console.log('SaveViewDialog: ERROR - Exception in createView');
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
    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as View</DialogTitle>
          <DialogDescription>
            Save your current query as a reusable view for quick access later
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
            <Label className="text-sm font-medium">Query Preview</Label>
            <div className="p-3 bg-muted rounded-md border">
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                {sqlText || 'No query text'}
              </pre>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Connection: <span className="font-mono">{activeConnection?.name}</span></span>
            <span>Schema: <span className="font-mono">{activeSchema}</span></span>
            <span>Type: <span className="font-mono">{editorMode}</span></span>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save View'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}