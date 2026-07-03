"use client";

import { useFormContext } from "react-hook-form";
import { Trash2 } from "lucide-react";
import type { HenkatenFormDataInput } from "../../lib/form-schema";
import { RichTextEditor } from "./RichTextEditor";
import { DateRangeToggle } from "./DateRangeToggle";
import { PicInput } from "./PicInput";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

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
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <select
            {...register(`${base}.line`)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {LINE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={`Hapus section ${index + 1}`}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </Button>
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
      </CardContent>
    </Card>
  );
}
