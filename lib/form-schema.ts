import { z } from "zod";

export const lineOptionsEnum = z.enum([
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
]);

export const jenisHenkatenEnum = z.enum(["Material", "Mesin", "Metode", "Man", "Lain-lain"]);
export const warnaShiftEnum = z.enum(["White", "Red"]);

export const lineSectionSchema = z.object({
  id: z.string(),
  line: lineOptionsEnum,
  descriptionHtml: z.string(),
  waktuMode: z.enum(["single", "range"]),
  waktuStart: z.string(),
  waktuEnd: z.string(),
  pic: z.array(z.string()),
});

export const henkatenFormSchema = z.object({
  judul: z.string().min(1, "Judul wajib diisi"),
  jenisHenkaten: jenisHenkatenEnum,
  jenisHenkatenManual: z.string(),
  tujuan: z.string(),
  waktuMulai: z.string().min(1, "Waktu mulai wajib diisi"),
  waktuSelesai: z.string().min(1, "Waktu selesai wajib diisi"),
  shiftCount: z.union([z.literal(1), z.literal(2)]),
  warnaShift: z.array(warnaShiftEnum),
  bendaKerja: z.string(),
  lineHeader: z.string().min(1, "Line wajib diisi"),
  proses: z.string().min(1, "Proses wajib diisi"),
  approval: z.object({
    productionDphProd: z.string(),
    productionSecHead: z.string(),
    engineeringDphEng: z.string(),
    engineeringSecHead1: z.string(),
    engineeringSecHead2: z.string(),
    pemohon: z.string(),
  }),
  background: z.object({ descriptionHtml: z.string() }),
  lineSections: z.array(lineSectionSchema),
});

export type HenkatenFormDataInput = z.infer<typeof henkatenFormSchema>;
export type LineSectionInput = z.infer<typeof lineSectionSchema>;

function isEmptyDescription(html: string): boolean {
  const stripped = html.replace(/<[^>]*>/g, "").trim();
  return stripped.length === 0;
}

export function getLineSectionWarnings(data: HenkatenFormDataInput): string[] {
  const warnings: string[] = [];
  data.lineSections.forEach((section, index) => {
    if (isEmptyDescription(section.descriptionHtml)) {
      warnings.push(`Section Line ke-${index + 1} (${section.line}) belum diisi deskripsinya.`);
    }
    if (section.pic.length === 0) {
      warnings.push(`Section Line ke-${index + 1} (${section.line}) belum ada PIC.`);
    }
  });
  return warnings;
}
