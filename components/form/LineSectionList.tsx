"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import type { HenkatenFormDataInput, LineSectionInput } from "../../lib/form-schema";
import { UraianHenkatenSection } from "./UraianHenkatenSection";

function createEmptyLineSection(): LineSectionInput {
  return {
    id: crypto.randomUUID(),
    line: "Melting",
    descriptionHtml: "",
    waktuMode: "single",
    waktuStart: "",
    waktuEnd: "",
    pic: [],
  };
}

export function LineSectionList() {
  const { control } = useFormContext<HenkatenFormDataInput>();
  const { fields, append, remove } = useFieldArray({ control, name: "lineSections" });

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <UraianHenkatenSection key={field.id} index={index} onRemove={() => remove(index)} />
      ))}
      <button
        type="button"
        onClick={() => append(createEmptyLineSection())}
        className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
      >
        + Tambah Section Line
      </button>
    </div>
  );
}
