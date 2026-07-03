"use client";

import { useState, type KeyboardEvent } from "react";

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
    <div className="flex flex-wrap gap-1 rounded border border-gray-300 p-2">
      {value.map((name, index) => (
        <span
          key={`${name}-${index}`}
          className="flex items-center gap-1 rounded bg-gray-200 px-2 py-0.5 text-sm"
        >
          {name}
          <button
            type="button"
            aria-label={`Hapus ${name}`}
            onClick={() => removeName(index)}
            className="text-gray-500 hover:text-red-600"
          >
            &times;
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addName}
        placeholder="Ketik nama, Enter untuk tambah"
        className="min-w-[140px] flex-1 border-none text-sm outline-none"
      />
    </div>
  );
}
