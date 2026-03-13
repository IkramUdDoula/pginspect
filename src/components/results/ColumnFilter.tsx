import { useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ListFilter } from "lucide-react";
import { TextFilter } from "./TextFilter";
import { NumberFilter } from "./NumberFilter";
import { BooleanFilter } from "./BooleanFilter";
import { detectFilterType, extractUniqueValues } from "@/lib/filterHelpers";
import type { ColumnFilter as ColumnFilterType } from "@/shared/types";

interface ColumnFilterProps {
  columnName: string;
  columnType: string;
  rows: Record<string, unknown>[];
  currentFilter?: ColumnFilterType;
  onApplyFilter: (filter: ColumnFilterType) => void;
  onClearFilter: () => void;
}

export function ColumnFilter({
  columnName,
  columnType,
  rows,
  currentFilter,
  onApplyFilter,
  onClearFilter,
}: ColumnFilterProps) {
  const filterType = detectFilterType(columnType);
  const uniqueValues = useMemo(() => {
    if (filterType === 'text' || filterType === 'enum') {
      return extractUniqueValues(rows, columnName);
    }
    return [];
  }, [rows, columnName, filterType]);

  const handleTextApply = (selected: string[], includeNull: boolean) => {
    onApplyFilter({
      column: columnName,
      type: 'text',
      operator: 'in',
      value: selected,
      includeNull,
    });
  };

  const handleNumberApply = (operator: string, min?: number, max?: number, includeNull?: boolean) => {
    if (operator === 'between' && min !== undefined && max !== undefined) {
      onApplyFilter({
        column: columnName,
        type: 'number',
        operator: 'between',
        value: [min, max],
        includeNull: includeNull || false,
      });
    } else if (min !== undefined) {
      onApplyFilter({
        column: columnName,
        type: 'number',
        operator: operator as any,
        value: min,
        includeNull: includeNull || false,
      });
    }
  };

  const handleBooleanApply = (value: boolean | null, includeNull: boolean) => {
    if (value !== null) {
      onApplyFilter({
        column: columnName,
        type: 'boolean',
        operator: 'eq',
        value,
        includeNull,
      });
    } else if (includeNull) {
      onApplyFilter({
        column: columnName,
        type: 'boolean',
        operator: 'eq',
        value: null,
        includeNull: true,
      });
    }
  };

  const renderFilterContent = () => {
    switch (filterType) {
      case 'text':
      case 'enum':
        return (
          <TextFilter
            values={uniqueValues}
            selectedValues={
              currentFilter?.operator === 'in' && Array.isArray(currentFilter.value)
                ? currentFilter.value.map(String)
                : []
            }
            includeNull={currentFilter?.includeNull || false}
            onApply={handleTextApply}
            onClear={onClearFilter}
          />
        );

      case 'number':
        const isRange = currentFilter?.operator === 'between' && Array.isArray(currentFilter.value);
        return (
          <NumberFilter
            min={isRange ? currentFilter.value[0] : typeof currentFilter?.value === 'number' ? currentFilter.value : undefined}
            max={isRange ? currentFilter.value[1] : undefined}
            operator={currentFilter?.operator || 'between'}
            includeNull={currentFilter?.includeNull || false}
            onApply={handleNumberApply}
            onClear={onClearFilter}
          />
        );

      case 'boolean':
        return (
          <BooleanFilter
            value={typeof currentFilter?.value === 'boolean' ? currentFilter.value : null}
            includeNull={currentFilter?.includeNull || false}
            onApply={handleBooleanApply}
            onClear={onClearFilter}
          />
        );

      default:
        return <div className="p-3 text-xs text-muted-foreground">Filter not available</div>;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-5 w-5 p-0 hover:bg-surface-hover ${currentFilter ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <ListFilter className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        {renderFilterContent()}
      </PopoverContent>
    </Popover>
  );
}
