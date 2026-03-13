import type { AuditLogStats as Stats } from '@/shared/types';
import { CheckCircle2, XCircle, AlertTriangle, Activity } from 'lucide-react';

interface AuditLogStatsProps {
  stats: Stats;
}

export function AuditLogStats({ stats }: AuditLogStatsProps) {
  const totalLogs = stats?.totalLogs ?? 0;
  const successCount = stats?.successCount ?? 0;
  const errorCount = stats?.errorCount ?? 0;
  
  const errorRate = totalLogs > 0 
    ? ((errorCount / totalLogs) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="px-4 py-3">
      <div className="grid grid-cols-4 gap-4">
        {/* Total */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Logs</div>
            <div className="text-lg font-semibold">{totalLogs.toLocaleString()}</div>
          </div>
        </div>

        {/* Success */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Success</div>
            <div className="text-lg font-semibold">{successCount.toLocaleString()}</div>
          </div>
        </div>

        {/* Errors */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10">
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Errors</div>
            <div className="text-lg font-semibold">{errorCount.toLocaleString()}</div>
          </div>
        </div>

        {/* Error Rate */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Error Rate</div>
            <div className="text-lg font-semibold">{errorRate}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
