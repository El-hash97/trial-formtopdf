"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  henkatenFormSchema,
  getLineSectionWarnings,
  type HenkatenFormDataInput,
} from "../../lib/form-schema";
import { buildFileName } from "../../lib/format-helpers";
import { HeaderFields } from "./HeaderFields";
import { ApprovalFields } from "./ApprovalFields";
import { LineSectionList } from "./LineSectionList";
import { RichTextEditor } from "./RichTextEditor";

const DEFAULT_VALUES: HenkatenFormDataInput = {
  judul: "",
  jenisHenkaten: "Material",
  jenisHenkatenManual: "",
  tujuan: "",
  waktuMulai: "",
  waktuSelesai: "",
  shiftCount: 1,
  warnaShift: [],
  bendaKerja: "",
  lineHeader: "",
  proses: "",
  approval: {
    productionDphProd: "",
    productionSecHead: "",
    engineeringDphEng: "",
    engineeringSecHead1: "",
    engineeringSecHead2: "",
    pemohon: "",
  },
  background: { descriptionHtml: "" },
  lineSections: [],
};

export function HenkatenForm() {
  const methods = useForm<HenkatenFormDataInput>({
    resolver: zodResolver(henkatenFormSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function onSubmit(data: HenkatenFormDataInput) {
    setSubmitError(null);
    setWarnings(getLineSectionWarnings(data));
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Gagal generate PDF");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = buildFileName(data.judul, data.waktuMulai);
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Gagal generate PDF");
    } finally {
      setIsGenerating(false);
    }
  }

  const backgroundHtml = methods.watch("background.descriptionHtml");

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="mx-auto max-w-3xl space-y-6 p-6">
        <HeaderFields />
        <ApprovalFields />

        <div>
          <label className="block text-sm font-medium">Background</label>
          <RichTextEditor
            value={backgroundHtml}
            onChange={(html) => methods.setValue("background.descriptionHtml", html)}
            placeholder="Deskripsi background"
          />
        </div>

        <LineSectionList />

        {warnings.length > 0 && (
          <ul className="rounded border border-yellow-400 bg-yellow-50 p-3 text-sm text-yellow-800" role="status">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}

        {submitError && (
          <p role="alert" className="text-sm text-red-600">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={isGenerating}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {isGenerating ? "Membuat PDF..." : "Generate PDF"}
        </button>
      </form>
    </FormProvider>
  );
}
