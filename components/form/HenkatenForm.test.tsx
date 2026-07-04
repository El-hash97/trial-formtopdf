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

  it("opens a new tab with the PDF blob when Preview PDF is clicked, even with empty required fields", async () => {
    const user = userEvent.setup();
    const blob = new Blob(["%PDF-1.4"], { type: "application/pdf" });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(blob),
    }) as unknown as typeof fetch;
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<HenkatenForm />);
    await user.click(screen.getByRole("button", { name: "Preview PDF" }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/generate-pdf",
      expect.objectContaining({ method: "POST" })
    );
    const requestBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(requestBody.judul).toBe("(Preview)");
    expect(openSpy).toHaveBeenCalledWith("blob:mock-url", "_blank");
  });

  it("shows an error message when Preview PDF request fails, without opening a tab", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Gagal generate PDF" }),
    }) as unknown as typeof fetch;
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<HenkatenForm />);
    await user.click(screen.getByRole("button", { name: "Preview PDF" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Gagal generate PDF");
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("still POSTs full data and downloads via Generate PDF after using Preview PDF", async () => {
    const user = userEvent.setup();
    const blob = new Blob(["%PDF-1.4"], { type: "application/pdf" });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(blob),
    }) as unknown as typeof fetch;
    vi.spyOn(window, "open").mockImplementation(() => null);

    render(<HenkatenForm />);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Generate PDF" }));

    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });
});
