# PDF Preview Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Preview PDF" button to `HenkatenForm` that opens the rendered PDF in a new browser tab, working even when required fields are empty.

**Architecture:** A new `buildPreviewSafeData` helper in `lib/form-schema.ts` fills in placeholder values for the schema's required-but-empty fields. `HenkatenForm.tsx` gets a new button and `handlePreview` handler that calls this helper, POSTs to the existing `/api/generate-pdf` route (unchanged), and opens the returned blob via `window.open`.

**Tech Stack:** Next.js 14, React 18, react-hook-form, Zod, Vitest, Testing Library.

## Global Constraints

- No new npm dependencies (spec: "No in-page modal/dialog PDF viewer (no new Dialog component/dependency)").
- No new API route — reuse `POST /api/generate-pdf` (spec: "No new API route").
- `henkatenFormSchema` in `lib/form-schema.ts` must NOT be relaxed (spec: "No relaxing of the Zod schema").
- Placeholder substitutions, exact values (spec table):
  - `judul` empty → `"(Preview)"`
  - `waktuMulai` empty → today's date, ISO `YYYY-MM-DD`
  - `waktuSelesai` empty → same value as the resolved `waktuMulai`
  - `lineHeader` empty → `"-"`
  - `proses` empty → `"-"`
- Preview button must be `type="button"` so it never triggers `methods.handleSubmit` validation (spec 2).

---

### Task 1: `buildPreviewSafeData` helper

**Files:**
- Modify: `lib/form-schema.ts`
- Test: `lib/form-schema.test.ts`

**Interfaces:**
- Produces: `buildPreviewSafeData(data: HenkatenFormDataInput): HenkatenFormDataInput` — exported from `lib/form-schema.ts`. Returns a new object (does not mutate `data`); every field of the result passes `henkatenFormSchema.safeParse`.

- [ ] **Step 1: Write the failing tests**

Add to `lib/form-schema.test.ts` (new `describe` block, after the existing ones):

```typescript
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
```

Update the import line at the top of `lib/form-schema.test.ts` from:

```typescript
import { henkatenFormSchema, getLineSectionWarnings, type HenkatenFormDataInput } from "./form-schema";
```

to:

```typescript
import {
  henkatenFormSchema,
  getLineSectionWarnings,
  buildPreviewSafeData,
  type HenkatenFormDataInput,
} from "./form-schema";
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- lib/form-schema.test.ts`
Expected: FAIL — `buildPreviewSafeData is not a function` (or import error), since the function doesn't exist yet.

- [ ] **Step 3: Implement `buildPreviewSafeData`**

Add to the end of `lib/form-schema.ts`:

```typescript
export function buildPreviewSafeData(data: HenkatenFormDataInput): HenkatenFormDataInput {
  const waktuMulai = data.waktuMulai.trim() !== ""
    ? data.waktuMulai
    : new Date().toISOString().slice(0, 10);
  const waktuSelesai = data.waktuSelesai.trim() !== "" ? data.waktuSelesai : waktuMulai;

  return {
    ...data,
    judul: data.judul.trim() !== "" ? data.judul : "(Preview)",
    waktuMulai,
    waktuSelesai,
    lineHeader: data.lineHeader.trim() !== "" ? data.lineHeader : "-",
    proses: data.proses.trim() !== "" ? data.proses : "-",
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- lib/form-schema.test.ts`
Expected: PASS — all tests in `form-schema.test.ts`, including the six new `buildPreviewSafeData` tests.

- [ ] **Step 5: Commit**

```bash
git add lib/form-schema.ts lib/form-schema.test.ts
git commit -m "feat: add buildPreviewSafeData helper for PDF preview"
```

---

### Task 2: Preview PDF button in `HenkatenForm`

**Files:**
- Modify: `components/form/HenkatenForm.tsx`
- Test: `components/form/HenkatenForm.test.tsx`

**Interfaces:**
- Consumes: `buildPreviewSafeData(data: HenkatenFormDataInput): HenkatenFormDataInput` from `../../lib/form-schema` (Task 1).
- Produces: no new exports — this task only changes the rendered UI and adds an internal `handlePreview` handler local to `HenkatenForm`.

- [ ] **Step 1: Write the failing tests**

Add to `components/form/HenkatenForm.test.tsx`, inside the `describe("HenkatenForm", ...)` block, after the existing two tests (before the closing `});`):

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- components/form/HenkatenForm.test.tsx`
Expected: FAIL — `Unable to find role="button" and name "Preview PDF"` (button doesn't exist yet).

- [ ] **Step 3: Implement the Preview PDF button and handler**

In `components/form/HenkatenForm.tsx`:

Update the import block (add `buildPreviewSafeData`):

```typescript
import {
  henkatenFormSchema,
  getLineSectionWarnings,
  buildPreviewSafeData,
  type HenkatenFormDataInput,
} from "../../lib/form-schema";
```

Add `isPreviewing` state next to the existing state declarations:

```typescript
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
```

Add `handlePreview` after the existing `onSubmit` function:

```typescript
  async function handlePreview() {
    setSubmitError(null);
    setIsPreviewing(true);
    try {
      const data = buildPreviewSafeData(methods.getValues());
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
      window.open(url, "_blank");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Gagal generate PDF");
    } finally {
      setIsPreviewing(false);
    }
  }
```

Replace the closing button block:

```typescript
        <Button type="submit" disabled={isGenerating} className="w-full sm:w-auto">
          {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
          {isGenerating ? "Membuat PDF..." : "Generate PDF"}
        </Button>
```

with:

```typescript
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
            disabled={isPreviewing || isGenerating}
            className="w-full sm:w-auto"
          >
            {isPreviewing && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPreviewing ? "Membuat Preview..." : "Preview PDF"}
          </Button>
          <Button type="submit" disabled={isGenerating || isPreviewing} className="w-full sm:w-auto">
            {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
            {isGenerating ? "Membuat PDF..." : "Generate PDF"}
          </Button>
        </div>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- components/form/HenkatenForm.test.tsx`
Expected: PASS — all 5 tests (2 original + 3 new).

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS — no regressions in other files.

- [ ] **Step 6: Commit**

```bash
git add components/form/HenkatenForm.tsx components/form/HenkatenForm.test.tsx
git commit -m "feat: add Preview PDF button that opens rendered PDF in a new tab"
```

---

## Self-Review Notes

- **Spec coverage:** Placeholder-fill rules (table) → Task 1. Preview button placement/style/behavior, independent loading state, error reuse, `window.open` flow → Task 2. No API/schema changes → verified neither task touches `app/api/generate-pdf/route.ts` or the `henkatenFormSchema` definition itself. Testing section → covered by both tasks' test steps.
- **Placeholder scan:** No TBD/TODO; all steps contain full code.
- **Type consistency:** `buildPreviewSafeData(data: HenkatenFormDataInput): HenkatenFormDataInput` signature matches between Task 1's definition and Task 2's usage (`buildPreviewSafeData(methods.getValues())`, where `methods.getValues()` returns `HenkatenFormDataInput`).
