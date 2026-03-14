// Context for managing saved views state

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useConnection } from './ConnectionContext';
import type { SavedView, CreateViewRequest, QueryResult } from '@/shared/types';

interface ViewState {
  views: SavedView[];
  currentView: SavedView | null;
  viewResults: (QueryResult & { view: { id: string; name: string; description?: string; connectionId: number; schemaName: string } }) | null;
  isLoading: boolean;
  error: string | null;
  isViewMode: boolean;
  autoRefreshInterval: number; // 0 = off, otherwise milliseconds
}

type ViewAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_VIEWS'; payload: SavedView[] }
  | { type: 'ADD_VIEW'; payload: SavedView }
  | { type: 'REMOVE_VIEW'; payload: string }
  | { type: 'SET_CURRENT_VIEW'; payload: SavedView | null }
  | { type: 'SET_VIEW_RESULTS'; payload: ViewState['viewResults'] }
  | { type: 'SET_VIEW_MODE'; payload: boolean }
  | { type: 'SET_AUTO_REFRESH'; payload: number }
  | { type: 'CLEAR_STATE' };

const initialState: ViewState = {
  views: [],
  currentView: null,
  viewResults: null,
  isLoading: false,
  error: null,
  isViewMode: false,
  autoRefreshInterval: 0,
};

function viewReducer(state: ViewState, action: ViewAction): ViewState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_VIEWS':
      return { ...state, views: action.payload, isLoading: false, error: null };
    case 'ADD_VIEW':
      return { ...state, views: [action.payload, ...state.views] };
    case 'REMOVE_VIEW':
      return {
        ...state,
        views: state.views.filter(view => view.id !== action.payload),
        currentView: state.currentView?.id === action.payload ? null : state.currentView,
        viewResults: state.currentView?.id === action.payload ? null : state.viewResults,
        isViewMode: state.currentView?.id === action.payload ? false : state.isViewMode,
      };
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_VIEW_RESULTS':
      return { ...state, viewResults: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, isViewMode: action.payload };
    case 'SET_AUTO_REFRESH':
      return { ...state, autoRefreshInterval: action.payload };
    case 'CLEAR_STATE':
      return initialState;
    default:
      return state;
  }
}

interface ViewContextType extends ViewState {
  loadViews: (connectionId: number) => Promise<void>;
  createView: (viewData: CreateViewRequest) => Promise<SavedView | null>;
  deleteView: (viewId: string) => Promise<boolean>;
  executeView: (viewId: string) => Promise<void>;
  refreshCurrentView: () => Promise<void>;
  exitViewMode: () => void;
  setAutoRefresh: (interval: number) => Promise<void>;
  clearError: () => void;
}

const ViewContext = createContext<ViewContextType | null>(null);

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(viewReducer, initialState);
  const { activeConnection } = useConnection();

  // Auto-refresh timer
  useEffect(() => {
    if (state.autoRefreshInterval > 0 && state.currentView && state.isViewMode) {
      const timer = setInterval(() => {
        refreshCurrentView();
      }, state.autoRefreshInterval);

      return () => clearInterval(timer);
    }
  }, [state.autoRefreshInterval, state.currentView, state.isViewMode]);

  // Clear views when connection changes
  useEffect(() => {
    if (activeConnection?.id) {
      let connectionId: number | null = null;
      
      if (activeConnection.id.startsWith('saved_')) {
        // Saved connection - extract numeric ID
        connectionId = parseInt(activeConnection.id.replace('saved_', ''), 10);
      } else if (activeConnection.savedConnectionId) {
        // Runtime connection with saved connection ID
        connectionId = activeConnection.savedConnectionId;
      }
      
      if (connectionId && !isNaN(connectionId)) {
        loadViews(connectionId);
      } else {
        // Runtime connection without saved ID - clear views
        dispatch({ type: 'CLEAR_STATE' });
      }
    } else {
      dispatch({ type: 'CLEAR_STATE' });
    }
  }, [activeConnection?.id, activeConnection?.savedConnectionId]);

  const loadViews = useCallback(async (connectionId: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await apiClient.getViews(connectionId);
      
      if (response.success && response.data) {
        dispatch({ type: 'SET_VIEWS', payload: response.data.views });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to load views' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load views' });
    }
  }, []);

  const createView = useCallback(async (viewData: CreateViewRequest): Promise<SavedView | null> => {
    console.log('=== ViewContext: createView called ===');
    console.log('ViewContext: viewData =', viewData);
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      console.log('ViewContext: Calling apiClient.createView...');
      const response = await apiClient.createView(viewData);
      console.log('ViewContext: API response =', response);
      
      if (response.success && response.data) {
        console.log('ViewContext: SUCCESS - Adding view to state');
        console.log('ViewContext: New view =', response.data.view);
        dispatch({ type: 'ADD_VIEW', payload: response.data.view });
        dispatch({ type: 'SET_LOADING', payload: false });
        return response.data.view;
      } else {
        console.log('ViewContext: ERROR - API call failed');
        console.log('ViewContext: Error =', response.error);
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to create view' });
        return null;
      }
    } catch (error) {
      console.log('ViewContext: ERROR - Exception in createView');
      console.error('ViewContext: Exception details =', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create view' });
      return null;
    }
  }, []);

  const deleteView = useCallback(async (viewId: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await apiClient.deleteView(viewId);
      
      if (response.success) {
        dispatch({ type: 'REMOVE_VIEW', payload: viewId });
        dispatch({ type: 'SET_LOADING', payload: false });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to delete view' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete view' });
      return false;
    }
  }, []);

  const executeView = useCallback(async (viewId: string) => {
    console.log('[ViewContext] ========== EXECUTE VIEW STARTED ==========');
    console.log('[ViewContext] View ID:', viewId);
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      console.log('[ViewContext] Calling apiClient.executeView...');
      const response = await apiClient.executeView(viewId);
      console.log('[ViewContext] API response:', response);
      
      if (response.success && response.data) {
        // Find the view in our state
        const view = state.views.find(v => v.id === viewId);
        console.log('[ViewContext] Found view in state:', view);
        
        if (view) {
          console.log('[ViewContext] Setting current view and results');
          dispatch({ type: 'SET_CURRENT_VIEW', payload: view });
          dispatch({ type: 'SET_VIEW_RESULTS', payload: response.data });
          dispatch({ type: 'SET_VIEW_MODE', payload: true });
          // Load saved auto-refresh interval
          dispatch({ type: 'SET_AUTO_REFRESH', payload: view.autoRefreshInterval || 0 });
          console.log('[ViewContext] View mode activated with auto-refresh:', view.autoRefreshInterval || 0);
        }
        dispatch({ type: 'SET_LOADING', payload: false });
        console.log('[ViewContext] ========== EXECUTE VIEW COMPLETED ==========');
      } else {
        console.error('[ViewContext] Execute view failed:', response.error);
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to execute view' });
      }
    } catch (error) {
      console.error('[ViewContext] Execute view exception:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to execute view' });
    }
  }, [state.views]);

  const refreshCurrentView = useCallback(async () => {
    if (!state.currentView) return;
    
    try {
      const response = await apiClient.executeView(state.currentView.id);
      
      if (response.success && response.data) {
        dispatch({ type: 'SET_VIEW_RESULTS', payload: response.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to refresh view' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh view' });
    }
  }, [state.currentView]);

  const exitViewMode = useCallback(() => {
    console.log('[ViewContext] ========== EXIT VIEW MODE ==========');
    console.log('[ViewContext] Clearing view mode state');
    dispatch({ type: 'SET_VIEW_MODE', payload: false });
    dispatch({ type: 'SET_CURRENT_VIEW', payload: null });
    dispatch({ type: 'SET_VIEW_RESULTS', payload: null });
    dispatch({ type: 'SET_AUTO_REFRESH', payload: 0 });
    console.log('[ViewContext] View mode exited');
  }, []);

  const setAutoRefresh = useCallback(async (interval: number) => {
    dispatch({ type: 'SET_AUTO_REFRESH', payload: interval });
    
    // Persist to database if we have a current view
    if (state.currentView) {
      try {
        await apiClient.updateView(state.currentView.id, { autoRefreshInterval: interval });
        
        // Update the view in our local state
        const updatedViews = state.views.map(v => 
          v.id === state.currentView?.id 
            ? { ...v, autoRefreshInterval: interval }
            : v
        );
        dispatch({ type: 'SET_VIEWS', payload: updatedViews });
        
        // Update current view
        if (state.currentView) {
          dispatch({ type: 'SET_CURRENT_VIEW', payload: { ...state.currentView, autoRefreshInterval: interval } });
        }
      } catch (error) {
        console.error('Failed to persist auto-refresh interval:', error);
        // Still keep the local state change even if persistence fails
      }
    }
  }, [state.currentView, state.views]);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const contextValue: ViewContextType = {
    ...state,
    loadViews,
    createView,
    deleteView,
    executeView,
    refreshCurrentView,
    exitViewMode,
    setAutoRefresh,
    clearError,
  };

  return (
    <ViewContext.Provider value={contextValue}>
      {children}
    </ViewContext.Provider>
  );
}

export function useViews() {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useViews must be used within a ViewProvider');
  }
  return context;
}