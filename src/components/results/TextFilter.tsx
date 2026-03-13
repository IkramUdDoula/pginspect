import { useState, useMemo } from "react";
import { Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface TextFilterProps {
  values: string[];
  selectedValues: string[];
  includeNull: boolean;
  onApply: (selected: string[], includeNull: boolean) => void;
  onClear: () => void;
}

export function TextFilter({ values, selectedValues, includeNull, onApply, onClear }: TextFilterProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedValues));
  const [includeNullState, setIncludeNullState] = useState(includeNull);
  const [search, setSearch] = useState("");

  const filteredValues = useMemo(() => {
    if (!search) return values;
    return values.filter(v => v.toLowerCase().includes(search.toLowerCase()));
  }, [values, search]);

  const toggleValue = (value: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(value)) {
      newSelected.delete(value);
    } else {
      newSelected.add(value);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    setSelected(new Set(filteredValues));
  };

  const clearAll = () => {
    setSelected(new Set());
  };

  const handleApply = () => {
    onApply(Array.from(selected), includeNullState);
  };

  return (
    <div className="flex flex-col h-full">
      <Command className="border-0">
        <CommandInput 
          placeholder="Search values..." 
          value={search}
          onValueChange={setSearch}
          className="h-9"
        />
        <CommandList className="max-h-[240px] scrollbar-thin">
          <CommandEmpty>No values found</CommandEmpty>
          <CommandGroup>
            {filteredValues.map((value) => (
              <CommandItem
                key={value}
                onSelect={() => toggleValue(value)}
                className="cursor-pointer hover:bg-surface-hover data-[selected=true]:bg-surface-hover"
              >
                <Checkbox
                  checked={selected.has(value)}
                  className="mr-2"
                />
                <span className="font-mono text-xs truncate">{value}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>

      <div className="px-2 py-2 border-t border-border space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="include-null"
            checked={includeNullState}
            onCheckedChange={(checked) => setIncludeNullState(!!checked)}
          />
          <label htmlFor="include-null" className="text-xs text-muted-foreground cursor-pointer">
            Include NULL values
          </label>
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={selectAll} className="flex-1 h-7 text-xs">
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAll} className="flex-1 h-7 text-xs">
            Clear
          </Button>
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onClear} className="flex-1 h-8 text-xs">
            Clear Filter
          </Button>
          <Button 
            size="sm" 
            onClick={handleApply} 
            disabled={selected.size === 0 && !includeNullState}
            className="flex-1 h-8 text-xs"
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
