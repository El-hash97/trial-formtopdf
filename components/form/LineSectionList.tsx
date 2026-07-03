"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import type { HenkatenFormDataInput, LineSectionInput } from "../../lib/form-schema";
import { UraianHenkatenSection } from "./UraianHenkatenSection";
import { Button } from "../ui/button";

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
    <div className="space-y-4">
      {fields.map((field, index) => (
        <UraianHenkatenSection key={field.id} index={index} onRemove={() => remove(index)} />
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => append(createEmptyLineSection())}
        className="w-full border-dashed"
      >
        + Tambah Section Line
      </Button>
    </div>
  );
}
