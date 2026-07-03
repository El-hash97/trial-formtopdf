"use client";

import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";

interface DateRangeToggleProps {
  mode: "single" | "range";
  start: string;
  end: string;
  onModeChange: (mode: "single" | "range") => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}

export function DateRangeToggle({
  mode,
  start,
  end,
  onModeChange,
  onStartChange,
  onEndChange,
}: DateRangeToggleProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={mode === "range"}
          onChange={(event) => onModeChange(event.target.checked ? "range" : "single")}
        />
        Rentang tanggal
      </label>
      {mode === "single" ? (
        <Input
          type="date"
          aria-label="Tanggal"
          value={start}
          onChange={(event) => onStartChange(event.target.value)}
          className="w-auto text-sm"
        />
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="Tanggal mulai"
            value={start}
            onChange={(event) => onStartChange(event.target.value)}
            className="w-auto text-sm"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="date"
            aria-label="Tanggal selesai"
            value={end}
            onChange={(event) => onEndChange(event.target.value)}
            className="w-auto text-sm"
          />
        </div>
      )}
    </div>
  );
}
