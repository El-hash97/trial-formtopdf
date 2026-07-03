"use client";

import { useState, type KeyboardEvent } from "react";
import { Badge } from "../ui/badge";

interface PicInputProps {
  value: string[];
  onChange: (next: string[]) => void;
}

export function PicInput({ value, onChange }: PicInputProps) {
  const [draft, setDraft] = useState("");

  function addName() {
    const name = draft.trim();
    if (!name) return;
    onChange([...value, name]);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addName();
    }
  }

  function removeName(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background p-2 focus-within:ring-2 focus-within:ring-ring">
      {value.map((name, index) => (
        <Badge key={`${name}-${index}`} className="gap-1 py-1">
          {name}
          <button
            type="button"
            aria-label={`Hapus ${name}`}
            onClick={() => removeName(index)}
            className="text-muted-foreground hover:text-destructive"
          >
            &times;
          </button>
        </Badge>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addName}
        placeholder="Ketik nama, Enter untuk tambah"
        className="min-w-[140px] flex-1 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
