"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";

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
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Umum</CardTitle>
          </CardHeader>
          <CardContent>
            <HeaderFields />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <ApprovalFields />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Background</CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              value={backgroundHtml}
              onChange={(html) => methods.setValue("background.descriptionHtml", html)}
              placeholder="Deskripsi background"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uraian Henkaten per Line</CardTitle>
          </CardHeader>
          <CardContent>
            <LineSectionList />
          </CardContent>
        </Card>

        {warnings.length > 0 && (
          <Alert role="status">
            <AlertDescription>
              <ul>
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {submitError && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isGenerating} className="w-full sm:w-auto">
          {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
          {isGenerating ? "Membuat PDF..." : "Generate PDF"}
        </Button>
      </form>
    </FormProvider>
  );
}
