// Views list component for the sidebar

import { useState } from 'react';
import { Eye, MoreVertical, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useViews } from '@/contexts/ViewContext';
import { useConnection } from '@/contexts/ConnectionContext';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import type { SavedView } from '@/shared/types';

interface ViewsListProps {
  collapsed: boolean;
}

export function ViewsList({ collapsed }: ViewsListProps) {
  const { views, isLoading, executeView, deleteView, updateView, loadViews } = useViews();
  const { activeConnection } = useConnection();
  const [deleteDialogView, setDeleteDialogView] = useState<SavedView | null>(null);
  const [renameDialogView, setRenameDialogView] = useState<SavedView | null>(null);
  const [newViewName, setNewViewName] = useState('');
  const [newViewDescription, setNewViewDescription] = useState('');

  const handleViewClick = async (view: SavedView) => {
    try {
      await executeView(view.id);
    } catch (error) {
      toast.error('Failed to execute view');
    }
  };

  const handleRefresh = async () => {
    if (activeConnection?.id) {
      let connectionId: number | null = null;
      
      if (activeConnection.id.startsWith('saved_')) {
        // Saved connection - extract numeric ID
        connectionId = parseInt(activeConnection.id.replace('saved_', ''), 10);
      } else if (activeConnection.savedConnectionId) {
        // Runtime connection with saved connection ID
        connectionId = activeConnection.savedConnectionId;
      }
      
      if (connectionId && !isNaN(connectionId)) {
        await loadViews(connectionId);
      }
    }
  };

  const handleRename = async () => {
    if (!renameDialogView || !newViewName.trim()) {
      toast.error('View name is required');
      return;
    }

    try {
      const updated = await updateView(renameDialogView.id, {
        viewName: newViewName.trim(),
        description: newViewDescription.trim() || undefined,
      });

      if (updated) {
        toast.success('View renamed successfully');
        setRenameDialogView(null);
        setNewViewName('');
        setNewViewDescription('');
      }
    } catch (error) {
      toast.error('Failed to rename view');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialogView) return;

    try {
      const success = await deleteView(deleteDialogView.id);
      if (success) {
        toast.success('View deleted successfully');
        setDeleteDialogView(null);
      }
    } catch (error) {
      toast.error('Failed to delete view');
    }
  };

  const openRenameDialog = (view: SavedView) => {
    setRenameDialogView(view);
    setNewViewName(view.viewName);
    setNewViewDescription(view.description || '');
  };

  if (collapsed) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col items-center gap-0.5 w-full">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => handleViewClick(view)}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-hover transition-colors text-muted-foreground"
            title={`${view.viewName}${view.description ? ` - ${view.description}` : ''}`}
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    );
  }

  if (views.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Eye className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-sm font-medium text-foreground mb-2">No saved views</h3>
        <p className="text-xs text-muted-foreground mb-4 max-w-[180px] leading-relaxed">
          Create your first view by writing a query and clicking "Save as View"
        </p>
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
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {views.map((view) => (
          <div
            key={view.id}
            className="relative w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-hover transition-colors group whitespace-nowrap"
          >
            <button
              onClick={() => handleViewClick(view)}
              className="flex items-center gap-2 flex-1 min-w-0"
            >
              <Eye className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <div className="font-mono text-xs truncate text-foreground/80">
                  {view.viewName}
                </div>
                {view.description && (
                  <div className="text-[10px] text-muted-foreground truncate">
                    {view.description}
                  </div>
                )}
              </div>
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-surface-hover text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => openRenameDialog(view)}>
                  <Edit className="h-3.5 w-3.5 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDeleteDialogView(view)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Rename Dialog */}
      <Dialog open={!!renameDialogView} onOpenChange={() => setRenameDialogView(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename View</DialogTitle>
            <DialogDescription>
              Update the name and description for this view
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="view-name" className="text-sm font-medium">
                View Name
              </Label>
              <Input
                id="view-name"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="Enter view name"
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="view-description" className="text-sm font-medium">
                Description (optional)
              </Label>
              <Textarea
                id="view-description"
                value={newViewDescription}
                onChange={(e) => setNewViewDescription(e.target.value)}
                placeholder="Enter view description"
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogView(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteDialogView} onOpenChange={() => setDeleteDialogView(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete View</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the view{' '}
              <span className="font-mono font-semibold text-foreground">
                {deleteDialogView?.viewName}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete View
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}