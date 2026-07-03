"use client";

import { useFormContext } from "react-hook-form";
import type { HenkatenFormDataInput } from "../../lib/form-schema";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

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
    <fieldset className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {FIELDS.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <Label htmlFor={`approval-${field.name}`}>{field.label}</Label>
          <Input id={`approval-${field.name}`} {...register(`approval.${field.name}`)} />
        </div>
      ))}
    </fieldset>
  );
}
