import { useEffect } from "react";
import { useConnection } from "@/contexts/ConnectionContext";
import { useNavigation } from "@/contexts/NavigationContext";
import { usePerformanceMonitor } from "./use-performance-monitor";

export function useNavigationIntegration() {
  const { activeConnection, setActiveConnection, activeSchema, setActiveSchema, setShowDashboard } = useConnection();
  const { switchToTab, tabs, activeTabId } = useNavigation();

  // Monitor tab switching performance
  usePerformanceMonitor("Tab Switch", activeTabId);

  // Handle tab switching - update connection context when tab changes
  useEffect(() => {
    if (!activeTabId || tabs.length === 0) {
      // No active tab - show dashboard
      console.log('[Navigation Integration] No active tab, showing dashboard');
      setShowDashboard(true);
      return;
    }
    
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (!activeTab) {
      console.log('[Navigation Integration] Active tab not found, showing dashboard');
      setShowDashboard(true);
      return;
    }

    // Hide dashboard when we have an active tab
    setShowDashboard(false);

    // Only update if different from current active connection
    if (activeConnection?.name !== activeTab.connection.name) {
      console.log('[Navigation Integration] Switching to connection:', activeTab.connection.name);
      setActiveConnection(activeTab.connection.name);
    }
    
    // Only update schema if different
    if (activeSchema !== activeTab.schema) {
      setActiveSchema(activeTab.schema);
    }
  }, [activeTabId, tabs, activeConnection, activeSchema, setActiveConnection, setActiveSchema, setShowDashboard]);

  return {
    // Navigation functions are available through useNavigation hook
  };
}