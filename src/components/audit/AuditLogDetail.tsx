import type { AuditLog } from '@/shared/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface AuditLogDetailProps {
  log: AuditLog;
  open: boolean;
  onClose: () => void;
}

export function AuditLogDetail({ log, open, onClose }: AuditLogDetailProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const DetailRow = ({ label, value }: { label: string; value: string | number | undefined | null }) => {
    if (!value) return null;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-2 border-b border-border">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="col-span-1 sm:col-span-2 text-xs font-mono break-all">{value}</div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[85vh] overflow-y-auto scrollbar-thin p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            {getStatusIcon(log.status)}
            <span>Audit Log Details</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {/* Basic Info */}
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-semibold">Basic Information</h3>
            <div className="bg-secondary/30 rounded-lg p-2 sm:p-3 space-y-0">
              <DetailRow label="ID" value={log.id} />
              <DetailRow label="Timestamp" value={format(new Date(log.timestamp), 'PPpp')} />
              <DetailRow label="User Email" value={log.userEmail} />
              <DetailRow label="User Name" value={log.userName} />
              <DetailRow label="Action Type" value={log.actionType} />
              <DetailRow label="Category" value={log.actionCategory} />
              <DetailRow label="Status" value={log.status} />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-semibold">Description</h3>
            <div className="bg-secondary/30 rounded-lg p-2 sm:p-3">
              <p className="text-xs break-words">{log.actionDescription}</p>
            </div>
          </div>

          {/* Resource Info */}
          {(log.connectionName || log.databaseName || log.schemaName || log.tableName || log.resourceName) && (
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-semibold">Resource Information</h3>
              <div className="bg-secondary/30 rounded-lg p-2 sm:p-3 space-y-0">
                <DetailRow label="Connection" value={log.connectionName} />
                <DetailRow label="Database" value={log.databaseName} />
                <DetailRow label="Schema" value={log.schemaName} />
                <DetailRow label="Table" value={log.tableName} />
                <DetailRow label="Resource Type" value={log.resourceType} />
                <DetailRow label="Resource Name" value={log.resourceName} />
                <DetailRow label="Resource ID" value={log.resourceId} />
              </div>
            </div>
          )}

          {/* Query Info */}
          {log.queryText && (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-semibold">Query</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(log.queryText!)}
                  className="h-6 sm:h-7 text-xs px-2"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Copy</span>
                </Button>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2 sm:p-3 max-h-48 overflow-y-auto scrollbar-thin">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">{log.queryText}</pre>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2 sm:p-3 space-y-0 mt-2">
                <DetailRow label="Query Type" value={log.queryType} />
                <DetailRow label="Rows Affected" value={log.rowsAffected} />
                <DetailRow label="Execution Time" value={log.executionTimeMs ? `${log.executionTimeMs}ms` : undefined} />
              </div>
            </div>
          )}

          {/* Error Info */}
          {log.errorMessage && (
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-semibold text-red-500">Error Message</h3>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 sm:p-3 max-h-32 overflow-y-auto scrollbar-thin">
                <p className="text-xs text-red-500 break-words">{log.errorMessage}</p>
              </div>
            </div>
          )}

          {/* Request Metadata */}
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-semibold">Request Metadata</h3>
            <div className="bg-secondary/30 rounded-lg p-2 sm:p-3 space-y-0">
              <DetailRow label="IP Address" value={log.ipAddress} />
              <DetailRow label="User Agent" value={log.userAgent} />
              <DetailRow label="Request ID" value={log.requestId} />
            </div>
          </div>

          {/* Additional Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-semibold">Additional Metadata</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(log.metadata, null, 2))}
                  className="h-6 sm:h-7 text-xs px-2"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Copy</span>
                </Button>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2 sm:p-3 max-h-48 overflow-y-auto scrollbar-thin">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
