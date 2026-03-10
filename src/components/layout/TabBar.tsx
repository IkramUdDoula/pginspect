import { X, Database, Plus } from "lucide-react";
import { useNavigation } from "@/contexts/NavigationContext";
import { useConnection } from "@/contexts/ConnectionContext";
import { useTableCache } from "@/hooks/use-table-cache";
import { cn } from "@/lib/utils";

export function TabBar() {
  const { tabs, activeTabId, switchToTab, closeTab } = useNavigation();
  const { setIsConnectionManagerOpen, activeConnection } = useConnection();
  const { prefetchSchema, isLoading } = useTableCache(activeConnection?.id || null, 'public');

  const handleTabHover = async (tab: typeof tabs[0]) => {
    // Prefetch data for this tab's connection and schema
    if (tab.connection.id && !tab.connection.id.startsWith('saved_')) {
      try {
        await prefetchSchema(tab.schema);
      } catch (error) {
        console.warn(`Failed to prefetch data for ${tab.connection.name}:`, error);
      }
    }
  };

  return (
    <div className="flex items-center bg-card/30 border-b border-border overflow-x-auto scrollbar-thin relative z-15">
      {tabs.length === 0 ? (
        // Show message when no tabs are open
        <div className="flex items-center justify-center w-full py-2 text-muted-foreground text-sm">
          <span className="mr-2">No connections open</span>
          <button
            onClick={() => setIsConnectionManagerOpen(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Connection
          </button>
        </div>
      ) : (
        <>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 border-r border-border min-w-0 flex-shrink-0 group cursor-pointer transition-colors relative",
                tab.isActive 
                  ? "bg-card text-foreground border-b-2 border-b-primary" 
                  : "bg-card/50 text-muted-foreground hover:bg-card/80 hover:text-foreground"
              )}
              onClick={() => switchToTab(tab.id)}
              onMouseEnter={() => handleTabHover(tab)}
            >
              <div className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                tab.connection.status === "connected" ? "bg-green-500" : 
                tab.connection.status === "error" ? "bg-red-500" : "bg-blue-500",
                isLoading && tab.isActive ? "animate-pulse" : ""
              )} />
              
              <Database className="h-3 w-3 flex-shrink-0" />
              
              <span className="text-xs font-mono truncate max-w-[120px]" title={tab.title}>
                {tab.title}
              </span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className={cn(
                  "p-0.5 rounded hover:bg-surface-hover flex-shrink-0 transition-opacity",
                  tab.isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                title="Close tab"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {/* Add new connection button */}
          <button
            onClick={() => setIsConnectionManagerOpen(true)}
            className="flex items-center gap-1 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-card/50 transition-colors flex-shrink-0"
            title="Add new connection"
          >
            <Plus className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  );
}