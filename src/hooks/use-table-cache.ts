import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { TableInfo } from "@/shared/types";

interface CachedTableData {
  tables: TableInfo[];
  schemas: string[];
}

export function useTableCache(connectionId: string | null, schema: string) {
  const queryClient = useQueryClient();

  // Query for table data with aggressive caching
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tables', connectionId, schema],
    queryFn: async (): Promise<CachedTableData> => {
      if (!connectionId) throw new Error('No connection ID');
      
      // Fetch schemas first
      const schemasResponse = await apiClient.getSchemas(connectionId);
      if (!schemasResponse.success || !schemasResponse.data) {
        throw new Error(schemasResponse.error || 'Failed to fetch schemas');
      }

      // Fetch tables for the specific schema
      const tablesResponse = await apiClient.getTables(connectionId, schema);
      if (!tablesResponse.success || !tablesResponse.data) {
        throw new Error(tablesResponse.error || 'Failed to fetch tables');
      }

      return {
        schemas: schemasResponse.data.schemas,
        tables: tablesResponse.data.tables
      };
    },
    enabled: !!connectionId,
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 30 * 60 * 1000, // 30 minutes - cache retention
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Changed to true so tables load when component mounts
  });

  // Prefetch tables for other schemas when we have a connection
  const prefetchSchema = async (targetSchema: string) => {
    if (!connectionId || targetSchema === schema) return;
    
    await queryClient.prefetchQuery({
      queryKey: ['tables', connectionId, targetSchema],
      queryFn: async (): Promise<CachedTableData> => {
        const tablesResponse = await apiClient.getTables(connectionId, targetSchema);
        if (!tablesResponse.success || !tablesResponse.data) {
          throw new Error(tablesResponse.error || 'Failed to fetch tables');
        }

        return {
          schemas: data?.schemas || [],
          tables: tablesResponse.data.tables
        };
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    });
  };

  // Get cached data for a specific connection/schema combination
  const getCachedTables = (connId: string, targetSchema: string): TableInfo[] | undefined => {
    const cachedData = queryClient.getQueryData<CachedTableData>(['tables', connId, targetSchema]);
    return cachedData?.tables;
  };

  // Check if data exists in cache
  const hasCachedData = (connId: string, targetSchema: string): boolean => {
    return queryClient.getQueryData(['tables', connId, targetSchema]) !== undefined;
  };

  // Invalidate cache for a connection
  const invalidateConnection = (connId: string) => {
    queryClient.invalidateQueries({
      queryKey: ['tables', connId],
    });
  };

  // Warm up cache for a connection by fetching all schemas
  const warmUpConnection = async (connId: string, schemas: string[]) => {
    const promises = schemas.map(targetSchema => 
      queryClient.prefetchQuery({
        queryKey: ['tables', connId, targetSchema],
        queryFn: async (): Promise<CachedTableData> => {
          const tablesResponse = await apiClient.getTables(connId, targetSchema);
          if (!tablesResponse.success || !tablesResponse.data) {
            throw new Error(tablesResponse.error || 'Failed to fetch tables');
          }

          return {
            schemas,
            tables: tablesResponse.data.tables
          };
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
      })
    );

    await Promise.allSettled(promises);
  };

  return {
    tables: data?.tables || [],
    schemas: data?.schemas || [],
    isLoading,
    error,
    refetch,
    prefetchSchema,
    getCachedTables,
    hasCachedData,
    invalidateConnection,
    warmUpConnection,
  };
}