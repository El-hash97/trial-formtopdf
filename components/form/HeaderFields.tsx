"use client";

import { useFormContext } from "react-hook-form";
import type { HenkatenFormDataInput } from "../../lib/form-schema";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";

const JENIS_OPTIONS = ["Material", "Mesin", "Metode", "Man", "Lain-lain"] as const;

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function HeaderFields() {
  const { register, watch } = useFormContext<HenkatenFormDataInput>();
  const jenisHenkaten = watch("jenisHenkaten");
  const shiftCount = watch("shiftCount");
  const warnaShift = watch("warnaShift");

  return (
    <fieldset className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="judul">Judul Trial/Henkaten</Label>
        <Input id="judul" {...register("judul")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="jenisHenkaten">Jenis Henkaten</Label>
        <select id="jenisHenkaten" {...register("jenisHenkaten")} className={SELECT_CLASS}>
          {JENIS_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {jenisHenkaten === "Lain-lain" && (
          <Input
            {...register("jenisHenkatenManual")}
            placeholder="Tulis jenis henkaten"
            className="mt-2"
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tujuan">Tujuan / Pelaksanaan Henkaten</Label>
        <Textarea id="tujuan" {...register("tujuan")} rows={3} />
      </div>

      <div className="flex gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="waktuMulai">Waktu Mulai</Label>
          <Input id="waktuMulai" type="date" {...register("waktuMulai")} className="w-auto" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="waktuSelesai">Waktu Selesai</Label>
          <Input id="waktuSelesai" type="date" {...register("waktuSelesai")} className="w-auto" />
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="block text-sm font-medium">Jumlah/Periode</span>
        <div className="flex items-center gap-4">
          <label htmlFor="shiftCount" className="sr-only">Jumlah/Periode Shift</label>
          <select
            id="shiftCount"
            aria-label="Jumlah/Periode Shift"
            {...register("shiftCount", { valueAsNumber: true })}
            className="h-10 w-auto rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value={1}>1 Shift</option>
            <option value={2}>2 Shift</option>
          </select>
          <label className="flex items-center gap-1.5 text-sm">
            <Checkbox value="White" {...register("warnaShift")} /> White
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <Checkbox value="Red" {...register("warnaShift")} /> Red
          </label>
        </div>
        <p className="text-xs text-muted-foreground" data-testid="jumlah-periode-preview">
          {shiftCount} Shift{warnaShift?.length ? ` (${warnaShift.join(" ")})` : ""}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bendaKerja">Benda Kerja</Label>
        <Input id="bendaKerja" {...register("bendaKerja")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lineHeader">Line</Label>
        <Input id="lineHeader" {...register("lineHeader")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="proses">Proses</Label>
        <Input id="proses" {...register("proses")} />
      </div>
    </fieldset>
  );
}
