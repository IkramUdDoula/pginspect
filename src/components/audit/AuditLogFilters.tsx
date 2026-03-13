import { useState } from 'react';
import type { AuditLogFilter } from '@/shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLogFiltersProps {
  filters: AuditLogFilter;
  onFilterChange: (filters: Partial<AuditLogFilter>) => void;
}

export function AuditLogFilters({ filters, onFilterChange }: AuditLogFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.searchQuery || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ searchQuery: searchInput || undefined });
  };

  const clearFilters = () => {
    setSearchInput('');
    onFilterChange({
      actionCategory: undefined,
      actionType: undefined,
      status: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      searchQuery: undefined,
    });
  };

  const hasActiveFilters = 
    filters.actionCategory ||
    filters.actionType ||
    filters.status ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.searchQuery;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="space-y-2">
        <Label className="text-xs">Search</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Search logs..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-8 text-xs"
          />
          <Button type="submit" size="sm" className="h-8 text-xs">
            Go
          </Button>
        </div>
      </form>

      {/* Category */}
      <div className="space-y-2">
        <Label className="text-xs">Category</Label>
        <Select
          value={filters.actionCategory || 'all'}
          onValueChange={(value) => onFilterChange({ actionCategory: value === 'all' ? undefined : value })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Categories</SelectItem>
            <SelectItem value="auth" className="text-xs">Authentication</SelectItem>
            <SelectItem value="connection" className="text-xs">Connection</SelectItem>
            <SelectItem value="query" className="text-xs">Query</SelectItem>
            <SelectItem value="view" className="text-xs">View</SelectItem>
            <SelectItem value="data" className="text-xs">Data</SelectItem>
            <SelectItem value="schema" className="text-xs">Schema</SelectItem>
            <SelectItem value="system" className="text-xs">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label className="text-xs">Status</Label>
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => onFilterChange({ status: value === 'all' ? undefined : value })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Status</SelectItem>
            <SelectItem value="success" className="text-xs">Success</SelectItem>
            <SelectItem value="error" className="text-xs">Error</SelectItem>
            <SelectItem value="warning" className="text-xs">Warning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date From */}
      <div className="space-y-2">
        <Label className="text-xs">Date From</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-8 text-xs justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {filters.dateFrom ? format(filters.dateFrom, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateFrom}
              onSelect={(date) => onFilterChange({ dateFrom: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Date To */}
      <div className="space-y-2">
        <Label className="text-xs">Date To</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-8 text-xs justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {filters.dateTo ? format(filters.dateTo, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateTo}
              onSelect={(date) => onFilterChange({ dateTo: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
