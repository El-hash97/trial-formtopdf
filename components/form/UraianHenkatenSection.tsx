"use client";

import { useFormContext } from "react-hook-form";
import type { HenkatenFormDataInput } from "../../lib/form-schema";
import { RichTextEditor } from "./RichTextEditor";
import { DateRangeToggle } from "./DateRangeToggle";
import { PicInput } from "./PicInput";

const LINE_OPTIONS = [
  "Melting",
  "Pouring",
  "Analysis",
  "Moulding",
  "RCS",
  "Core Making",
  "Finishing",
  "Maintenance",
  "Die Press",
  "Engineering",
] as const;

interface UraianHenkatenSectionProps {
  index: number;
  onRemove: () => void;
}

export function UraianHenkatenSection({ index, onRemove }: UraianHenkatenSectionProps) {
  const { register, watch, setValue } = useFormContext<HenkatenFormDataInput>();
  const base = `lineSections.${index}` as const;

  const descriptionHtml = watch(`${base}.descriptionHtml`);
  const waktuMode = watch(`${base}.waktuMode`);
  const waktuStart = watch(`${base}.waktuStart`);
  const waktuEnd = watch(`${base}.waktuEnd`);
  const pic = watch(`${base}.pic`);

  return (
    <div className="space-y-2 rounded border border-gray-300 p-3">
      <div className="flex items-center justify-between">
        <select {...register(`${base}.line`)} className="rounded border border-gray-300 px-2 py-1 text-sm">
          {LINE_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-red-600"
          aria-label={`Hapus section ${index + 1}`}
        >
          Hapus
        </button>
      </div>

      <RichTextEditor
        value={descriptionHtml}
        onChange={(html) => setValue(`${base}.descriptionHtml`, html)}
        placeholder="Deskripsi"
      />

      <DateRangeToggle
        mode={waktuMode}
        start={waktuStart}
        end={waktuEnd}
        onModeChange={(mode) => setValue(`${base}.waktuMode`, mode)}
        onStartChange={(value) => setValue(`${base}.waktuStart`, value)}
        onEndChange={(value) => setValue(`${base}.waktuEnd`, value)}
      />

      <PicInput value={pic} onChange={(next) => setValue(`${base}.pic`, next)} />
    </div>
  );
}
