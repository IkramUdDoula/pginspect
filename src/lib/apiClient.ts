// API client for backend communication

import type {
  ApiResponse,
  ConnectionInfo,
  QueryResult,
  SchemaState,
  TableInfo,
  QueryExecutionRequest,
  QueryExplainRequest,
} from '@/shared/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');

// Token provider function - will be set by the app
let getAuthToken: (() => Promise<string | null>) | null = null;

export function setAuthTokenProvider(provider: () => Promise<string | null>) {
  getAuthToken = provider;
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API_URL, timeout: number = API_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Get auth token if available
      const token = getAuthToken ? await getAuthToken() : null;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        // Handle unauthorized
        if (response.status === 401) {
          return {
            success: false,
            error: 'Unauthorized - please sign in again',
          };
        }

        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout - please try again',
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'An unknown error occurred',
      };
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; uptime: number }>> {
    return this.request('/api/health');
  }

  // Connection management
  async testConnection(
    connectionString: string
  ): Promise<ApiResponse<{ serverVersion: string }>> {
    return this.request('/api/connections/test', {
      method: 'POST',
      body: JSON.stringify({ connectionString }),
    });
  }

  async createConnection(
    name: string,
    connectionString: string
  ): Promise<ApiResponse<{ connectionId: string; schemas: string[] }>> {
    return this.request('/api/connections/connect', {
      method: 'POST',
      body: JSON.stringify({ name, connectionString }),
    });
  }

  async closeConnection(connectionId: string): Promise<ApiResponse<void>> {
    return this.request(`/api/connections/${connectionId}`, {
      method: 'DELETE',
    });
  }

  // Get user's saved connections
  async getSavedConnections(): Promise<ApiResponse<{ connections: ConnectionInfo[] }>> {
    return this.request('/api/connections');
  }

  // Delete saved connection
  async deleteSavedConnection(name: string): Promise<ApiResponse<void>> {
    return this.request(`/api/connections/saved/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  }

  // Schema inspection
  async getSchemas(
    connectionId: string
  ): Promise<ApiResponse<{ schemas: string[] }>> {
    return this.request(`/api/schema/${connectionId}/schemas`);
  }

  async getTables(
    connectionId: string,
    schemaName: string
  ): Promise<ApiResponse<{ tables: TableInfo[] }>> {
    return this.request(`/api/schema/${connectionId}/${schemaName}/tables`);
  }

  async getTableDetails(
    connectionId: string,
    schemaName: string,
    tableName: string
  ): Promise<ApiResponse<{ table: TableInfo }>> {
    return this.request(
      `/api/schema/${connectionId}/${schemaName}/${tableName}`
    );
  }

  // Query execution
  async executeQuery(
    request: QueryExecutionRequest
  ): Promise<ApiResponse<QueryResult>> {
    return this.request('/api/query/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async explainQuery(
    request: QueryExplainRequest
  ): Promise<ApiResponse<{ plan: string }>> {
    return this.request('/api/query/explain', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export const apiClient = new ApiClient();
