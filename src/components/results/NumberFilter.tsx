import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NumberFilterProps {
  min?: number;
  max?: number;
  operator: string;
  includeNull: boolean;
  onApply: (operator: string, min?: number, max?: number, includeNull?: boolean) => void;
  onClear: () => void;
}

export function NumberFilter({ min, max, operator, includeNull, onApply, onClear }: NumberFilterProps) {
  const [op, setOp] = useState(operator || 'between');
  const [minValue, setMinValue] = useState(min?.toString() || '');
  const [maxValue, setMaxValue] = useState(max?.toString() || '');
  const [includeNullState, setIncludeNullState] = useState(includeNull);

  const handleApply = () => {
    const minNum = minValue ? Number(minValue) : undefined;
    const maxNum = maxValue ? Number(maxValue) : undefined;
    onApply(op, minNum, maxNum, includeNullState);
  };

  return (
    <div className="p-3 space-y-3">
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Operator</label>
        <Select value={op} onValueChange={setOp}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="eq">Equals</SelectItem>
            <SelectItem value="neq">Not Equals</SelectItem>
            <SelectItem value="gt">Greater Than</SelectItem>
            <SelectItem value="lt">Less Than</SelectItem>
            <SelectItem value="gte">Greater or Equal</SelectItem>
            <SelectItem value="lte">Less or Equal</SelectItem>
            <SelectItem value="between">Between</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {op === 'between' ? (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-muted-foreground">Min</label>
            <Input
              type="number"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              className="h-8 text-xs font-mono"
              placeholder="Min value"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Max</label>
            <Input
              type="number"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              className="h-8 text-xs font-mono"
              placeholder="Max value"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="text-xs text-muted-foreground">Value</label>
          <Input
            type="number"
            value={minValue}
            onChange={(e) => setMinValue(e.target.value)}
            className="h-8 text-xs font-mono"
            placeholder="Enter value"
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <Checkbox
          id="include-null-num"
          checked={includeNullState}
          onCheckedChange={(checked) => setIncludeNullState(!!checked)}
        />
        <label htmlFor="include-null-num" className="text-xs text-muted-foreground cursor-pointer">
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
