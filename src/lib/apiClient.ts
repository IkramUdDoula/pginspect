// API client for backend communication

import type {
  ApiResponse,
  ConnectionInfo,
  QueryResult,
  SchemaState,
  TableInfo,
  QueryExecutionRequest,
  QueryExplainRequest,
  SavedView,
  CreateViewRequest,
  UpdateViewRequest,
  ViewListResponse,
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
    console.log('=== ApiClient: request called ===');
    console.log('ApiClient: endpoint =', endpoint);
    console.log('ApiClient: options =', options);
    console.log('ApiClient: baseUrl =', this.baseUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Get auth token if available
      const token = getAuthToken ? await getAuthToken() : null;
      console.log('ApiClient: Auth token available =', !!token);
      if (token) {
        console.log('ApiClient: Token preview =', token.substring(0, 50) + '...');
        console.log('ApiClient: Token length =', token.length);
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('ApiClient: Final headers =', headers);
      console.log('ApiClient: Request body =', options.body);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('ApiClient: HTTP response status =', response.status);
      console.log('ApiClient: HTTP response ok =', response.ok);

      const data = await response.json();
      console.log('ApiClient: Response data =', data);

      if (!response.ok) {
        console.log('ApiClient: HTTP error response');
        // Handle unauthorized
        if (response.status === 401) {
          console.log('ApiClient: 401 Unauthorized - Session may have expired');
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

      console.log('ApiClient: Successful response');
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      console.log('ApiClient: Exception in request');
      console.error('ApiClient: Exception details =', error);

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
  ): Promise<ApiResponse<{ connectionId: string; savedConnectionId: number; schemas: string[] }>> {
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

  // Views management
  async getViews(connectionId: number): Promise<ApiResponse<ViewListResponse>> {
    return this.request(`/api/views?connectionId=${connectionId}`);
  }

  async getView(viewId: string): Promise<ApiResponse<{ view: SavedView }>> {
    return this.request(`/api/views/${viewId}`);
  }

  async createView(viewData: CreateViewRequest): Promise<ApiResponse<{ view: SavedView }>> {
    console.log('=== ApiClient: createView called ===');
    console.log('ApiClient: viewData =', viewData);
    console.log('ApiClient: Making POST request to /api/views');
    
    const response = await this.request('/api/views', {
      method: 'POST',
      body: JSON.stringify(viewData),
    });
    
    console.log('ApiClient: Response received =', response);
    return response;
  }

  async updateView(viewId: string, updates: UpdateViewRequest): Promise<ApiResponse<{ view: SavedView }>> {
    return this.request(`/api/views/${viewId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteView(viewId: string): Promise<ApiResponse<void>> {
    return this.request(`/api/views/${viewId}`, {
      method: 'DELETE',
    });
  }

  async executeView(viewId: string): Promise<ApiResponse<QueryResult & { view: { id: string; name: string; description?: string; connectionId: number; schemaName: string } }>> {
    return this.request(`/api/views/${viewId}/execute`, {
      method: 'POST',
    });
  }

  // Data manipulation
  async insertData(
    connectionId: string,
    schema: string,
    table: string,
    data: Record<string, unknown>
  ): Promise<ApiResponse<{ rowsAffected: number }>> {
    return this.request('/api/data/insert', {
      method: 'POST',
      body: JSON.stringify({ connectionId, schema, table, data }),
    });
  }

  async updateData(
    connectionId: string,
    schema: string,
    table: string,
    where: Record<string, unknown>,
    data: Record<string, unknown>
  ): Promise<ApiResponse<{ rowsAffected: number }>> {
    return this.request('/api/data/update', {
      method: 'POST',
      body: JSON.stringify({ connectionId, schema, table, where, data }),
    });
  }

  async deleteData(
    connectionId: string,
    schema: string,
    table: string,
    where: Record<string, unknown>
  ): Promise<ApiResponse<{ rowsAffected: number }>> {
    return this.request('/api/data/delete', {
      method: 'POST',
      body: JSON.stringify({ connectionId, schema, table, where }),
    });
  }
}

export const apiClient = new ApiClient();
