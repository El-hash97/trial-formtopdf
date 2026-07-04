# PDF Preview Button — Design

**Date:** 2026-07-04
**Status:** Approved

## Problem

`HenkatenForm` only offers "Generate PDF", which validates the full form and downloads the file. Users want a way to see what the PDF looks like before committing to a final download, without first satisfying every required field.

## Goals

- Add a "Preview PDF" button next to "Generate PDF".
- Preview opens the rendered PDF in a new browser tab using the browser's native PDF viewer.
- Preview works even when required fields (judul, waktuMulai, waktuSelesai, lineHeader, proses) are empty — it should never be blocked by validation.
- No changes to the real "Generate PDF" validation behavior or output.

## Non-goals

- No in-page modal/dialog PDF viewer (no new Dialog component/dependency).
- No new API route — preview reuses `POST /api/generate-pdf` as-is.
- No relaxing of the Zod schema (`lib/form-schema.ts`) used for the real generate flow.

## Design

### 1. Placeholder-fill helper

New function, e.g. `buildPreviewSafeData(data: HenkatenFormDataInput): HenkatenFormDataInput`, added to `lib/form-schema.ts` (co-located with the schema it exists to satisfy). It returns a shallow copy of the form values with required-but-empty fields substituted so `henkatenFormSchema.safeParse` always succeeds:

| Field | If empty, becomes |
|---|---|
| `judul` | `"(Preview)"` |
| `waktuMulai` | today's date, ISO `YYYY-MM-DD` |
| `waktuSelesai` | same value as the resolved `waktuMulai` |
| `lineHeader` | `"-"` |
| `proses` | `"-"` |

All other fields already satisfy the schema when empty (no `min(1)` constraints), so they pass through unchanged.

Dates must be substituted with a real ISO date (not a placeholder string like `"-"`), because `formatDateID` in `lib/format-helpers.ts` parses `YYYY-MM-DD` numerically via `.split("-").map(Number)`; a non-date placeholder would render as `NaN`.

### 2. `HenkatenForm.tsx` changes

- New `isPreviewing` boolean state, independent of `isGenerating` — the two actions don't block each other's button.
- New `handlePreview` function, NOT routed through `methods.handleSubmit` (so react-hook-form's validation never blocks it):
  1. `const data = methods.getValues()`
  2. `const safeData = buildPreviewSafeData(data)`
  3. `setIsPreviewing(true)`, clear `submitError`
  4. `fetch("/api/generate-pdf", { method: "POST", body: JSON.stringify(safeData), ... })`
  5. On non-ok response: parse error body, set `submitError` (reuse existing Alert).
  6. On success: `const blob = await response.blob()`, `window.open(URL.createObjectURL(blob), "_blank")`.
  7. `finally`: `setIsPreviewing(false)`.
- New button, placed left of "Generate PDF" inside a `flex gap-3` row:
  - `type="button"` (so it never triggers form submit/validation)
  - `variant="outline"`
  - `onClick={handlePreview}`
  - `disabled={isPreviewing || isGenerating}`
  - Shows `Loader2` spinner + "Membuat Preview..." while `isPreviewing`, otherwise "Preview PDF".

### 3. API / schema

Untouched. `/api/generate-pdf/route.ts` and `henkatenFormSchema` keep their current strict validation — they're what the real "Generate PDF" flow relies on. Preview only works around this on the client by ensuring the payload it sends is always valid.

### Why reuse the existing endpoint

Preview and the final PDF are byte-for-byte the same render for the same input — the only difference is what the client does with the response (open a tab vs. trigger a download). A dedicated preview route would duplicate `renderHenkatenHtml` + `generatePdfBuffer` wiring for no behavioral difference. `Content-Disposition: attachment` on the response is irrelevant to a blob URL opened via `window.open` — blob URLs render according to the Blob's MIME type, not the original response header.

## Testing

Extend `components/form/HenkatenForm.test.tsx`:
- Clicking "Preview PDF" with all required fields empty still calls `fetch("/api/generate-pdf", ...)` with a payload that passes `henkatenFormSchema` (i.e., placeholders applied), and does not show any validation-blocking behavior.
- Success path: mocks `URL.createObjectURL` and `window.open`, asserts `window.open` was called with a blob URL.
- Error path: server returns non-ok, `submitError` Alert is shown, `window.open` is not called.
- "Generate PDF" behavior (validation, warnings, download) is unchanged by this addition — existing tests should still pass unmodified.
