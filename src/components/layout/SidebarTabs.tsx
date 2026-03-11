// Tabbed interface for sidebar navigation between Tables and Views

import { useState } from 'react';
import { Table2, Eye } from 'lucide-react';

interface SidebarTabsProps {
  activeTab: 'tables' | 'views';
  onTabChange: (tab: 'tables' | 'views') => void;
  collapsed: boolean;
}

export function SidebarTabs({ activeTab, onTabChange, collapsed }: SidebarTabsProps) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-1 gap-1 border-b border-border">
        <button
          onClick={() => onTabChange('tables')}
          className={`p-2 rounded-md hover:bg-surface-hover transition-colors ${
            activeTab === 'tables' 
              ? 'text-primary bg-primary/10' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Tables"
        >
          <Table2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onTabChange('views')}
          className={`p-2 rounded-md hover:bg-surface-hover transition-colors ${
            activeTab === 'views' 
              ? 'text-primary bg-primary/10' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Views"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex border-b border-border bg-card/50">
      <button
        onClick={() => onTabChange('tables')}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors ${
          activeTab === 'tables'
            ? 'text-primary border-b-2 border-primary bg-primary/5'
            : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
        }`}
      >
        <Table2 className="h-4 w-4" />
        <span>Tables</span>
      </button>
      <button
        onClick={() => onTabChange('views')}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors ${
          activeTab === 'views'
            ? 'text-primary border-b-2 border-primary bg-primary/5'
            : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
        }`}
      >
        <Eye className="h-4 w-4" />
        <span>Views</span>
      </button>
    </div>
  );
}