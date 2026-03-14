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
    <div className="px-3 sm:px-4 py-2.5 sm:py-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* Total */}
        <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
          <div className="p-1.5 rounded-md bg-blue-500/10 flex-shrink-0">
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs text-muted-foreground truncate font-medium">Total Logs</div>
            <div className="text-base sm:text-xl font-bold text-foreground truncate">{totalLogs.toLocaleString()}</div>
          </div>
        </div>

        {/* Success */}
        <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-green-500/5 border border-green-500/10">
          <div className="p-1.5 rounded-md bg-green-500/10 flex-shrink-0">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs text-muted-foreground truncate font-medium">Success</div>
            <div className="text-base sm:text-xl font-bold text-foreground truncate">{successCount.toLocaleString()}</div>
          </div>
        </div>

        {/* Errors */}
        <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-red-500/5 border border-red-500/10">
          <div className="p-1.5 rounded-md bg-red-500/10 flex-shrink-0">
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs text-muted-foreground truncate font-medium">Errors</div>
            <div className="text-base sm:text-xl font-bold text-foreground truncate">{errorCount.toLocaleString()}</div>
          </div>
        </div>

        {/* Error Rate */}
        <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
          <div className="p-1.5 rounded-md bg-yellow-500/10 flex-shrink-0">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs text-muted-foreground truncate font-medium">Error Rate</div>
            <div className="text-base sm:text-xl font-bold text-foreground truncate">{errorRate}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
