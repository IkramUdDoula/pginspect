import { useState, useEffect } from 'react';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { AuditLogFilters } from '@/components/audit/AuditLogFilters';
import { AuditLogStats } from '@/components/audit/AuditLogStats';
import { AuditLogDetail } from '@/components/audit/AuditLogDetail';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import type { AuditLog, AuditLogFilter, AuditLogStats as Stats } from '@/shared/types';
import { Loader2 } from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditLogFilter>({
    limit: 50,
    offset: 0,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const { toast } = useToast();

  // Fetch logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAuditLogs(filters);
      
      if (response.success && response.data) {
        setLogs(response.data.logs);
        setTotal(response.data.total);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to load audit logs',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await apiClient.getAuditStats();
      
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load audit stats', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<AuditLogFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
  };

  const handlePageChange = (offset: number) => {
    setFilters(prev => ({ ...prev, offset }));
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const blob = await apiClient.exportAuditLogs(filters, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Success',
        description: 'Audit logs exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export audit logs',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopNavbar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Filters Sidebar */}
        <div className="w-64 border-r border-border bg-card/50 overflow-y-auto scrollbar-thin">
          <AuditLogFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Stats */}
          {stats && (
            <div className="border-b border-border bg-card/30">
              <AuditLogStats stats={stats} />
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <AuditLogTable
                logs={logs}
                total={total}
                filters={filters}
                onPageChange={handlePageChange}
                onRowClick={setSelectedLog}
                onExport={handleExport}
              />
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <AuditLogDetail
          log={selectedLog}
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
