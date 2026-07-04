# PDF Header Logo — Design

**Date:** 2026-07-04
**Status:** Approved

## Problem

The generated PDF header currently shows a static `"LOGO"` text placeholder (`lib/pdf-template/renderHenkatenHtml.ts:100`, styled by `.logo-box` in `lib/pdf-template/pdf-styles.ts`). The real logo image is not available yet, but the codebase should be wired up so that once the user drops a logo file in, it appears in the PDF with no further code changes — matching the plan note already on record in `docs/superpowers/plans/2026-07-02-henkaten-pdf-generator.md:2590`.

## Goals

- Once a logo file exists at `public/logo.png`, it renders inside the PDF header's `.logo-box`, replacing the `"LOGO"` text.
- Until that file exists, the PDF keeps rendering the current `"LOGO"` text fallback — generation must never error or produce a broken image tag because the file is missing.
- No dependency on the app's HTTP server at render time (PDF generation uses `page.setContent()` with no base URL — see Non-goals).

## Non-goals

- No change to the web UI (Navbar). This change is scoped to the PDF output only.
- No fetching the image over HTTP / relative `<img src="/logo.png">` — `lib/pdf-template/generatePdfBuffer.ts:20` calls `page.setContent(html, ...)`, which has no server context to resolve relative URLs against.
- No support for other logo filenames or formats beyond `public/logo.png`. YAGNI — the user will supply exactly one file at this fixed path.

## Design

### 1. `lib/pdf-template/logo.ts` (new)

```typescript
export function getLogoDataUri(logoPath?: string): string | null
```

- Reads the file at `logoPath` (default: `path.join(process.cwd(), "public", "logo.png")`) via `fs.readFileSync`.
- On success, returns `data:image/png;base64,<...>`.
- On any read error (most commonly `ENOENT` because the file doesn't exist yet), returns `null`.
- The optional `logoPath` parameter exists purely for testability — production code always calls `getLogoDataUri()` with no argument.

### 2. `lib/pdf-template/renderHenkatenHtml.ts`

- Import `getLogoDataUri` and call it once per render.
- Change the `.logo-box` line from:
  ```html
  <div class="logo-box">LOGO</div>
  ```
  to conditionally render an `<img>` when a data URI is available, falling back to the existing text otherwise:
  ```html
  <div class="logo-box">${logoDataUri ? `<img src="${logoDataUri}" alt="Logo" class="logo-img" />` : "LOGO"}</div>
  ```

### 3. `lib/pdf-template/pdf-styles.ts`

- Add a `.logo-img` rule so the image scales to fit the existing 90px-wide `.logo-box` regardless of the source image's native dimensions:
  ```css
  .logo-img { max-width: 100%; max-height: 100%; object-fit: contain; }
  ```

### 4. `public/` folder

- Create the (currently nonexistent) `public/` folder. The user will drop `logo.png` into it themselves later; at that point the PDF picks it up automatically with no code changes.

## Testing

- **`lib/pdf-template/logo.test.ts`** (new):
  - `getLogoDataUri("some/nonexistent/path.png")` returns `null`.
  - `getLogoDataUri(<path to a small fixture PNG written to a temp dir during the test>)` returns a string starting with `"data:image/png;base64,"`.
- **`lib/pdf-template/renderHenkatenHtml.test.ts`**: add one test asserting the HTML still contains the literal `"LOGO"` fallback text when no `public/logo.png` exists (true in this repo and in CI) — documents and locks in the fallback behavior.
