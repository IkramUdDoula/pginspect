import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ConnectionInfo } from "@/shared/types";

export interface NavigationTab {
  id: string;
  title: string;
  connection: ConnectionInfo;
  schema: string;
  isActive: boolean;
  lastAccessed: Date;
}

export interface NavigationHistoryEntry {
  tabId: string;
  connection: ConnectionInfo;
  schema: string;
  timestamp: Date;
}

interface NavigationContextType {
  tabs: NavigationTab[];
  activeTabId: string | null;
  history: NavigationHistoryEntry[];
  currentHistoryIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;
  
  openTab: (connection: ConnectionInfo, schema?: string) => string;
  closeTab: (tabId: string) => void;
  switchToTab: (tabId: string) => void;
  goBack: () => void;
  goForward: () => void;
  updateTabTitle: (tabId: string, title: string) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used within NavigationProvider");
  return ctx;
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = useState<NavigationTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [history, setHistory] = useState<NavigationHistoryEntry[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  // Update document title based on active tab
  useEffect(() => {
    if (activeTabId && tabs.length > 0) {
      const activeTab = tabs.find(tab => tab.id === activeTabId);
      if (activeTab) {
        const tabCount = tabs.length > 1 ? ` (${tabs.length})` : '';
        document.title = `${activeTab.title}${tabCount} - pgInspect`;
      }
    } else {
      document.title = 'pgInspect';
    }
  }, [activeTabId, tabs]);

  const canGoBack = currentHistoryIndex > 0;
  const canGoForward = currentHistoryIndex < history.length - 1;

  const generateTabId = useCallback(() => {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addToHistory = useCallback((tabId: string, connection: ConnectionInfo, schema: string) => {
    const entry: NavigationHistoryEntry = {
      tabId,
      connection,
      schema,
      timestamp: new Date(),
    };

    setHistory(prev => {
      // Remove any history entries after current index (when navigating back then opening new tab)
      const newHistory = prev.slice(0, currentHistoryIndex + 1);
      return [...newHistory, entry];
    });
    
    setCurrentHistoryIndex(prev => prev + 1);
  }, [currentHistoryIndex]);

  const switchToTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    setTabs(prev => prev.map(t => ({
      ...t,
      isActive: t.id === tabId,
      lastAccessed: t.id === tabId ? new Date() : t.lastAccessed,
    })));
    
    setActiveTabId(tabId);
    addToHistory(tabId, tab.connection, tab.schema);
  }, [tabs, addToHistory]);

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const tabIndex = prev.findIndex(tab => tab.id === tabId);
      const filtered = prev.filter(tab => tab.id !== tabId);
      
      // If closing active tab and there are remaining tabs
      if (activeTabId === tabId && filtered.length > 0) {
        let nextActiveTab: NavigationTab;
        
        // Strategy: Try to go to the tab to the right, if not available go to the left
        if (tabIndex < filtered.length) {
          // There's a tab to the right (same index after removal)
          nextActiveTab = filtered[tabIndex];
        } else if (tabIndex > 0) {
          // Go to the tab to the left (previous index)
          nextActiveTab = filtered[tabIndex - 1];
        } else {
          // Fallback to first available tab
          nextActiveTab = filtered[0];
        }
        
        // Set the next active tab and add to history
        setActiveTabId(nextActiveTab.id);
        addToHistory(nextActiveTab.id, nextActiveTab.connection, nextActiveTab.schema);
        
        // Update the tabs with the new active state
        return filtered.map(tab => ({
          ...tab,
          isActive: tab.id === nextActiveTab.id,
          lastAccessed: tab.id === nextActiveTab.id ? new Date() : tab.lastAccessed,
        }));
      } else if (filtered.length === 0) {
        // No tabs left
        setActiveTabId(null);
        return filtered;
      } else {
        // Not closing the active tab, just remove it
        return filtered;
      }
    });

    // Remove from history
    setHistory(prev => prev.filter(entry => entry.tabId !== tabId));
    setCurrentHistoryIndex(prev => Math.max(0, Math.min(prev, history.length - 2)));
  }, [activeTabId, history.length, addToHistory]);

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    
    const newIndex = currentHistoryIndex - 1;
    const entry = history[newIndex];
    
    if (entry) {
      setCurrentHistoryIndex(newIndex);
      switchToTab(entry.tabId);
    }
  }, [canGoBack, currentHistoryIndex, history, switchToTab]);

  const goForward = useCallback(() => {
    if (!canGoForward) return;
    
    const newIndex = currentHistoryIndex + 1;
    const entry = history[newIndex];
    
    if (entry) {
      setCurrentHistoryIndex(newIndex);
      switchToTab(entry.tabId);
    }
  }, [canGoForward, currentHistoryIndex, history, switchToTab]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Left Arrow = Go back
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft' && canGoBack) {
        e.preventDefault();
        goBack();
      }
      
      // Ctrl/Cmd + Right Arrow = Go forward
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight' && canGoForward) {
        e.preventDefault();
        goForward();
      }
      
      // Ctrl/Cmd + W = Close current tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w' && activeTabId) {
        e.preventDefault();
        closeTab(activeTabId);
      }
      
      // Ctrl/Cmd + Tab = Switch to next tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab' && !e.shiftKey && tabs.length > 1) {
        e.preventDefault();
        const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
        const nextIndex = (currentIndex + 1) % tabs.length;
        switchToTab(tabs[nextIndex].id);
      }
      
      // Ctrl/Cmd + Shift + Tab = Switch to previous tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab' && e.shiftKey && tabs.length > 1) {
        e.preventDefault();
        const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
        const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        switchToTab(tabs[prevIndex].id);
      }
      
      // Ctrl/Cmd + T = Focus on connection dropdown (if available)
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        // This would need to be implemented in the TopNavbar component
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoBack, canGoForward, activeTabId, tabs, goBack, goForward, closeTab, switchToTab]);

  const openTab = useCallback((connection: ConnectionInfo, schema: string = "public") => {
    // Check if tab already exists for this connection
    const existingTab = tabs.find(tab => 
      tab.connection.name === connection.name && tab.schema === schema
    );

    if (existingTab) {
      switchToTab(existingTab.id);
      return existingTab.id;
    }

    const tabId = generateTabId();
    const newTab: NavigationTab = {
      id: tabId,
      title: `${connection.name} (${schema})`,
      connection,
      schema,
      isActive: true,
      lastAccessed: new Date(),
    };

    setTabs(prev => [
      ...prev.map(tab => ({ ...tab, isActive: false })),
      newTab
    ]);
    
    setActiveTabId(tabId);
    addToHistory(tabId, connection, schema);
    
    return tabId;
  }, [tabs, generateTabId, addToHistory, switchToTab]);

  const updateTabTitle = useCallback((tabId: string, title: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, title } : tab
    ));
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        tabs,
        activeTabId,
        history,
        currentHistoryIndex,
        canGoBack,
        canGoForward,
        openTab,
        closeTab,
        switchToTab,
        goBack,
        goForward,
        updateTabTitle,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}