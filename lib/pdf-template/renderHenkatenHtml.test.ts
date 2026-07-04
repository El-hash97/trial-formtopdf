import { describe, it, expect } from "vitest";
import { renderHenkatenHtml } from "./renderHenkatenHtml";
import type { HenkatenFormDataInput } from "../form-schema";

function baseData(): HenkatenFormDataInput {
  return {
    judul: "Trial <Carbon> & Nitrogen",
    jenisHenkaten: "Lain-lain",
    jenisHenkatenManual: "Software",
    tujuan: "Menguji parameter baru",
    waktuMulai: "2025-09-13",
    waktuSelesai: "2025-09-30",
    shiftCount: 2,
    warnaShift: ["White", "Red"],
    bendaKerja: "Cylinder Block",
    lineHeader: "Melting",
    proses: "Melting",
    approval: {
      productionDphProd: "Aldino F",
      productionSecHead: "Paulus",
      engineeringDphEng: "Jarwanto",
      engineeringSecHead1: "Adhiputra",
      engineeringSecHead2: "Rio K",
      pemohon: "Hakim",
    },
    background: { descriptionHtml: '<p>Latar belakang</p><script>alert(1)</script>' },
    lineSections: [
      {
        id: "1",
        line: "Pouring",
        descriptionHtml: "<p>Deskripsi pouring</p>",
        waktuMode: "range",
        waktuStart: "2025-09-13",
        waktuEnd: "2025-09-30",
        pic: ["Sarmili", "Widodo"],
      },
    ],
  };
}

describe("renderHenkatenHtml", () => {
  it("escapes plain text fields", () => {
    const html = renderHenkatenHtml(baseData());
    expect(html).toContain("Trial &lt;Carbon&gt; &amp; Nitrogen");
    expect(html).not.toContain("<Carbon>");
  });

  it("renders a jenis henkaten table with all five options and marks the selected one", () => {
    const html = renderHenkatenHtml(baseData());
    ["Material", "Mesin", "Metode", "Man", "Lain-lain"].forEach((option) => {
      expect(html).toContain(`<th>${option}</th>`);
    });
    expect(html).toContain("jenis-selected");
    expect((html.match(/&#10003;/g) ?? []).length).toBe(1);
  });

  it("uses the manual jenis henkaten text when Lain-lain is selected", () => {
    const html = renderHenkatenHtml(baseData());
    expect(html).toContain("Software");
  });

  it("includes the combined jumlah/periode label", () => {
    const html = renderHenkatenHtml(baseData());
    expect(html).toContain("2 Shift (White Red)");
  });

  it("includes all six approval names", () => {
    const html = renderHenkatenHtml(baseData());
    ["Aldino F", "Paulus", "Jarwanto", "Adhiputra", "Rio K", "Hakim"].forEach((name) => {
      expect(html).toContain(name);
    });
  });

  it("gives every approval name column the same explicit width", () => {
    const html = renderHenkatenHtml(baseData());
    const colMatches = html.match(/<col style="width:16\.6667%" \/>/g) ?? [];
    expect(colMatches).toHaveLength(6);
  });

  it("includes an empty signature row above each approval name for manual signing", () => {
    const html = renderHenkatenHtml(baseData());
    const signatureMatches = html.match(/class="signature-cell"/g) ?? [];
    expect(signatureMatches).toHaveLength(6);
    const roleIndex = html.indexOf('class="role-cell"');
    const signatureIndex = html.indexOf('class="signature-cell"');
    const nameIndex = html.indexOf('class="name-cell"');
    expect(roleIndex).toBeLessThan(signatureIndex);
    expect(signatureIndex).toBeLessThan(nameIndex);
  });

  it("marks the Henkaten, Tujuan, and Waktu values for bold styling", () => {
    const html = renderHenkatenHtml(baseData());
    const valueCellMatches = html.match(/class="value-cell"/g) ?? [];
    expect(valueCellMatches).toHaveLength(3);
  });

  it("sanitizes the background rich text", () => {
    const html = renderHenkatenHtml(baseData());
    expect(html).toContain("Latar belakang");
    expect(html).not.toContain("<script>");
  });

  it("renders each dynamic line section with its line name, waktu, and PIC", () => {
    const html = renderHenkatenHtml(baseData());
    expect(html).toContain("Pouring");
    expect(html).toContain("Deskripsi pouring");
    expect(html).toContain("13 September 2025 - 30 September 2025");
    expect(html).toContain("Sarmili, Widodo");
  });

  it("includes the static bottom boilerplate sections", () => {
    const html = renderHenkatenHtml(baseData());
    expect(html).toContain("Item yang harus dikonfirmasi");
    expect(html).toContain("Distribusi informasi");
    expect(html).toContain("Engineering Quality");
    expect(html).toContain("Copy untuk yang berhubungan");
  });

  it("falls back to the LOGO text placeholder when no logo file is present", () => {
    const html = renderHenkatenHtml(baseData());
    expect(html).toContain('<div class="logo-box">LOGO</div>');
  });
});
