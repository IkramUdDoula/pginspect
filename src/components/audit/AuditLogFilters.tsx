import { useState } from 'react';
import type { AuditLogFilter } from '@/shared/types';
import { AUDIT_CATEGORIES, AUDIT_STATUSES } from '@/shared/types';
import { Button } from '@/components/ui/button';
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
  const clearFilters = () => {
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
            {AUDIT_CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value} className="text-xs">
                {category.label}
              </SelectItem>
            ))}
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
            {AUDIT_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value} className="text-xs">
                {status.label}
              </SelectItem>
            ))}
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
