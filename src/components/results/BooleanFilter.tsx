import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface BooleanFilterProps {
  value: boolean | null;
  includeNull: boolean;
  onApply: (value: boolean | null, includeNull: boolean) => void;
  onClear: () => void;
}

export function BooleanFilter({ value, includeNull, onApply, onClear }: BooleanFilterProps) {
  const [selected, setSelected] = useState<boolean | null>(value);
  const [includeNullState, setIncludeNullState] = useState(includeNull);

  const handleApply = () => {
    onApply(selected, includeNullState);
  };

  return (
    <div className="p-3 space-y-3">
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Value</label>
        <div className="space-y-1">
          <div
            onClick={() => setSelected(null)}
            className={`px-3 py-2 rounded-md border cursor-pointer transition-colors text-xs ${
              selected === null ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-hover'
            }`}
          >
            All values
          </div>
          <div
            onClick={() => setSelected(true)}
            className={`px-3 py-2 rounded-md border cursor-pointer transition-colors text-xs ${
              selected === true ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-hover'
            }`}
          >
            True
          </div>
          <div
            onClick={() => setSelected(false)}
            className={`px-3 py-2 rounded-md border cursor-pointer transition-colors text-xs ${
              selected === false ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-hover'
            }`}
          >
            False
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="include-null-bool"
          checked={includeNullState}
          onCheckedChange={(checked) => setIncludeNullState(!!checked)}
        />
        <label htmlFor="include-null-bool" className="text-xs text-muted-foreground cursor-pointer">
          Include NULL values
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={onClear} className="flex-1 h-8 text-xs">
          Clear
        </Button>
        <Button size="sm" onClick={handleApply} className="flex-1 h-8 text-xs">
          Apply
        </Button>
      </div>
    </div>
  );
}
