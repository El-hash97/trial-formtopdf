"use client";

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
        <input
          type="checkbox"
          checked={mode === "range"}
          onChange={(event) => onModeChange(event.target.checked ? "range" : "single")}
        />
        Rentang tanggal
      </label>
      {mode === "single" ? (
        <input
          type="date"
          aria-label="Tanggal"
          value={start}
          onChange={(event) => onStartChange(event.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="Tanggal mulai"
            value={start}
            onChange={(event) => onStartChange(event.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <span>-</span>
          <input
            type="date"
            aria-label="Tanggal selesai"
            value={end}
            onChange={(event) => onEndChange(event.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
      )}
    </div>
  );
}
