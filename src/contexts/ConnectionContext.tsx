import React, { createContext, useContext, useState, useCallback } from "react";
import { flushSync } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import type { ConnectionInfo, SchemaState, TableInfo } from "@/shared/types";
import type { QueryBlock } from "@/lib/queryBuilder";
import { createBlock } from "@/lib/queryBuilder";
import { buildSQLFromBlocks } from "@/lib/queryBuilder";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
  isSimulated: boolean;
}

interface ConnectionContextType {
  connections: ConnectionInfo[];
  activeConnection: ConnectionInfo | null;
  schemaState: SchemaState | null;
  activeSchema: string;
  selectedTable: TableInfo | null;
  queryBlocks: QueryBlock[];
  sqlText: string;
  queryResult: QueryResult | null;
  editorMode: "visual" | "sql";
  isLoading: boolean;
  
  isInspectorOpen: boolean;
  showDashboard: boolean;
  showAudit: boolean;
  isConnectionManagerOpen: boolean;
  editingRecord: Record<string, unknown> | null;
  creatingRecord: boolean;
  isInitialLoad: boolean;
  addConnection: (conn: ConnectionInfo) => Promise<void>;
  setActiveConnection: (name: string) => void;
  removeConnection: (name: string) => Promise<void>;
  setActiveSchema: (schema: string) => Promise<void>;
  setSelectedTable: (table: TableInfo | null) => void;
  setQueryBlocks: React.Dispatch<React.SetStateAction<QueryBlock[]>>;
  setSqlText: (sql: string) => void;
  setQueryResult: (result: QueryResult | null) => void;
  setEditorMode: (mode: "visual" | "sql") => void;
  
  setIsInspectorOpen: (open: boolean) => void;
  setShowDashboard: (show: boolean) => void;
  setShowAudit: (show: boolean) => void;
  setIsConnectionManagerOpen: (open: boolean) => void;
  setEditingRecord: (record: Record<string, unknown> | null) => void;
  setCreatingRecord: (creating: boolean) => void;
  runQuery: () => Promise<void>;
  currentTables: TableInfo[];
}

const ConnectionContext = createContext<ConnectionContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error("useConnection must be used within ConnectionProvider");
  return ctx;
}

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { isSignedIn, isLoaded } = useAuth();
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [activeConnection, setActiveConn] = useState<ConnectionInfo | null>(null);
  const [schemaState, setSchemaState] = useState<SchemaState | null>(null);
  const [activeSchema, setActiveSchemaState] = useState("public");
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [queryBlocks, setQueryBlocks] = useState<QueryBlock[]>([createBlock("from")]);
  const [sqlText, setSqlText] = useState("");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [editorMode, setEditorMode] = useState<"visual" | "sql">("visual");
  const [isLoading, setIsLoading] = useState(false);
  
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [showDashboard, setShowDashboard] = useState(true); // Start with dashboard visible
  const [showAudit, setShowAudit] = useState(false);
  const [isConnectionManagerOpen, setIsConnectionManagerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null);
  const [creatingRecord, setCreatingRecord] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Get cached tables for current connection/schema
  const getCachedTables = (): TableInfo[] => {
    if (!activeConnection?.id) return [];
    const cachedData = queryClient.getQueryData<{ tables: TableInfo[]; schemas: string[] }>(['tables', activeConnection.id, activeSchema]);
    return cachedData?.tables || [];
  };

  const currentTables = getCachedTables();

  // Load saved connections on mount (with retry for auth and localStorage cache)
  React.useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    const CACHE_KEY = 'dbexplorer_connections_cache';

    // Try to load from localStorage cache immediately
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { connections: cachedConnections, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        // Use cache if less than 5 minutes old
        if (age < 5 * 60 * 1000 && cachedConnections.length > 0) {
          console.log('[ConnectionContext] Loading from cache:', cachedConnections);
          setConnections(cachedConnections);
          // Keep dashboard visible
          setIsInitialLoad(false);
        }
      }
    } catch (error) {
      console.error('[ConnectionContext] Failed to load cache:', error);
    }

    const loadSavedConnections = async () => {
      console.log('[ConnectionContext] Loading saved connections, attempt:', retryCount + 1);
      try {
        const response = await apiClient.getSavedConnections();
        console.log('[ConnectionContext] API response:', response);
        
        if (response.success && response.data) {
          if (mounted) {
            console.log('[ConnectionContext] Setting connections:', response.data.connections);
            setConnections(response.data.connections);
            
            // Cache to localStorage
            try {
              localStorage.setItem(CACHE_KEY, JSON.stringify({
                connections: response.data.connections,
                timestamp: Date.now()
              }));
            } catch (error) {
              console.error('[ConnectionContext] Failed to cache connections:', error);
            }
            
            // Keep dashboard visible - don't auto-navigate
            setIsInitialLoad(false);
          }
        } else if (response.error?.includes('Unauthorized') && retryCount < maxRetries) {
          console.log('[ConnectionContext] Auth not ready, retrying...');
          retryCount++;
          setTimeout(loadSavedConnections, 500 * retryCount);
        } else {
          console.error('[ConnectionContext] Failed to load connections:', response.error);
          setIsInitialLoad(false);
        }
      } catch (error) {
        console.error('[ConnectionContext] Exception loading connections:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(loadSavedConnections, 500 * retryCount);
        } else {
          setIsInitialLoad(false);
        }
      }
    };

    // Small delay to ensure auth is ready
    console.log('[ConnectionContext] Scheduling connection load');
    const timer = setTimeout(loadSavedConnections, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  const addConnection = useCallback(async (conn: ConnectionInfo) => {
    setIsLoading(true);
    try {
      // Build connection string
      const sslParam = conn.sslMode !== 'disable' ? `?sslmode=${conn.sslMode}` : '';
      const connectionString = `postgresql://${conn.user}:${conn.password}@${conn.host}:${conn.port}/${conn.database}${sslParam}`;

      // Create connection via API
      const response = await apiClient.createConnection(conn.name, connectionString);

      if (!response.success || !response.data) {
        toast.error(response.error || 'Failed to connect to database');
        return;
      }

      const { connectionId, savedConnectionId, schemas } = response.data;

      // Fetch tables for the first schema (usually 'public')
      const defaultSchema = schemas.includes('public') ? 'public' : schemas[0];
      const tablesResponse = await apiClient.getTables(connectionId, defaultSchema);

      if (!tablesResponse.success || !tablesResponse.data) {
        toast.error('Connected but failed to fetch schema');
        return;
      }

      // Update connection info
      const updated: ConnectionInfo = {
        ...conn,
        id: connectionId,
        savedConnectionId: savedConnectionId,
        status: "connected",
        connectedAt: new Date(),
        lastUsed: new Date(),
      };

      const newConnections = [...connections.filter((c) => c.name !== conn.name), updated];
      setConnections(newConnections);
      
      // Update cache
      try {
        localStorage.setItem('dbexplorer_connections_cache', JSON.stringify({
          connections: newConnections,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('[ConnectionContext] Failed to update cache:', error);
      }
      
      setActiveConn(updated);
      
      // Set schema state
      setSchemaState({
        schemas,
        tables: {
          [defaultSchema]: tablesResponse.data.tables,
        },
      });
      
      setActiveSchemaState(defaultSchema);
      setShowDashboard(true); // Keep on dashboard after adding connection
      setSelectedTable(null);
      setQueryBlocks([createBlock("from")]);
      setQueryResult(null);

      toast.success(`Connected to ${conn.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setIsLoading(false);
    }
  }, [connections]);

  const setActiveConnection = useCallback(async (name: string) => {
    console.log('[ConnectionContext] setActiveConnection called with name:', name);
    
    // Check if user is authenticated
    if (!isLoaded) {
      console.log('[ConnectionContext] Auth not loaded yet, waiting...');
      return;
    }
    
    if (!isSignedIn) {
      console.log('[ConnectionContext] User not signed in');
      toast.error('Please sign in to connect to databases');
      return;
    }
    
    const conn = connections.find((c) => c.name === name);
    console.log('[ConnectionContext] Found connection:', conn);
    
    if (!conn) {
      console.error('[ConnectionContext] Connection not found:', name);
      return;
    }

    // Check if we have cached data for this connection
    const hasCachedData = queryClient.getQueryData(['tables', conn.id, 'public']) !== undefined;
    console.log('[ConnectionContext] Has cached data:', hasCachedData);

    // If we have cached data, switch immediately without loading
    if (hasCachedData && conn.id && !conn.id.startsWith('saved_')) {
      console.log('[ConnectionContext] Using cached data for instant switch');
      setActiveConn({ ...conn, status: "connected", lastUsed: new Date() });
      setActiveSchemaState('public');
      setShowDashboard(false);
      setSelectedTable(null);
      return;
    }

    // Only show loading for actual network requests
    setIsLoading(true);
    console.log('[ConnectionContext] Starting connection activation...');
    
    try {
      // If connection doesn't have an active ID (not saved_ prefix), we need to reconnect
      if (!conn.id || conn.id.startsWith('saved_')) {
        console.log('[ConnectionContext] Reconnecting saved connection...');
        
        // Reconnect using saved credentials
        const sslParam = conn.sslMode !== 'disable' ? `?sslmode=${conn.sslMode}` : '';
        const connectionString = `postgresql://${conn.user}:${conn.password}@${conn.host}:${conn.port}/${conn.database}${sslParam}`;
        console.log('[ConnectionContext] Connection string:', connectionString.replace(conn.password, '***'));

        const response = await apiClient.createConnection(conn.name, connectionString);
        console.log('[ConnectionContext] Create connection response:', response);

        if (!response.success || !response.data) {
          console.error('[ConnectionContext] Failed to reconnect:', response.error);
          toast.error(response.error || 'Failed to reconnect to database');
          return;
        }

        const { connectionId, savedConnectionId, schemas } = response.data;
        console.log('[ConnectionContext] Connection created:', connectionId, 'Schemas:', schemas);
        
        const defaultSchema = schemas.includes('public') ? 'public' : schemas[0];
        console.log('[ConnectionContext] Using default schema:', defaultSchema);

        // Update connection with new ID
        const updated: ConnectionInfo = {
          ...conn,
          id: connectionId,
          savedConnectionId: savedConnectionId,
          status: "connected",
          lastUsed: new Date(),
        };

        console.log('[ConnectionContext] Updating connection state...');
        
        const newConnections = connections.map((c) => c.name === name ? updated : c);
        
        // Force synchronous state updates to ensure UI updates immediately
        flushSync(() => {
          setConnections(newConnections);
          setActiveConn(updated);
          setActiveSchemaState(defaultSchema);
          setSelectedTable(null);
        });
        
        // Update cache after state is set
        try {
          localStorage.setItem('dbexplorer_connections_cache', JSON.stringify({
            connections: newConnections,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.error('[ConnectionContext] Failed to update cache:', error);
        }
        
        console.log('[ConnectionContext] Connection activated successfully');
        toast.success(`Connected to ${name}`);
        return;
      }

      console.log('[ConnectionContext] Using existing connection ID:', conn.id);
      
      // Connection already has an active ID, try to fetch schemas
      const schemasResponse = await apiClient.getSchemas(conn.id);
      console.log('[ConnectionContext] Schemas response:', schemasResponse);
      
      if (!schemasResponse.success || !schemasResponse.data) {
        // If connection not found, it means the server connection pool was cleared
        // Fall back to reconnecting
        if (schemasResponse.error?.includes('Connection not found')) {
          console.log('[ConnectionContext] Connection not found in pool, reconnecting...');
          
          // Reconnect using saved credentials
          const sslParam = conn.sslMode !== 'disable' ? `?sslmode=${conn.sslMode}` : '';
          const connectionString = `postgresql://${conn.user}:${conn.password}@${conn.host}:${conn.port}/${conn.database}${sslParam}`;
          console.log('[ConnectionContext] Reconnecting with connection string:', connectionString.replace(conn.password, '***'));

          const reconnectResponse = await apiClient.createConnection(conn.name, connectionString);
          console.log('[ConnectionContext] Reconnect response:', reconnectResponse);

          if (!reconnectResponse.success || !reconnectResponse.data) {
            console.error('[ConnectionContext] Failed to reconnect:', reconnectResponse.error);
            toast.error(reconnectResponse.error || 'Failed to reconnect to database');
            return;
          }

          const { connectionId, savedConnectionId, schemas } = reconnectResponse.data;
          console.log('[ConnectionContext] Reconnected with new ID:', connectionId, 'Schemas:', schemas);
          
          const defaultSchema = schemas.includes('public') ? 'public' : schemas[0];
          console.log('[ConnectionContext] Using default schema:', defaultSchema);

          // Update connection with new ID
          const updated: ConnectionInfo = {
            ...conn,
            id: connectionId,
            savedConnectionId: savedConnectionId,
            status: "connected",
            lastUsed: new Date(),
          };

          console.log('[ConnectionContext] Updating connection state with new ID...');
          const newConnections = connections.map((c) => c.name === name ? updated : c);
          
          // Force synchronous state updates
          flushSync(() => {
            setConnections(newConnections);
            setActiveConn(updated);
            setActiveSchemaState(defaultSchema);
            setSelectedTable(null);
          });
          
          // Update cache after state is set
          try {
            localStorage.setItem('dbexplorer_connections_cache', JSON.stringify({
              connections: newConnections,
              timestamp: Date.now()
            }));
          } catch (error) {
            console.error('[ConnectionContext] Failed to update cache:', error);
          }
          
          console.log('[ConnectionContext] Connection reactivated successfully');
          toast.success(`Reconnected to ${name}`);
          return;
        }
        
        console.error('[ConnectionContext] Failed to fetch schemas:', schemasResponse.error);
        toast.error('Failed to fetch schemas');
        return;
      }

      const schemas = schemasResponse.data.schemas;
      const defaultSchema = schemas.includes('public') ? 'public' : schemas[0];

      console.log('[ConnectionContext] Setting active connection and schema state');
      
      // Force synchronous state updates
      flushSync(() => {
        setActiveConn({ ...conn, status: "connected", lastUsed: new Date() });
        setActiveSchemaState(defaultSchema);
        setSelectedTable(null);
      });
      
      console.log('[ConnectionContext] Connection activated successfully');
    } catch (error) {
      console.error('[ConnectionContext] Exception during connection activation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to switch connection');
    } finally {
      setIsLoading(false);
      console.log('[ConnectionContext] setActiveConnection completed');
    }
  }, [connections, queryClient, isLoaded, isSignedIn]);

  const removeConnection = useCallback(async (name: string) => {
    const conn = connections.find((c) => c.name === name);
    
    // Close active connection if it exists
    if (conn?.id && !conn.id.startsWith('saved_')) {
      try {
        await apiClient.closeConnection(conn.id);
        // Invalidate cache for this connection
        queryClient.removeQueries({
          queryKey: ['tables', conn.id],
        });
      } catch (error) {
        console.error('Failed to close connection:', error);
      }
    }

    // Delete from database if it's a saved connection
    if (conn?.id?.startsWith('saved_')) {
      try {
        await apiClient.deleteSavedConnection(name);
        toast.success('Connection deleted');
      } catch (error) {
        console.error('Failed to delete saved connection:', error);
        toast.error('Failed to delete connection');
      }
    }

    const newConnections = connections.filter((c) => c.name !== name);
    setConnections(newConnections);
    
    // Update cache
    try {
      localStorage.setItem('dbexplorer_connections_cache', JSON.stringify({
        connections: newConnections,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('[ConnectionContext] Failed to update cache:', error);
    }
    
    if (activeConnection?.name === name) {
      setActiveConn(null);
      setSchemaState(null);
    }
  }, [activeConnection, connections, queryClient]);

  const setActiveSchema = useCallback(async (schema: string) => {
    if (!activeConnection?.id) return;

    // Check if we have cached data for this schema
    const cachedData = queryClient.getQueryData(['tables', activeConnection.id, schema]);
    
    if (cachedData) {
      // Use cached data immediately
      console.log('[ConnectionContext] Using cached data for schema switch:', schema);
      setActiveSchemaState(schema);
      return;
    }

    // Only show loading if we need to fetch data
    setIsLoading(true);
    try {
      // The useTableCache hook will handle the actual data fetching
      setActiveSchemaState(schema);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to switch schema');
    } finally {
      setIsLoading(false);
    }
  }, [activeConnection, queryClient]);

  const runQuery = useCallback(async () => {
    console.log('[ConnectionContext] ========== RUN QUERY STARTED ==========');
    console.log('[ConnectionContext] Active connection:', activeConnection?.id);
    console.log('[ConnectionContext] Editor mode:', editorMode);
    console.log('[ConnectionContext] SQL text:', sqlText);
    console.log('[ConnectionContext] Query blocks:', queryBlocks);
    
    if (!activeConnection?.id) {
      console.error('[ConnectionContext] No active connection');
      toast.error('No active connection');
      return;
    }

    setIsLoading(true);
    try {
      let query = sqlText;

      // If using visual query builder, build SQL from blocks
      if (editorMode === 'visual') {
        console.log('[ConnectionContext] Building SQL from visual blocks');
        query = buildSQLFromBlocks(queryBlocks);
        console.log('[ConnectionContext] Generated SQL:', query);
      }

      if (!query.trim()) {
        console.error('[ConnectionContext] Empty query');
        toast.error('Please enter a query');
        return;
      }

      // Extract limit from query or add default
      let queryLimit = 50; // Default limit
      const limitMatch = query.match(/\bLIMIT\s+(\d+)/i);
      if (limitMatch) {
        queryLimit = parseInt(limitMatch[1]);
        console.log('[ConnectionContext] Found LIMIT in query:', queryLimit);
      } else {
        // If no LIMIT in query, add one automatically
        query = query.trim();
        if (!query.endsWith(';')) {
          query += ';';
        }
        query = query.replace(/;$/, ` LIMIT ${queryLimit};`);
        console.log('[ConnectionContext] Added default LIMIT:', queryLimit);
      }

      console.log('[ConnectionContext] Final query:', query);
      console.log('[ConnectionContext] Executing query...');

      const response = await apiClient.executeQuery({
        connectionId: activeConnection.id,
        sql: query,
        limit: queryLimit,
      });

      console.log('[ConnectionContext] Query response:', response);

      if (!response.success || !response.data) {
        console.error('[ConnectionContext] Query failed:', response.error);
        toast.error(response.error || 'Query execution failed');
        return;
      }

      console.log('[ConnectionContext] Query successful. Rows:', response.data.rowCount, 'Time:', response.data.executionTime, 'ms');
      setQueryResult(response.data);
      setShowDashboard(false);
      toast.success(`Query executed in ${response.data.executionTime}ms`);
      console.log('[ConnectionContext] ========== RUN QUERY COMPLETED ==========');
    } catch (error) {
      console.error('[ConnectionContext] Query exception:', error);
      toast.error(error instanceof Error ? error.message : 'Query execution failed');
    } finally {
      setIsLoading(false);
    }
  }, [activeConnection, sqlText, queryBlocks, editorMode]);

  return (
    <ConnectionContext.Provider
      value={{
        connections, activeConnection, schemaState, activeSchema, selectedTable,
        queryBlocks, sqlText, queryResult, editorMode, isLoading, isInspectorOpen,
        showDashboard, showAudit, isConnectionManagerOpen, editingRecord, creatingRecord, isInitialLoad, addConnection, setActiveConnection,
        removeConnection, setActiveSchema, setSelectedTable, setQueryBlocks,
        setSqlText, setQueryResult, setEditorMode, setIsInspectorOpen,
        setShowDashboard, setShowAudit, setIsConnectionManagerOpen, setEditingRecord, setCreatingRecord, runQuery, currentTables,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}
