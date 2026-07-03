// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const generatePdfBufferMock = vi.fn();

vi.mock("../../../lib/pdf-template/generatePdfBuffer", () => ({
  generatePdfBuffer: generatePdfBufferMock,
}));

function validBody() {
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

beforeEach(() => {
  generatePdfBufferMock.mockReset();
});

describe("POST /api/generate-pdf", () => {
  it("returns a PDF with the correct headers for a valid body", async () => {
    generatePdfBufferMock.mockResolvedValue(Buffer.from("%PDF-1.4 fake"));
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody()),
    });

    const response = await POST(request as any);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("Henkaten_trial-carbon_2025-09-13.pdf");
    expect(generatePdfBufferMock).toHaveBeenCalledTimes(1);
    const htmlArg = generatePdfBufferMock.mock.calls[0][0] as string;
    expect(htmlArg).toContain("Trial Carbon");
  });

  it("returns 400 for a body missing judul", async () => {
    const { POST } = await import("./route");
    const body = validBody();
    body.judul = "";

    const request = new Request("http://localhost/api/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const response = await POST(request as any);

    expect(response.status).toBe(400);
    expect(generatePdfBufferMock).not.toHaveBeenCalled();
  });

  it("returns 500 when PDF generation throws", async () => {
    generatePdfBufferMock.mockRejectedValue(new Error("chromium crashed"));
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody()),
    });

    const response = await POST(request as any);

    expect(response.status).toBe(500);
  });
});
