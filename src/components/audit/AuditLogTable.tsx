import { useState } from 'react';
import type { AuditLog, AuditLogFilter } from '@/shared/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLogTableProps {
  logs: AuditLog[];
  total: number;
  filters: AuditLogFilter;
  onPageChange: (offset: number) => void;
  onRowClick: (log: AuditLog) => void;
  onExport: (format: 'csv' | 'json') => void;
}

export function AuditLogTable({ logs, total, filters, onPageChange, onRowClick, onExport }: AuditLogTableProps) {
  const [exportOpen, setExportOpen] = useState(false);
  
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      auth: 'text-blue-500',
      connection: 'text-purple-500',
      query: 'text-green-500',
      view: 'text-orange-500',
      data: 'text-pink-500',
      schema: 'text-cyan-500',
      system: 'text-gray-500',
    };
    return colors[category] || 'text-muted-foreground';
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold">Audit Logs</h2>
          <span className="text-xs text-muted-foreground">
            {total} {total === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(!exportOpen)}
            className="text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
          
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-lg shadow-xl z-50 py-1">
              <button
                onClick={() => { onExport('json'); setExportOpen(false); }}
                className="w-full px-3 py-2 text-xs text-left hover:bg-surface-hover"
              >
                Export as JSON
              </button>
              <button
                onClick={() => { onExport('csv'); setExportOpen(false); }}
                className="w-full px-3 py-2 text-xs text-left hover:bg-surface-hover"
              >
                Export as CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-secondary/50 z-10">
            <tr>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-12">Status</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-32">Time</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-24">Category</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-32">Action</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Description</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-32">Resource</th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground w-24">Duration</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                onClick={() => onRowClick(log)}
                className="border-t border-border hover:bg-surface-hover cursor-pointer transition-colors"
              >
                <td className="px-3 py-3">
                  {getStatusIcon(log.status)}
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {format(new Date(log.timestamp), 'MMM d, yyyy, h:mm:ss a')}
                </td>
                <td className="px-3 py-3">
                  <span className={`font-medium ${getCategoryColor(log.actionCategory)}`}>
                    {log.actionCategory}
                  </span>
                </td>
                <td className="px-3 py-3 font-mono text-muted-foreground">
                  {log.actionType}
                </td>
                <td className="px-3 py-3">
                  {truncateText(log.actionDescription, 80)}
                </td>
                <td className="px-3 py-3 font-mono text-muted-foreground">
                  {log.resourceName || log.tableName || log.databaseName || '—'}
                </td>
                <td className="px-3 py-3 text-right font-mono text-muted-foreground">
                  {log.executionTimeMs ? `${log.executionTimeMs}ms` : '—'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  No audit logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card/50">
          <div className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(offset - limit)}
              disabled={currentPage === 1}
              className="text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(offset + limit)}
              disabled={currentPage === totalPages}
              className="text-xs"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
