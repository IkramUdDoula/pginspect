import { useState, useEffect } from 'react';
import type { AuditLogFilter } from '@/shared/types';
import { AUDIT_CATEGORIES, AUDIT_STATUSES } from '@/shared/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, X, Mail, Check, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

interface AuditLogFiltersProps {
  filters: AuditLogFilter;
  onFilterChange: (filters: Partial<AuditLogFilter>) => void;
}

export function AuditLogFilters({ filters, onFilterChange }: AuditLogFiltersProps) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [userEmails, setUserEmails] = useState<string[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);

  // Fetch user emails on mount
  useEffect(() => {
    const fetchEmails = async () => {
      setLoadingEmails(true);
      try {
        const response = await apiClient.getAuditUserEmails();
        if (response.success && response.data) {
          setUserEmails(response.data.emails);
        } else {
          console.error('Failed to fetch user emails:', response.error);
        }
      } catch (error) {
        console.error('Failed to fetch user emails:', error);
      } finally {
        setLoadingEmails(false);
      }
    };

    fetchEmails();
  }, []);

  const clearFilters = () => {
    onFilterChange({
      userEmail: undefined,
      actionCategory: undefined,
      actionType: undefined,
      status: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      searchQuery: undefined,
    });
  };

  const hasActiveFilters = 
    filters.userEmail ||
    filters.actionCategory ||
    filters.actionType ||
    filters.status ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.searchQuery;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* User Email */}
      <div className="flex-1 min-w-[180px]">
        <Popover open={emailOpen} onOpenChange={setEmailOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={emailOpen}
              className="w-full h-9 justify-between text-xs font-medium border-border/60 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">
                  {filters.userEmail || "Filter by user..."}
                </span>
              </div>
              <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search users..." className="h-9 text-xs" />
              <CommandList>
                <CommandEmpty>
                  {loadingEmails ? 'Loading...' : 'No users found.'}
                </CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all-users"
                    onSelect={() => {
                      onFilterChange({ userEmail: undefined });
                      setEmailOpen(false);
                    }}
                    className="text-xs"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3.5 w-3.5",
                        !filters.userEmail ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All Users
                  </CommandItem>
                  {userEmails.map((email) => (
                    <CommandItem
                      key={email}
                      value={email}
                      onSelect={(currentValue) => {
                        onFilterChange({ userEmail: currentValue === filters.userEmail ? undefined : currentValue });
                        setEmailOpen(false);
                      }}
                      className="text-xs"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3.5 w-3.5",
                          filters.userEmail === email ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {email}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Category */}
      <div className="flex-1 min-w-[140px]">
        <Select
          value={filters.actionCategory || 'all'}
          onValueChange={(value) => onFilterChange({ actionCategory: value === 'all' ? undefined : value })}
        >
          <SelectTrigger className="h-9 text-xs font-medium border-border/60 hover:border-primary/50 transition-colors">
            <SelectValue placeholder="All Categories" />
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
      <div className="flex-1 min-w-[120px]">
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => onFilterChange({ status: value === 'all' ? undefined : value })}
        >
          <SelectTrigger className="h-9 text-xs font-medium border-border/60 hover:border-primary/50 transition-colors">
            <SelectValue placeholder="All Status" />
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
      <div className="flex-1 min-w-[140px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-9 text-xs justify-start text-left font-medium border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <span className="truncate">{filters.dateFrom ? format(filters.dateFrom, 'MMM d, yyyy') : 'Date From'}</span>
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
      <div className="flex-1 min-w-[140px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-9 text-xs justify-start text-left font-medium border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <span className="truncate">{filters.dateTo ? format(filters.dateTo, 'MMM d, yyyy') : 'Date To'}</span>
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

      {/* Clear Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9 text-xs px-3 font-medium hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <X className="h-3.5 w-3.5 mr-1.5" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
