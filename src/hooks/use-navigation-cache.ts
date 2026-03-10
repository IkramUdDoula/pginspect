import { useEffect } from "react";
import { useNavigation } from "@/contexts/NavigationContext";
import { useConnection } from "@/contexts/ConnectionContext";
import { useTableCache } from "./use-table-cache";

export function useNavigationCache() {
  const { tabs, activeTabId } = useNavigation();
  const { activeConnection } = useConnection();
  const { warmUpConnection } = useTableCache(activeConnection?.id || null, 'public');

  // Warm up cache for all open tabs
  useEffect(() => {
    const warmUpTabs = async () => {
      for (const tab of tabs) {
        if (tab.connection.id && !tab.connection.id.startsWith('saved_')) {
          try {
            // Warm up the most common schemas
            await warmUpConnection(tab.connection.id, ['public', 'information_schema']);
          } catch (error) {
            console.warn(`Failed to warm up cache for ${tab.connection.name}:`, error);
          }
        }
      }
    };

    if (tabs.length > 0) {
      // Debounce the warm up to avoid excessive API calls
      const timer = setTimeout(warmUpTabs, 1000);
      return () => clearTimeout(timer);
    }
  }, [tabs, warmUpConnection]);

  return null;
}