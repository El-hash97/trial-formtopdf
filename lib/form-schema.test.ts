import { describe, it, expect } from "vitest";
import {
  henkatenFormSchema,
  getLineSectionWarnings,
  buildPreviewSafeData,
  type HenkatenFormDataInput,
} from "./form-schema";

function baseData(): HenkatenFormDataInput {
  return {
    judul: "Trial Carbon",
    jenisHenkaten: "Material",
    jenisHenkatenManual: "",
    tujuan: "Menguji sesuatu",
    waktuMulai: "2025-09-13",
    waktuSelesai: "2025-09-30",
    shiftCount: 2,
    warnaShift: ["White", "Red"],
    bendaKerja: "Cylinder Block",
    lineHeader: "Melting",
    proses: "Melting",
    approval: {
      productionDphProd: "",
      productionSecHead: "",
      engineeringDphEng: "",
      engineeringSecHead1: "",
      engineeringSecHead2: "",
      pemohon: "",
    },
    background: { descriptionHtml: "<p>Latar belakang</p>" },
    lineSections: [],
  };
}

describe("henkatenFormSchema", () => {
  it("accepts a fully valid payload", () => {
    const result = henkatenFormSchema.safeParse(baseData());
    expect(result.success).toBe(true);
  });

  it("rejects a payload missing judul", () => {
    const result = henkatenFormSchema.safeParse({ ...baseData(), judul: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a payload with an unknown line option", () => {
    const data = baseData();
    data.lineSections = [
      {
        id: "1",
        // @ts-expect-error testing invalid enum value
        line: "NotARealLine",
        descriptionHtml: "<p>x</p>",
        waktuMode: "single",
        waktuStart: "2025-09-13",
        waktuEnd: "",
        pic: ["Budi"],
      },
    ];
    const result = henkatenFormSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe("getLineSectionWarnings", () => {
  it("returns no warnings when every section has a description and PIC", () => {
    const data = baseData();
    data.lineSections = [
      {
        id: "1",
        line: "Melting",
        descriptionHtml: "<p>Isi deskripsi</p>",
        waktuMode: "single",
        waktuStart: "2025-09-13",
        waktuEnd: "",
        pic: ["Budi"],
      },
    ];
    expect(getLineSectionWarnings(data)).toEqual([]);
  });

  it("warns about an empty description", () => {
    const data = baseData();
    data.lineSections = [
      {
        id: "1",
        line: "Melting",
        descriptionHtml: "",
        waktuMode: "single",
        waktuStart: "2025-09-13",
        waktuEnd: "",
        pic: ["Budi"],
      },
    ];
    const warnings = getLineSectionWarnings(data);
    expect(warnings).toContain("Section Line ke-1 (Melting) belum diisi deskripsinya.");
  });

  it("warns about a missing PIC", () => {
    const data = baseData();
    data.lineSections = [
      {
        id: "1",
        line: "Melting",
        descriptionHtml: "<p>Isi</p>",
        waktuMode: "single",
        waktuStart: "2025-09-13",
        waktuEnd: "",
        pic: [],
      },
    ];
    const warnings = getLineSectionWarnings(data);
    expect(warnings).toContain("Section Line ke-1 (Melting) belum ada PIC.");
  });
});

describe("buildPreviewSafeData", () => {
  it("fills judul, lineHeader, and proses with placeholders when empty", () => {
    const data = baseData();
    data.judul = "";
    data.lineHeader = "";
    data.proses = "";
    const safe = buildPreviewSafeData(data);
    expect(safe.judul).toBe("(Preview)");
    expect(safe.lineHeader).toBe("-");
    expect(safe.proses).toBe("-");
  });

  it("fills waktuMulai with today's ISO date and waktuSelesai to match when both empty", () => {
    const data = baseData();
    data.waktuMulai = "";
    data.waktuSelesai = "";
    const safe = buildPreviewSafeData(data);
    const todayISO = new Date().toISOString().slice(0, 10);
    expect(safe.waktuMulai).toBe(todayISO);
    expect(safe.waktuSelesai).toBe(todayISO);
  });

  it("keeps waktuSelesai equal to waktuMulai when only waktuSelesai is empty", () => {
    const data = baseData();
    data.waktuMulai = "2025-09-13";
    data.waktuSelesai = "";
    const safe = buildPreviewSafeData(data);
    expect(safe.waktuSelesai).toBe("2025-09-13");
  });

  it("leaves already-filled fields untouched", () => {
    const data = baseData();
    const safe = buildPreviewSafeData(data);
    expect(safe).toEqual(data);
  });

  it("always produces a payload that passes henkatenFormSchema", () => {
    const data = baseData();
    data.judul = "";
    data.waktuMulai = "";
    data.waktuSelesai = "";
    data.lineHeader = "";
    data.proses = "";
    const safe = buildPreviewSafeData(data);
    const result = henkatenFormSchema.safeParse(safe);
    expect(result.success).toBe(true);
  });

  it("does not mutate the input object", () => {
    const data = baseData();
    data.judul = "";
    const original = { ...data };
    buildPreviewSafeData(data);
    expect(data).toEqual(original);
  });
});
