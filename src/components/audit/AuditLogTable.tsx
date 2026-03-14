import { useState } from 'react';
import type { AuditLog, AuditLogFilter } from '@/shared/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, CheckCircle2, XCircle, AlertTriangle, RotateCcw, Clock, User, Database } from 'lucide-react';
import { format } from 'date-fns';
import { AuditLogFilters } from './AuditLogFilters';

interface AuditLogTableProps {
  logs: AuditLog[];
  total: number;
  filters: AuditLogFilter;
  onPageChange: (offset: number) => void;
  onRowClick: (log: AuditLog) => void;
  onExport: (format: 'csv' | 'json') => void;
  onRefresh?: () => void;
  onFilterChange: (filters: Partial<AuditLogFilter>) => void;
}

export function AuditLogTable({ logs, total, filters, onPageChange, onRowClick, onExport, onRefresh, onFilterChange }: AuditLogTableProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const getStatusBadge = (status: string) => {
    const styles = {
      success: 'bg-green-500/10 text-green-600 border-green-500/20',
      error: 'bg-red-500/10 text-red-600 border-red-500/20',
      warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      auth: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      connection: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      query: 'bg-green-500/10 text-green-600 border-green-500/20',
      view: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      data: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
      schema: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
      system: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    };
    return colors[category] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Filters */}
      <div className="border-b border-border bg-gradient-to-b from-card to-card/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Audit Logs</h2>
              <p className="text-xs text-muted-foreground">
                {total} {total === 1 ? 'entry' : 'entries'} • Page {currentPage} of {totalPages}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs h-9 px-3 font-medium hover:bg-primary/5"
            >
              <RotateCcw className={`h-3.5 w-3.5 sm:mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportOpen(!exportOpen)}
                className="text-xs h-9 px-3 font-medium hover:bg-primary/5"
              >
                <Download className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              
              {exportOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-lg shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2">
                  <button
                    onClick={() => { onExport('json'); setExportOpen(false); }}
                    className="w-full px-4 py-2.5 text-xs text-left hover:bg-primary/5 transition-colors font-medium"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={() => { onExport('csv'); setExportOpen(false); }}
                    className="w-full px-4 py-2.5 text-xs text-left hover:bg-primary/5 transition-colors font-medium"
                  >
                    Export as CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="px-4 sm:px-6 pb-4">
          <AuditLogFilters
            filters={filters}
            onFilterChange={onFilterChange}
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block flex-1 overflow-auto scrollbar-thin">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm border-b border-border z-10">
            <tr>
              <th className="text-left px-4 py-3.5 font-semibold text-foreground bg-muted/50">Status</th>
              <th className="text-left px-4 py-3.5 font-semibold text-foreground bg-muted/50">User</th>
              <th className="text-left px-4 py-3.5 font-semibold text-foreground bg-muted/50">Time</th>
              <th className="text-left px-4 py-3.5 font-semibold text-foreground bg-muted/50">Category</th>
              <th className="text-left px-4 py-3.5 font-semibold text-foreground bg-muted/50">Action</th>
              <th className="text-left px-4 py-3.5 font-semibold text-foreground bg-muted/50">Description</th>
              <th className="text-left px-4 py-3.5 font-semibold text-foreground bg-muted/50">Resource</th>
              <th className="text-right px-4 py-3.5 font-semibold text-foreground bg-muted/50">Duration</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr
                key={log.id}
                onClick={() => onRowClick(log)}
                className={`border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-all group ${
                  index % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                }`}
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span className="text-xs truncate max-w-[150px]" title={log.userEmail}>
                      {log.userEmail}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-xs">{format(new Date(log.timestamp), 'MMM d, h:mm a')}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${getCategoryColor(log.actionCategory)}`}>
                    {log.actionCategory}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <code className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                    {log.actionType}
                  </code>
                </td>
                <td className="px-4 py-3.5 text-xs text-foreground/90 max-w-md">
                  {truncateText(log.actionDescription, 80)}
                </td>
                <td className="px-4 py-3.5">
                  <code className="text-xs font-mono text-muted-foreground">
                    {log.resourceName || log.tableName || log.databaseName || '—'}
                  </code>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                    {log.executionTimeMs ? `${log.executionTimeMs}ms` : '—'}
                  </span>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Database className="h-12 w-12 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground font-medium">No audit logs found</p>
                    <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex-1 overflow-auto scrollbar-thin px-3 py-4 space-y-3 bg-muted/20">
        {logs.map((log) => (
          <div
            key={log.id}
            onClick={() => onRowClick(log)}
            className="bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer space-y-3"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(log.status)}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${getCategoryColor(log.actionCategory)}`}>
                  {log.actionCategory}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Clock className="h-3 w-3" />
                <span>{format(new Date(log.timestamp), 'MMM d, h:mm a')}</span>
              </div>
            </div>

            {/* User */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/30 px-2.5 py-1.5 rounded-md">
                <User className="h-3 w-3" />
                <span className="font-medium">{log.userEmail}</span>
              </div>
            </div>

            {/* Action */}
            <div>
              <code className="text-xs font-mono text-primary bg-primary/5 px-2 py-1 rounded border border-primary/10">
                {log.actionType}
              </code>
            </div>

            {/* Description */}
            <p className="text-sm text-foreground/90 leading-relaxed">
              {log.actionDescription}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Database className="h-3 w-3" />
                <code className="font-mono">
                  {log.resourceName || log.tableName || log.databaseName || 'N/A'}
                </code>
              </div>
              {log.executionTimeMs && (
                <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                  {log.executionTimeMs}ms
                </span>
              )}
            </div>
          </div>
        ))}
        
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Database className="h-16 w-16 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground font-medium">No audit logs found</p>
            <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-border bg-card/50">
        <div className="text-xs text-muted-foreground font-medium">
          {total > 0 ? (
            <>Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} {total === 1 ? 'entry' : 'entries'}</>
          ) : (
            <>No entries</>
          )}
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(0)}
              disabled={currentPage === 1}
              className="text-xs h-9 px-3 font-medium"
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(offset - limit)}
              disabled={currentPage === 1}
              className="text-xs h-9 px-3 font-medium"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            
            <div className="flex items-center gap-1 px-3 py-1.5 bg-muted/50 rounded-md border border-border/50">
              <span className="text-xs font-semibold text-foreground">{currentPage}</span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs text-muted-foreground">{totalPages}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(offset + limit)}
              disabled={currentPage === totalPages}
              className="text-xs h-9 px-3 font-medium"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3.5 w-3.5 sm:ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange((totalPages - 1) * limit)}
              disabled={currentPage === totalPages}
              className="text-xs h-9 px-3 font-medium"
            >
              Last
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
