import { useState } from "react";
import { Database, ChevronDown, Plus, Check, Sun, Moon, LayoutDashboard, ScrollText } from "lucide-react";
import { useConnection } from "@/contexts/ConnectionContext";
import { UserButton } from "@/components/auth/UserButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/hooks/use-theme";

export function TopNavbar() {
  const { activeConnection, connections, setActiveConnection, setIsConnectionManagerOpen, activeSchema, setActiveSchema, schemaState, setShowDashboard, setShowAudit, showDashboard, showAudit, setSelectedTable } = useConnection();
  const [connDropdown, setConnDropdown] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <header className="h-12 flex items-center justify-between px-2 sm:px-4 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0 relative z-20">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Database className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="font-mono font-semibold text-xs sm:text-sm tracking-tight hidden sm:inline">pgInspect</span>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Dashboard button */}
        <button
          onClick={() => { setShowDashboard(true); setShowAudit(false); setSelectedTable(null); }}
          className={`p-1.5 rounded-md hover:bg-surface-hover transition-colors ${showDashboard ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
          title="Dashboard"
        >
          <LayoutDashboard className="h-4 w-4" />
        </button>

        {/* Audit Log button */}
        <button
          onClick={() => { setShowAudit(true); setShowDashboard(false); setSelectedTable(null); }}
          className={`p-1.5 rounded-md hover:bg-surface-hover transition-colors ${showAudit ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
          title="Audit Logs"
        >
          <ScrollText className="h-4 w-4" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Connection selector - only show when not on dashboard or audit */}
        {activeConnection && !showDashboard && !showAudit && (
          <div className="relative hidden sm:block">
            <button onClick={() => setConnDropdown(!connDropdown)} className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md bg-secondary hover:bg-surface-hover text-xs sm:text-sm transition-colors">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeConnection.status === "connected" ? "bg-green-500" : activeConnection.status === "error" ? "bg-red-500" : "bg-blue-500"}`} />
              <span className="font-mono text-xs hidden md:inline">{activeConnection.name}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            </button>
            {connDropdown && (
              <div className="absolute top-full mt-1 right-0 w-64 bg-card border border-border rounded-lg shadow-xl z-30 py-1">
                {connections.map((c) => (
                  <button 
                    key={c.name} 
                    onClick={() => { 
                      setActiveConnection(c.name); 
                      setConnDropdown(false); 
                    }} 
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-hover text-left"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.name === activeConnection.name ? "bg-green-500" : "bg-blue-500"}`} />
                    <span className="font-mono text-xs flex-1">{c.name}</span>
                    {c.name === activeConnection.name && <Check className="h-3 w-3 text-primary flex-shrink-0" />}
                  </button>
                ))}
                <div className="border-t border-border my-1" />
                <button onClick={() => { setIsConnectionManagerOpen(true); setConnDropdown(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-hover text-muted-foreground">
                  <Plus className="h-3 w-3 flex-shrink-0" /> Add new connection
                </button>
              </div>
            )}
          </div>
        )}

        {/* Schema selector - only show when not on dashboard or audit */}
        {schemaState && !showDashboard && !showAudit && (
          <Select value={activeSchema} onValueChange={setActiveSchema}>
            <SelectTrigger className="h-8 w-auto min-w-[80px] sm:min-w-[100px] text-xs font-mono bg-secondary border-none hidden sm:flex">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-30">
              {schemaState.schemas.map((s) => (
                <SelectItem key={s} value={s} className="text-xs font-mono">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* User button */}
        <UserButton />
      </div>
    </header>
  );
}
