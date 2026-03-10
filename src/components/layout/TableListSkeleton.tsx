import { Skeleton } from "@/components/ui/skeleton";

export function TableListSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2">
          <Skeleton className="h-3.5 w-3.5 flex-shrink-0" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}

export function CollapsedTableListSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col items-center gap-0.5 w-full">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="w-8 h-8 rounded-md" />
      ))}
    </div>
  );
}