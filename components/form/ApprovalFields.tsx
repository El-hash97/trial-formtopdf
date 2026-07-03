"use client";

import { useFormContext } from "react-hook-form";
import type { HenkatenFormDataInput } from "../../lib/form-schema";

const FIELDS: { name: keyof HenkatenFormDataInput["approval"]; label: string }[] = [
  { name: "productionDphProd", label: "Production - DpH.Prod" },
  { name: "productionSecHead", label: "Production - Sec.Head" },
  { name: "engineeringDphEng", label: "Engineering - DpH.Eng" },
  { name: "engineeringSecHead1", label: "Engineering - Sec.Head 1" },
  { name: "engineeringSecHead2", label: "Engineering - Sec.Head 2" },
  { name: "pemohon", label: "Pemohon" },
];

export function ApprovalFields() {
  const { register } = useFormContext<HenkatenFormDataInput>();

  return (
    <fieldset className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {FIELDS.map((field) => (
        <div key={field.name}>
          <label htmlFor={`approval-${field.name}`} className="block text-sm font-medium">
            {field.label}
          </label>
          <input
            id={`approval-${field.name}`}
            {...register(`approval.${field.name}`)}
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          />
        </div>
      ))}
    </fieldset>
  );
}
