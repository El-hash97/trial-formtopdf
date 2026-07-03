import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("./RichTextEditor", () => ({
  RichTextEditor: ({ value, onChange }: { value: string; onChange: (html: string) => void }) => (
    <textarea aria-label="Deskripsi" value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));

import { HenkatenForm } from "./HenkatenForm";

const originalFetch = global.fetch;

beforeEach(() => {
  HTMLAnchorElement.prototype.click = vi.fn();
  global.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
  global.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Judul Trial/Henkaten"), "Trial Carbon");
  await user.type(screen.getByLabelText("Waktu Mulai"), "2025-09-13");
  await user.type(screen.getByLabelText("Waktu Selesai"), "2025-09-30");
  await user.type(screen.getByLabelText("Line"), "Melting");
  await user.type(screen.getByLabelText("Proses"), "Melting");
}

describe("HenkatenForm", () => {
  it("POSTs the form data to /api/generate-pdf and triggers a download on success", async () => {
    const user = userEvent.setup();
    const blob = new Blob(["%PDF-1.4"], { type: "application/pdf" });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(blob),
    }) as unknown as typeof fetch;

    render(<HenkatenForm />);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Generate PDF" }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/generate-pdf",
      expect.objectContaining({ method: "POST" })
    );
    const requestBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(requestBody.judul).toBe("Trial Carbon");
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });

  it("shows an error message and preserves form values when the request fails", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Gagal generate PDF" }),
    }) as unknown as typeof fetch;

    render(<HenkatenForm />);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Generate PDF" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Gagal generate PDF");
    expect(screen.getByLabelText("Judul Trial/Henkaten")).toHaveValue("Trial Carbon");
  });
});
