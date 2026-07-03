import { NextResponse } from "next/server";
import { henkatenFormSchema } from "../../../lib/form-schema";
import { renderHenkatenHtml } from "../../../lib/pdf-template/renderHenkatenHtml";
import { buildFileName } from "../../../lib/format-helpers";
import { generatePdfBuffer } from "../../../lib/pdf-template/generatePdfBuffer";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = henkatenFormSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data form tidak valid", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const html = renderHenkatenHtml(parsed.data);

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generatePdfBuffer(html);
  } catch (error) {
    console.error("Gagal generate PDF", error);
    return NextResponse.json({ error: "Gagal generate PDF" }, { status: 500 });
  }

  const fileName = buildFileName(parsed.data.judul, parsed.data.waktuMulai);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
