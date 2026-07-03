"use client";

import { useFormContext } from "react-hook-form";
import type { HenkatenFormDataInput } from "../../lib/form-schema";

const JENIS_OPTIONS = ["Material", "Mesin", "Metode", "Man", "Lain-lain"] as const;

export function HeaderFields() {
  const { register, watch } = useFormContext<HenkatenFormDataInput>();
  const jenisHenkaten = watch("jenisHenkaten");
  const shiftCount = watch("shiftCount");
  const warnaShift = watch("warnaShift");

  return (
    <fieldset className="space-y-3">
      <div>
        <label htmlFor="judul" className="block text-sm font-medium">Judul Trial/Henkaten</label>
        <input id="judul" {...register("judul")} className="mt-1 w-full rounded border border-gray-300 px-2 py-1" />
      </div>

      <div>
        <label htmlFor="jenisHenkaten" className="block text-sm font-medium">Jenis Henkaten</label>
        <select
          id="jenisHenkaten"
          {...register("jenisHenkaten")}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
        >
          {JENIS_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {jenisHenkaten === "Lain-lain" && (
          <input
            {...register("jenisHenkatenManual")}
            placeholder="Tulis jenis henkaten"
            className="mt-2 w-full rounded border border-gray-300 px-2 py-1"
          />
        )}
      </div>

      <div>
        <label htmlFor="tujuan" className="block text-sm font-medium">Tujuan / Pelaksanaan Henkaten</label>
        <textarea id="tujuan" {...register("tujuan")} rows={3} className="mt-1 w-full rounded border border-gray-300 px-2 py-1" />
      </div>

      <div className="flex gap-2">
        <div>
          <label htmlFor="waktuMulai" className="block text-sm font-medium">Waktu Mulai</label>
          <input id="waktuMulai" type="date" {...register("waktuMulai")} className="mt-1 rounded border border-gray-300 px-2 py-1" />
        </div>
        <div>
          <label htmlFor="waktuSelesai" className="block text-sm font-medium">Waktu Selesai</label>
          <input id="waktuSelesai" type="date" {...register("waktuSelesai")} className="mt-1 rounded border border-gray-300 px-2 py-1" />
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium">Jumlah/Periode</span>
        <div className="mt-1 flex items-center gap-4">
          <label htmlFor="shiftCount" className="sr-only">Jumlah/Periode Shift</label>
          <select
            id="shiftCount"
            aria-label="Jumlah/Periode Shift"
            {...register("shiftCount", { valueAsNumber: true })}
            className="rounded border border-gray-300 px-2 py-1"
          >
            <option value={1}>1 Shift</option>
            <option value={2}>2 Shift</option>
          </select>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" value="White" {...register("warnaShift")} /> White
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" value="Red" {...register("warnaShift")} /> Red
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500" data-testid="jumlah-periode-preview">
          {shiftCount} Shift{warnaShift?.length ? ` (${warnaShift.join(" ")})` : ""}
        </p>
      </div>

      <div>
        <label htmlFor="bendaKerja" className="block text-sm font-medium">Benda Kerja</label>
        <input id="bendaKerja" {...register("bendaKerja")} className="mt-1 w-full rounded border border-gray-300 px-2 py-1" />
      </div>

      <div>
        <label htmlFor="lineHeader" className="block text-sm font-medium">Line</label>
        <input id="lineHeader" {...register("lineHeader")} className="mt-1 w-full rounded border border-gray-300 px-2 py-1" />
      </div>

      <div>
        <label htmlFor="proses" className="block text-sm font-medium">Proses</label>
        <input id="proses" {...register("proses")} className="mt-1 w-full rounded border border-gray-300 px-2 py-1" />
      </div>
    </fieldset>
  );
}
