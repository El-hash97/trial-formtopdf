# Henkaten PDF Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js + Tailwind web app with a form that captures Henkaten trial data (including dynamic per-line sections with rich-text descriptions, inline resizable photos, dates, and PICs) and generates a downloadable PDF that replicates the layout of the original PT TMMIN "Lembar Permohonan Melakukan Henkaten" paper form.

**Architecture:** Client-side React form (react-hook-form + Tiptap rich text editor) collects all data as JSON (photos embedded as compressed base64). On submit, the JSON is POSTed to a single Next.js API route which sanitizes the rich text, renders it into a hand-built HTML/CSS document matching the original form's layout, and prints that HTML to a PDF using a headless Chromium (`puppeteer-core` + `@sparticuz/chromium` in production, full `puppeteer` locally). The PDF is streamed back and downloaded by the browser. No database, no auth, no server-side storage — fully stateless per the approved design spec.

**Tech Stack:** Next.js (App Router, TypeScript), Tailwind CSS, react-hook-form, zod, Tiptap (`@tiptap/react` + `tiptap-extension-resize-image`), `sanitize-html`, `browser-image-compression`, `puppeteer-core` + `@sparticuz/chromium` (prod) / `puppeteer` (dev), Vitest + React Testing Library.

## Global Constraints

- Framework: Next.js App Router + TypeScript + Tailwind CSS (per spec, user-specified).
- No database, no auth, no server-side persistence — every request is stateless (spec: "Di Luar Cakupan").
- Deployment target is Vercel serverless — PDF generation must work within serverless function constraints (spec: "Kenapa Puppeteer").
- Photos are embedded as base64 data URLs, compressed client-side to a max of ~1MB per photo before being inserted into rich text (spec: "Upload foto").
- Rich text HTML must be sanitized server-side before being embedded into the generated PDF HTML, and `img` sources restricted to `data:` URIs only (security: prevent XSS/SSRF via headless browser).
- Approval name fields: 6 columns exactly — Production DpH.Prod, Production Sec.Head, Engineering DpH.Eng, Engineering Sec.Head 1, Engineering Sec.Head 2, Pemohon. In the generated PDF, both Engineering Sec.Head columns are labelled "Sec.Head" (no numbers) — the "1"/"2" suffix is a form-UI-only label (spec: "Catatan label").
- Jenis Henkaten is single-select: Material / Mesin / Metode / Man / Lain-lain (manual text when Lain-lain selected).
- Jumlah/Periode is shift count (1 or 2) + warna (White and/or Red), combined into one label string for the PDF.
- Line dropdown options for dynamic sections: Melting, Pouring, Analysis, Moulding, RCS, Core Making, Finishing, Maintenance, Die Press, Engineering.
- Background section has no Waktu/PIC columns; every dynamic Line section has Waktu (single date or date range) and PIC (one or more names).
- Required fields: Judul Trial/Henkaten, Waktu Pelaksanaan (mulai + selesai), Line (header), Proses. Empty dynamic Line sections produce a soft warning, not a hard block.
- Logo is a placeholder box (no image asset yet).

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `.gitignore`
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`

**Interfaces:**
- Produces: a working `npm run dev` (Next.js dev server on port 3000) and `npm test` (Vitest) command, plus the `@/*` import alias resolving to the project root, used by every later task.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "henkaten-pdf-generator",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.6.0",
    "zod": "^3.23.0",
    "@tiptap/react": "^2.5.0",
    "@tiptap/starter-kit": "^2.5.0",
    "@tiptap/pm": "^2.5.0",
    "tiptap-extension-resize-image": "^1.2.1",
    "sanitize-html": "^2.13.0",
    "browser-image-compression": "^2.0.2",
    "puppeteer-core": "^22.13.0",
    "@sparticuz/chromium": "^123.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/node": "^20.14.0",
    "@types/sanitize-html": "^2.11.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "vitest": "^1.6.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^24.1.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/user-event": "^14.5.0",
    "puppeteer": "^22.13.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: Create `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 5: Create `postcss.config.mjs`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
```

- [ ] **Step 7: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 8: Create `.gitignore`**

```
node_modules
.next
.env*.local
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 9: Create `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 10: Create `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Generate PDF Henkaten",
  description: "Form untuk mengisi dan generate PDF Lembar Permohonan Henkaten",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 11: Create placeholder `app/page.tsx`** (real content added in Task 14)

```tsx
export default function Home() {
  return <main className="p-6">Henkaten PDF Generator</main>;
}
```

- [ ] **Step 12: Install dependencies**

Run: `npm install`
Expected: installs without errors, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 13: Verify dev server starts**

Run: `npm run dev` (start, confirm it boots on `http://localhost:3000` without error, then stop it — e.g. `curl -sI http://localhost:3000` returns `200`)
Expected: server starts, root page responds with HTTP 200.

- [ ] **Step 14: Verify test runner works**

Create a throwaway test to confirm Vitest is wired correctly, run it, then delete it:

Run: `mkdir -p lib && printf "import { describe, it, expect } from 'vitest';\ndescribe('sanity', () => { it('adds', () => { expect(1 + 1).toBe(2); }); });\n" > lib/sanity.test.ts && npx vitest run lib/sanity.test.ts && rm lib/sanity.test.ts`
Expected: `1 passed`.

- [ ] **Step 15: Commit**

```bash
git add package.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.mjs vitest.config.ts vitest.setup.ts .gitignore app/globals.css app/layout.tsx app/page.tsx package-lock.json
git commit -m "chore: scaffold Next.js + Tailwind + Vitest project"
```

---

### Task 2: Format Helpers

**Files:**
- Create: `lib/format-helpers.ts`
- Test: `lib/format-helpers.test.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces: `formatDateID(dateISO: string): string`, `formatDateRangeLabel(startISO: string, endISO: string): string`, `formatJumlahPeriode(shiftCount: 1 | 2, colors: string[]): string`, `slugify(text: string): string`, `buildFileName(title: string, dateISO: string): string` (used by Task 5, 6, 13). Shared form types (`HenkatenFormDataInput`, `LineSectionInput`, and the `line`/`jenisHenkaten`/`warnaShift` enums) are defined once in Task 4 via zod and inferred from there — no separate hand-written type module, to avoid two competing sources of truth for the same shape.

- [ ] **Step 1: Write the failing test for format helpers**

```ts
// lib/format-helpers.test.ts
import { describe, it, expect } from "vitest";
import {
  formatDateID,
  formatDateRangeLabel,
  formatJumlahPeriode,
  slugify,
  buildFileName,
} from "./format-helpers";

describe("formatDateID", () => {
  it("formats an ISO date into Indonesian long form", () => {
    expect(formatDateID("2025-09-13")).toBe("13 September 2025");
  });
});

describe("formatDateRangeLabel", () => {
  it("formats a start and end date as a range", () => {
    expect(formatDateRangeLabel("2025-09-13", "2025-09-30")).toBe(
      "13 September 2025 - 30 September 2025"
    );
  });

  it("returns a single date label when start and end are equal", () => {
    expect(formatDateRangeLabel("2025-09-13", "2025-09-13")).toBe("13 September 2025");
  });
});

describe("formatJumlahPeriode", () => {
  it("combines shift count and multiple colors", () => {
    expect(formatJumlahPeriode(2, ["White", "Red"])).toBe("2 Shift (White Red)");
  });

  it("combines shift count and a single color", () => {
    expect(formatJumlahPeriode(1, ["Red"])).toBe("1 Shift (Red)");
  });

  it("omits parentheses when no color is selected", () => {
    expect(formatJumlahPeriode(1, [])).toBe("1 Shift");
  });
});

describe("slugify", () => {
  it("lowercases and dashes a title", () => {
    expect(slugify("Trial Konfirmasi Carbon Nitrogen!")).toBe("trial-konfirmasi-carbon-nitrogen");
  });

  it("collapses repeated separators", () => {
    expect(slugify("  Multi   Space -- Title  ")).toBe("multi-space-title");
  });
});

describe("buildFileName", () => {
  it("builds a pdf file name from title and date", () => {
    expect(buildFileName("Trial Carbon", "2025-09-13")).toBe("Henkaten_trial-carbon_2025-09-13.pdf");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/format-helpers.test.ts`
Expected: FAIL with "Cannot find module './format-helpers'".

- [ ] **Step 3: Write `lib/format-helpers.ts`**

```ts
const INDO_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function formatDateID(dateISO: string): string {
  const [year, month, day] = dateISO.split("-").map(Number);
  const monthName = INDO_MONTHS[month - 1] ?? "";
  return `${day} ${monthName} ${year}`;
}

export function formatDateRangeLabel(startISO: string, endISO: string): string {
  if (startISO === endISO) {
    return formatDateID(startISO);
  }
  return `${formatDateID(startISO)} - ${formatDateID(endISO)}`;
}

export function formatJumlahPeriode(shiftCount: 1 | 2, colors: string[]): string {
  const base = `${shiftCount} Shift`;
  if (colors.length === 0) {
    return base;
  }
  return `${base} (${colors.join(" ")})`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildFileName(title: string, dateISO: string): string {
  return `Henkaten_${slugify(title)}_${dateISO}.pdf`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/format-helpers.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/format-helpers.ts lib/format-helpers.test.ts
git commit -m "feat: add date/label format helpers"
```

---

### Task 3: HTML Safety Helpers

**Files:**
- Create: `lib/html-safety.ts`
- Test: `lib/html-safety.test.ts`

**Interfaces:**
- Consumes: `sanitize-html` (npm package, installed in Task 1).
- Produces: `escapeHtml(input: string): string`, `sanitizeRichText(html: string): string` (used by Task 5).

- [ ] **Step 1: Write the failing test**

```ts
// lib/html-safety.test.ts
import { describe, it, expect } from "vitest";
import { escapeHtml, sanitizeRichText } from "./html-safety";

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml(`<b>"Bold" & 'quoted'</b>`)).toBe(
      "&lt;b&gt;&quot;Bold&quot; &amp; &#39;quoted&#39;&lt;/b&gt;"
    );
  });
});

describe("sanitizeRichText", () => {
  it("keeps allowed formatting tags", () => {
    expect(sanitizeRichText("<p>Hello <b>world</b></p>")).toBe("<p>Hello <b>world</b></p>");
  });

  it("strips script tags", () => {
    expect(sanitizeRichText('<p>Hi</p><script>alert(1)</script>')).toBe("<p>Hi</p>");
  });

  it("strips event handler attributes", () => {
    expect(sanitizeRichText('<p onclick="alert(1)">Hi</p>')).toBe("<p>Hi</p>");
  });

  it("keeps data: image sources but strips http(s) image sources", () => {
    const input =
      '<img src="data:image/png;base64,AAAA" /><img src="https://evil.example/track.png" />';
    const result = sanitizeRichText(input);
    expect(result).toContain('src="data:image/png;base64,AAAA"');
    expect(result).not.toContain("evil.example");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/html-safety.test.ts`
Expected: FAIL with "Cannot find module './html-safety'".

- [ ] **Step 3: Write `lib/html-safety.ts`**

```ts
import sanitizeHtml from "sanitize-html";

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li", "span", "img"],
    allowedAttributes: {
      img: ["src", "width", "height", "style"],
      span: ["style"],
      p: ["style"],
    },
    allowedSchemesByTag: {
      img: ["data"],
    },
    allowedSchemes: [],
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/html-safety.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/html-safety.ts lib/html-safety.test.ts
git commit -m "feat: add HTML escaping and rich text sanitization helpers"
```

---

### Task 4: Form Schema & Validation Warnings

**Files:**
- Create: `lib/form-schema.ts`
- Test: `lib/form-schema.test.ts`

**Interfaces:**
- Consumes: `zod` (npm package).
- Produces: `henkatenFormSchema` (zod schema), `lineSectionSchema` (zod schema), `HenkatenFormDataInput` type, `LineSectionInput` type, `getLineSectionWarnings(data: HenkatenFormDataInput): string[]` (used by Task 6, 12, 13).

- [ ] **Step 1: Write the failing test**

```ts
// lib/form-schema.test.ts
import { describe, it, expect } from "vitest";
import { henkatenFormSchema, getLineSectionWarnings, type HenkatenFormDataInput } from "./form-schema";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/form-schema.test.ts`
Expected: FAIL with "Cannot find module './form-schema'".

- [ ] **Step 3: Write `lib/form-schema.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/form-schema.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/form-schema.ts lib/form-schema.test.ts
git commit -m "feat: add zod form schema and line-section warning logic"
```

---

### Task 5: PDF HTML Template Renderer

**Files:**
- Create: `lib/pdf-template/pdf-styles.ts`
- Create: `lib/pdf-template/renderHenkatenHtml.ts`
- Test: `lib/pdf-template/renderHenkatenHtml.test.ts`

**Interfaces:**
- Consumes: `HenkatenFormDataInput` (Task 4), `escapeHtml`/`sanitizeRichText` (Task 3), `formatDateID`/`formatDateRangeLabel`/`formatJumlahPeriode` (Task 2).
- Produces: `renderHenkatenHtml(data: HenkatenFormDataInput): string` (used by Task 6).

- [ ] **Step 1: Create `lib/pdf-template/pdf-styles.ts`**

```ts
export const pdfStyles = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #111; margin: 0; }
  .doc { border: 1px solid #000; }
  .header { display: grid; grid-template-columns: 90px 1fr 260px; border-bottom: 1px solid #000; }
  .logo-box { display: flex; align-items: center; justify-content: center; border-right: 1px solid #000; font-size: 9px; color: #888; }
  .title-box { padding: 6px 8px; border-right: 1px solid #000; }
  .title-box .company { font-weight: bold; font-size: 11px; }
  .title-box .title { font-weight: bold; font-size: 12px; margin-top: 4px; }
  .title-box .formno { font-size: 9px; margin-top: 8px; }
  .approval-grid { display: grid; grid-template-columns: repeat(3, 1fr); }
  .approval-col { border-right: 1px solid #000; }
  .approval-col:last-child { border-right: none; }
  .approval-col .col-title { text-align: center; font-weight: bold; border-bottom: 1px solid #000; padding: 2px; }
  .approval-sub { display: flex; }
  .approval-cell { flex: 1; border-right: 1px solid #000; padding: 2px; text-align: center; }
  .approval-cell:last-child { border-right: none; }
  .approval-cell .role { font-size: 8px; color: #555; }
  .approval-cell .name { min-height: 28px; font-size: 9px; padding-top: 4px; }
  .info-grid { display: grid; grid-template-columns: 1fr 220px; border-bottom: 1px solid #000; }
  .info-left table, .info-right table { width: 100%; border-collapse: collapse; }
  .info-left td, .info-right td { border: 1px solid #000; padding: 4px; vertical-align: top; font-size: 9.5px; }
  .info-left .label, .info-right .label { font-weight: bold; width: 110px; background: #f2f2f2; }
  .uraian-table { width: 100%; border-collapse: collapse; }
  .uraian-table th, .uraian-table td { border: 1px solid #000; padding: 4px; vertical-align: top; font-size: 9.5px; }
  .uraian-table th { background: #d9d9d9; text-align: center; }
  .col-uraian { width: 60%; }
  .col-waktu { width: 20%; }
  .col-pic { width: 20%; }
  .section-title { font-weight: bold; margin-bottom: 4px; }
  .desc-html img { max-width: 100%; }
  .desc-html { line-height: 1.4; }
  .bottom-static table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .bottom-static th, .bottom-static td { border: 1px solid #000; padding: 4px; font-size: 9.5px; }
  .bottom-block { margin-top: 8px; font-size: 9.5px; }
  .flow { display: flex; align-items: center; margin-top: 10px; font-size: 9px; }
  .flow-box { border: 1px solid #000; padding: 6px; flex: 1; text-align: center; }
  .flow-arrow { padding: 0 4px; }
`;
```

- [ ] **Step 2: Write the failing test**

```ts
// lib/pdf-template/renderHenkatenHtml.test.ts
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

  it("uses the manual jenis henkaten text when Lain-lain is selected", () => {
    const html = renderHenkatenHtml(baseData());
    expect(html).toContain("[Software]");
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
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/pdf-template/renderHenkatenHtml.test.ts`
Expected: FAIL with "Cannot find module './renderHenkatenHtml'".

- [ ] **Step 4: Write `lib/pdf-template/renderHenkatenHtml.ts`**

```ts
import type { HenkatenFormDataInput, LineSectionInput } from "../form-schema";
import { escapeHtml, sanitizeRichText } from "../html-safety";
import { formatDateID, formatDateRangeLabel, formatJumlahPeriode } from "../format-helpers";
import { pdfStyles } from "./pdf-styles";

function renderJenisHenkaten(data: HenkatenFormDataInput): string {
  if (data.jenisHenkaten === "Lain-lain") {
    return escapeHtml(data.jenisHenkatenManual || "Lain-lain");
  }
  return escapeHtml(data.jenisHenkaten);
}

function renderApprovalCell(role: string, name: string): string {
  return `
    <div class="approval-cell">
      <div class="role">${escapeHtml(role)}</div>
      <div class="name">${escapeHtml(name)}</div>
    </div>
  `;
}

function renderLineSection(section: LineSectionInput): string {
  const waktu =
    section.waktuMode === "range"
      ? formatDateRangeLabel(section.waktuStart, section.waktuEnd)
      : formatDateID(section.waktuStart);
  const pic = section.pic.map(escapeHtml).join(", ");
  return `
    <tr>
      <td class="col-uraian">
        <div class="section-title">${escapeHtml(section.line)}</div>
        <div class="desc-html">${sanitizeRichText(section.descriptionHtml)}</div>
      </td>
      <td class="col-waktu">${escapeHtml(waktu)}</td>
      <td class="col-pic">${pic}</td>
    </tr>
  `;
}

export function renderHenkatenHtml(data: HenkatenFormDataInput): string {
  const waktuLabel = formatDateRangeLabel(data.waktuMulai, data.waktuSelesai);
  const jumlahPeriode = formatJumlahPeriode(data.shiftCount, data.warnaShift);
  const lineSectionsHtml = data.lineSections.map(renderLineSection).join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<style>${pdfStyles}</style>
</head>
<body>
  <div class="doc">
    <div class="header">
      <div class="logo-box">LOGO</div>
      <div class="title-box">
        <div class="company">PT. TMMIN &mdash; Casting Division</div>
        <div class="title">LEMBAR PERMOHONAN MELAKUKAN HENKATEN</div>
        <div class="formno">FRM-FB20-E007</div>
      </div>
      <div class="approval-grid">
        <div class="approval-col">
          <div class="col-title">Production</div>
          <div class="approval-sub">
            ${renderApprovalCell("DpH. Prod", data.approval.productionDphProd)}
            ${renderApprovalCell("Sec.Head", data.approval.productionSecHead)}
          </div>
        </div>
        <div class="approval-col">
          <div class="col-title">Engineering</div>
          <div class="approval-sub">
            ${renderApprovalCell("DpH. Eng", data.approval.engineeringDphEng)}
            ${renderApprovalCell("Sec.Head", data.approval.engineeringSecHead1)}
            ${renderApprovalCell("Sec.Head", data.approval.engineeringSecHead2)}
          </div>
        </div>
        <div class="approval-col">
          <div class="col-title">Pemohon</div>
          <div class="approval-sub">
            ${renderApprovalCell("", data.approval.pemohon)}
          </div>
        </div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-left">
        <table>
          <tr>
            <td class="label">Henkaten</td>
            <td>[${renderJenisHenkaten(data)}] ${escapeHtml(data.judul)}</td>
          </tr>
          <tr>
            <td class="label">Tujuan / Pelaksanaan Henkaten</td>
            <td>${escapeHtml(data.tujuan)}</td>
          </tr>
          <tr>
            <td class="label">Waktu Pelaksanaan Henkaten</td>
            <td>${escapeHtml(waktuLabel)}</td>
          </tr>
        </table>
      </div>
      <div class="info-right">
        <table>
          <tr><td class="label">Jumlah/periode</td><td>${escapeHtml(jumlahPeriode)}</td></tr>
          <tr><td class="label">Benda kerja</td><td>${escapeHtml(data.bendaKerja)}</td></tr>
          <tr><td class="label">Line</td><td>${escapeHtml(data.lineHeader)}</td></tr>
          <tr><td class="label">Proses</td><td>${escapeHtml(data.proses)}</td></tr>
        </table>
      </div>
    </div>

    <table class="uraian-table">
      <thead>
        <tr>
          <th class="col-uraian">Uraian Henkaten</th>
          <th class="col-waktu">Waktu</th>
          <th class="col-pic">PIC</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="col-uraian">
            <div class="section-title">Background</div>
            <div class="desc-html">${sanitizeRichText(data.background.descriptionHtml)}</div>
          </td>
          <td class="col-waktu"></td>
          <td class="col-pic"></td>
        </tr>
        ${lineSectionsHtml}
      </tbody>
    </table>

    <div class="bottom-static">
      <table>
        <tr><th>Item yang harus dikonfirmasi</th><th>PIC</th><th>Hasil</th></tr>
        <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      </table>
      <div class="bottom-block"><strong>Tindak lanjut:</strong></div>
      <div class="bottom-block">
        <strong>Distribusi informasi:</strong><br/>
        1. Engineering Quality<br/>
        2. All Line
      </div>
      <div class="flow">
        <div class="flow-box">PIC Yang melakukan Henkaten</div>
        <div class="flow-arrow">&rarr;</div>
        <div class="flow-box">Sect Head Lokasi dilakukan Henkaten</div>
        <div class="flow-arrow">&rarr;</div>
        <div class="flow-box">Dept. Head Eng, Prod</div>
        <div class="flow-arrow">&rarr;</div>
        <div class="flow-box">Copy untuk yang berhubungan</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/pdf-template/renderHenkatenHtml.test.ts`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/pdf-template/pdf-styles.ts lib/pdf-template/renderHenkatenHtml.ts lib/pdf-template/renderHenkatenHtml.test.ts
git commit -m "feat: add PDF HTML template renderer matching original form layout"
```

---

### Task 6: PDF Generation API Route

**Files:**
- Create: `lib/pdf-template/generatePdfBuffer.ts`
- Create: `app/api/generate-pdf/route.ts`
- Test: `app/api/generate-pdf/route.test.ts`

**Interfaces:**
- Consumes: `henkatenFormSchema` (Task 4), `renderHenkatenHtml` (Task 5), `buildFileName` (Task 2).
- Produces: `generatePdfBuffer(html: string): Promise<Buffer>`, `POST` route handler at `/api/generate-pdf` (used by Task 13's client fetch call).

- [ ] **Step 1: Create `lib/pdf-template/generatePdfBuffer.ts`**

```ts
export async function generatePdfBuffer(html: string): Promise<Buffer> {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  let browser;
  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteerCore = await import("puppeteer-core");
    browser = await puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.launch({ headless: true });
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfUint8 = await page.pdf({ format: "A4", printBackground: true });
    return Buffer.from(pdfUint8);
  } finally {
    await browser.close();
  }
}
```

- [ ] **Step 2: Write the failing test for the route** (mocks `generatePdfBuffer` so no real browser launches)

```ts
// app/api/generate-pdf/route.test.ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run app/api/generate-pdf/route.test.ts`
Expected: FAIL with "Cannot find module './route'".

- [ ] **Step 4: Create `app/api/generate-pdf/route.ts`**

```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run app/api/generate-pdf/route.test.ts`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/pdf-template/generatePdfBuffer.ts app/api/generate-pdf/route.ts app/api/generate-pdf/route.test.ts
git commit -m "feat: add /api/generate-pdf route with puppeteer PDF rendering"
```

---

### Task 7: Client-Side Image Compression Helper

**Files:**
- Create: `lib/image-compress.ts`
- Test: `lib/image-compress.test.ts`

**Interfaces:**
- Consumes: `browser-image-compression` (npm package).
- Produces: `compressImageToDataUrl(file: File): Promise<string>` (used by Task 10's `RichTextEditor`).

- [ ] **Step 1: Write the failing test**

```ts
// lib/image-compress.test.ts
import { describe, it, expect, vi } from "vitest";

const imageCompressionMock = vi.fn();
const getDataUrlFromFileMock = vi.fn();

vi.mock("browser-image-compression", () => ({
  default: Object.assign(imageCompressionMock, { getDataUrlFromFile: getDataUrlFromFileMock }),
}));

import { compressImageToDataUrl } from "./image-compress";

describe("compressImageToDataUrl", () => {
  it("compresses the file with the expected options and returns a data URL", async () => {
    const inputFile = new File(["fake-bytes"], "photo.png", { type: "image/png" });
    const compressedFile = new File(["compressed-bytes"], "photo.png", { type: "image/png" });
    imageCompressionMock.mockResolvedValue(compressedFile);
    getDataUrlFromFileMock.mockResolvedValue("data:image/png;base64,AAAA");

    const result = await compressImageToDataUrl(inputFile);

    expect(imageCompressionMock).toHaveBeenCalledWith(inputFile, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
    });
    expect(getDataUrlFromFileMock).toHaveBeenCalledWith(compressedFile);
    expect(result).toBe("data:image/png;base64,AAAA");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/image-compress.test.ts`
Expected: FAIL with "Cannot find module './image-compress'".

- [ ] **Step 3: Write `lib/image-compress.ts`**

```ts
import imageCompression from "browser-image-compression";

const MAX_SIZE_MB = 1;
const MAX_WIDTH_OR_HEIGHT = 1600;

export async function compressImageToDataUrl(file: File): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
    useWebWorker: true,
  });
  return imageCompression.getDataUrlFromFile(compressed);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/image-compress.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/image-compress.ts lib/image-compress.test.ts
git commit -m "feat: add client-side image compression helper"
```

---

### Task 8: PicInput Component

**Files:**
- Create: `components/form/PicInput.tsx`
- Test: `components/form/PicInput.test.tsx`

**Interfaces:**
- Consumes: nothing beyond React.
- Produces: `PicInput({ value: string[], onChange: (next: string[]) => void })` (used by Task 12's `UraianHenkatenSection`).

- [ ] **Step 1: Write the failing test**

```tsx
// components/form/PicInput.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PicInput } from "./PicInput";

describe("PicInput", () => {
  it("adds a name when Enter is pressed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PicInput value={[]} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText("Ketik nama, Enter untuk tambah"), "Budi{Enter}");

    expect(onChange).toHaveBeenCalledWith(["Budi"]);
  });

  it("renders existing names as removable chips", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PicInput value={["Budi", "Sarmili"]} onChange={onChange} />);

    expect(screen.getByText("Budi")).toBeInTheDocument();
    expect(screen.getByText("Sarmili")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Hapus Budi"));

    expect(onChange).toHaveBeenCalledWith(["Sarmili"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/form/PicInput.test.tsx`
Expected: FAIL with "Cannot find module './PicInput'".

- [ ] **Step 3: Write `components/form/PicInput.tsx`**

```tsx
"use client";

import { useState, type KeyboardEvent } from "react";

interface PicInputProps {
  value: string[];
  onChange: (next: string[]) => void;
}

export function PicInput({ value, onChange }: PicInputProps) {
  const [draft, setDraft] = useState("");

  function addName() {
    const name = draft.trim();
    if (!name) return;
    onChange([...value, name]);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addName();
    }
  }

  function removeName(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-wrap gap-1 rounded border border-gray-300 p-2">
      {value.map((name, index) => (
        <span
          key={`${name}-${index}`}
          className="flex items-center gap-1 rounded bg-gray-200 px-2 py-0.5 text-sm"
        >
          {name}
          <button
            type="button"
            aria-label={`Hapus ${name}`}
            onClick={() => removeName(index)}
            className="text-gray-500 hover:text-red-600"
          >
            &times;
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addName}
        placeholder="Ketik nama, Enter untuk tambah"
        className="min-w-[140px] flex-1 border-none text-sm outline-none"
      />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/form/PicInput.test.tsx`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/form/PicInput.tsx components/form/PicInput.test.tsx
git commit -m "feat: add PicInput tag component"
```

---

### Task 9: DateRangeToggle Component

**Files:**
- Create: `components/form/DateRangeToggle.tsx`
- Test: `components/form/DateRangeToggle.test.tsx`

**Interfaces:**
- Consumes: nothing beyond React.
- Produces: `DateRangeToggle({ mode, start, end, onModeChange, onStartChange, onEndChange })` (used by Task 12's `UraianHenkatenSection`).

- [ ] **Step 1: Write the failing test**

```tsx
// components/form/DateRangeToggle.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateRangeToggle } from "./DateRangeToggle";

describe("DateRangeToggle", () => {
  it("shows a single date input in single mode", () => {
    render(
      <DateRangeToggle
        mode="single"
        start="2025-09-13"
        end=""
        onModeChange={vi.fn()}
        onStartChange={vi.fn()}
        onEndChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Tanggal")).toBeInTheDocument();
    expect(screen.queryByLabelText("Tanggal mulai")).not.toBeInTheDocument();
  });

  it("shows two date inputs in range mode", () => {
    render(
      <DateRangeToggle
        mode="range"
        start="2025-09-13"
        end="2025-09-30"
        onModeChange={vi.fn()}
        onStartChange={vi.fn()}
        onEndChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Tanggal mulai")).toBeInTheDocument();
    expect(screen.getByLabelText("Tanggal selesai")).toBeInTheDocument();
  });

  it("calls onModeChange when the checkbox is toggled", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    render(
      <DateRangeToggle
        mode="single"
        start=""
        end=""
        onModeChange={onModeChange}
        onStartChange={vi.fn()}
        onEndChange={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText("Rentang tanggal"));

    expect(onModeChange).toHaveBeenCalledWith("range");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/form/DateRangeToggle.test.tsx`
Expected: FAIL with "Cannot find module './DateRangeToggle'".

- [ ] **Step 3: Write `components/form/DateRangeToggle.tsx`**

```tsx
"use client";

interface DateRangeToggleProps {
  mode: "single" | "range";
  start: string;
  end: string;
  onModeChange: (mode: "single" | "range") => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}

export function DateRangeToggle({
  mode,
  start,
  end,
  onModeChange,
  onStartChange,
  onEndChange,
}: DateRangeToggleProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={mode === "range"}
          onChange={(event) => onModeChange(event.target.checked ? "range" : "single")}
        />
        Rentang tanggal
      </label>
      {mode === "single" ? (
        <input
          type="date"
          aria-label="Tanggal"
          value={start}
          onChange={(event) => onStartChange(event.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="Tanggal mulai"
            value={start}
            onChange={(event) => onStartChange(event.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <span>-</span>
          <input
            type="date"
            aria-label="Tanggal selesai"
            value={end}
            onChange={(event) => onEndChange(event.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/form/DateRangeToggle.test.tsx`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/form/DateRangeToggle.tsx components/form/DateRangeToggle.test.tsx
git commit -m "feat: add DateRangeToggle component"
```

---

### Task 10: RichTextEditor Component (Tiptap)

**Files:**
- Create: `components/form/RichTextEditor.tsx`
- Test: `components/form/RichTextEditor.test.tsx`

**Interfaces:**
- Consumes: `compressImageToDataUrl` (Task 7), `@tiptap/react`, `@tiptap/starter-kit`, `tiptap-extension-resize-image` (npm packages).
- Produces: `RichTextEditor({ value: string, onChange: (html: string) => void, placeholder?: string })` (used by Task 12's `UraianHenkatenSection` and Task 13's `HenkatenForm` for Background).

**Note:** Tiptap/ProseMirror require DOM APIs (`document.createRange`, `getClientRects`, etc.) that jsdom does not fully implement, so real ProseMirror behavior cannot be reliably unit-tested. This task mocks `@tiptap/react` to test only the component's own glue code (the upload button wiring). Full editing/resizing behavior is verified manually in Task 14's end-to-end check.

- [ ] **Step 1: Write the failing test**

```tsx
// components/form/RichTextEditor.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const setImageMock = vi.fn();
const runMock = vi.fn(() => ({}));
const chainMock = vi.fn();

vi.mock("@tiptap/react", () => ({
  useEditor: () =>
    ({
      getHTML: () => "<p>mock</p>",
      chain: chainMock,
    }) as any,
  EditorContent: () => <div data-testid="editor-content" />,
}));

vi.mock("@tiptap/starter-kit", () => ({ default: {} }));
vi.mock("tiptap-extension-resize-image", () => ({
  default: { configure: () => ({}) },
}));

vi.mock("../../lib/image-compress", () => ({
  compressImageToDataUrl: vi.fn().mockResolvedValue("data:image/png;base64,AAAA"),
}));

import { RichTextEditor } from "./RichTextEditor";

beforeEach(() => {
  chainMock.mockReturnValue({
    focus: () => ({ setImage: setImageMock.mockReturnValue({ run: runMock }) }),
  });
  setImageMock.mockClear();
  runMock.mockClear();
});

describe("RichTextEditor", () => {
  it("renders the upload button and the editor content area", () => {
    render(<RichTextEditor value="" onChange={vi.fn()} />);

    expect(screen.getByText("Upload Foto")).toBeInTheDocument();
    expect(screen.getByTestId("editor-content")).toBeInTheDocument();
  });

  it("compresses and inserts an uploaded image into the editor", async () => {
    const user = userEvent.setup();
    render(<RichTextEditor value="" onChange={vi.fn()} />);

    const file = new File(["fake-bytes"], "photo.png", { type: "image/png" });
    const input = screen.getByText("Upload Foto").querySelector("input") as HTMLInputElement;

    await user.upload(input, file);

    expect(setImageMock).toHaveBeenCalledWith({ src: "data:image/png;base64,AAAA" });
    expect(runMock).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/form/RichTextEditor.test.tsx`
Expected: FAIL with "Cannot find module './RichTextEditor'".

- [ ] **Step 3: Write `components/form/RichTextEditor.tsx`**

```tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ResizeImage from "tiptap-extension-resize-image";
import type { ChangeEvent } from "react";
import { compressImageToDataUrl } from "../../lib/image-compress";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, ResizeImage.configure({ inline: true })],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "min-h-[120px] rounded border border-gray-300 p-2 text-sm focus:outline-none",
        "data-placeholder": placeholder ?? "",
      },
    },
  });

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || !editor) return;
    for (const file of Array.from(files)) {
      const dataUrl = await compressImageToDataUrl(file);
      editor.chain().focus().setImage({ src: dataUrl }).run();
    }
    event.target.value = "";
  }

  return (
    <div className="space-y-2">
      <label className="inline-block cursor-pointer rounded border border-gray-300 px-2 py-1 text-sm">
        Upload Foto
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
      </label>
      <EditorContent editor={editor} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/form/RichTextEditor.test.tsx`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/form/RichTextEditor.tsx components/form/RichTextEditor.test.tsx
git commit -m "feat: add RichTextEditor with resizable inline image upload"
```

---

### Task 11: HeaderFields & ApprovalFields Components

**Files:**
- Create: `components/form/HeaderFields.tsx`
- Create: `components/form/ApprovalFields.tsx`
- Test: `components/form/HeaderFields.test.tsx`
- Test: `components/form/ApprovalFields.test.tsx`

**Interfaces:**
- Consumes: `HenkatenFormDataInput` (Task 4), `react-hook-form`'s `useFormContext` (populated by Task 13's `FormProvider`).
- Produces: `HeaderFields()`, `ApprovalFields()` (used by Task 13's `HenkatenForm`).

- [ ] **Step 1: Write the failing test for `HeaderFields`**

```tsx
// components/form/HeaderFields.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import type { HenkatenFormDataInput } from "../../lib/form-schema";
import { HeaderFields } from "./HeaderFields";

function Harness() {
  const methods = useForm<HenkatenFormDataInput>({
    defaultValues: {
      judul: "",
      jenisHenkaten: "Material",
      jenisHenkatenManual: "",
      tujuan: "",
      waktuMulai: "",
      waktuSelesai: "",
      shiftCount: 1,
      warnaShift: [],
      bendaKerja: "",
      lineHeader: "",
      proses: "",
      approval: {
        productionDphProd: "",
        productionSecHead: "",
        engineeringDphEng: "",
        engineeringSecHead1: "",
        engineeringSecHead2: "",
        pemohon: "",
      },
      background: { descriptionHtml: "" },
      lineSections: [],
    },
  });
  return (
    <FormProvider {...methods}>
      <HeaderFields />
    </FormProvider>
  );
}

describe("HeaderFields", () => {
  it("reveals a manual input when Jenis Henkaten is Lain-lain", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.queryByPlaceholderText("Tulis jenis henkaten")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Jenis Henkaten"), "Lain-lain");

    expect(screen.getByPlaceholderText("Tulis jenis henkaten")).toBeInTheDocument();
  });

  it("previews the combined jumlah/periode label", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.selectOptions(screen.getByLabelText("Jumlah/Periode Shift"), "2");
    await user.click(screen.getByLabelText("White"));
    await user.click(screen.getByLabelText("Red"));

    expect(screen.getByTestId("jumlah-periode-preview")).toHaveTextContent("2 Shift (White Red)");
  });
});
```

- [ ] **Step 2: Write the failing test for `ApprovalFields`**

```tsx
// components/form/ApprovalFields.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import type { HenkatenFormDataInput } from "../../lib/form-schema";
import { ApprovalFields } from "./ApprovalFields";

function Harness() {
  const methods = useForm<HenkatenFormDataInput>({
    defaultValues: {
      judul: "",
      jenisHenkaten: "Material",
      jenisHenkatenManual: "",
      tujuan: "",
      waktuMulai: "",
      waktuSelesai: "",
      shiftCount: 1,
      warnaShift: [],
      bendaKerja: "",
      lineHeader: "",
      proses: "",
      approval: {
        productionDphProd: "",
        productionSecHead: "",
        engineeringDphEng: "",
        engineeringSecHead1: "",
        engineeringSecHead2: "",
        pemohon: "",
      },
      background: { descriptionHtml: "" },
      lineSections: [],
    },
  });
  return (
    <FormProvider {...methods}>
      <ApprovalFields />
      <span data-testid="pemohon-value">{methods.watch("approval.pemohon")}</span>
    </FormProvider>
  );
}

describe("ApprovalFields", () => {
  it("renders all six labelled name inputs", () => {
    render(<Harness />);
    [
      "Production - DpH.Prod",
      "Production - Sec.Head",
      "Engineering - DpH.Eng",
      "Engineering - Sec.Head 1",
      "Engineering - Sec.Head 2",
      "Pemohon",
    ].forEach((label) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
  });

  it("updates form state when typing a name", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("Pemohon"), "Hakim");

    expect(screen.getByTestId("pemohon-value")).toHaveTextContent("Hakim");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run components/form/HeaderFields.test.tsx components/form/ApprovalFields.test.tsx`
Expected: FAIL with "Cannot find module './HeaderFields'" and "Cannot find module './ApprovalFields'".

- [ ] **Step 4: Write `components/form/HeaderFields.tsx`**

```tsx
"use client";

import { useFormContext } from "react-hook-form";
import type { HenkatenFormDataInput } from "../../lib/form-schema";

const JENIS_OPTIONS = ["Material", "Mesin", "Metode", "Man", "Lain-lain"] as const;

export function HeaderFields() {
  const { register, watch } = useFormContext<HenkatenFormDataInput>();
  const jenisHenkaten = watch("jenisHenkaten");
  const shiftCount = watch("shiftCount");
  const warnaShift = watch("warnaShift");

  return (
    <fieldset className="space-y-3">
      <div>
        <label htmlFor="judul" className="block text-sm font-medium">Judul Trial/Henkaten</label>
        <input id="judul" {...register("judul")} className="mt-1 w-full rounded border border-gray-300 px-2 py-1" />
      </div>

      <div>
        <label htmlFor="jenisHenkaten" className="block text-sm font-medium">Jenis Henkaten</label>
        <select
          id="jenisHenkaten"
          {...register("jenisHenkaten")}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
        >
          {JENIS_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {jenisHenkaten === "Lain-lain" && (
          <input
            {...register("jenisHenkatenManual")}
            placeholder="Tulis jenis henkaten"
            className="mt-2 w-full rounded border border-gray-300 px-2 py-1"
          />
        )}
      </div>

      <div>
        <label htmlFor="tujuan" className="block text-sm font-medium">Tujuan / Pelaksanaan Henkaten</label>
        <textarea id="tujuan" {...register("tujuan")} rows={3} className="mt-1 w-full rounded border border-gray-300 px-2 py-1" />
      </div>

      <div className="flex gap-2">
        <div>
          <label htmlFor="waktuMulai" className="block text-sm font-medium">Waktu Mulai</label>
          <input id="waktuMulai" type="date" {...register("waktuMulai")} className="mt-1 rounded border border-gray-300 px-2 py-1" />
        </div>
        <div>
          <label htmlFor="waktuSelesai" className="block text-sm font-medium">Waktu Selesai</label>
          <input id="waktuSelesai" type="date" {...register("waktuSelesai")} className="mt-1 rounded border border-gray-300 px-2 py-1" />
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium">Jumlah/Periode</span>
        <div className="mt-1 flex items-center gap-4">
          <label htmlFor="shiftCount" className="sr-only">Jumlah/Periode Shift</label>
          <select
            id="shiftCount"
            aria-label="Jumlah/Periode Shift"
            {...register("shiftCount", { valueAsNumber: true })}
            className="rounded border border-gray-300 px-2 py-1"
          >
            <option value={1}>1 Shift</option>
            <option value={2}>2 Shift</option>
          </select>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" value="White" {...register("warnaShift")} /> White
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" value="Red" {...register("warnaShift")} /> Red
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500" data-testid="jumlah-periode-preview">
          {shiftCount} Shift{warnaShift?.length ? ` (${warnaShift.join(" ")})` : ""}
        </p>
      </div>

      <div>
        <label htmlFor="bendaKerja" className="block text-sm font-medium">Benda Kerja</label>
        <input id="bendaKerja" {...register("bendaKerja")} className="mt-1 w-full rounded border border-gray-300 px-2 py-1" />
      </div>

      <div>
        <label htmlFor="lineHeader" className="block text-sm font-medium">Line</label>
        <input id="lineHeader" {...register("lineHeader")} className="mt-1 w-full rounded border border-gray-300 px-2 py-1" />
      </div>

      <div>
        <label htmlFor="proses" className="block text-sm font-medium">Proses</label>
        <input id="proses" {...register("proses")} className="mt-1 w-full rounded border border-gray-300 px-2 py-1" />
      </div>
    </fieldset>
  );
}
```

- [ ] **Step 5: Write `components/form/ApprovalFields.tsx`**

```tsx
"use client";

import { useFormContext } from "react-hook-form";
import type { HenkatenFormDataInput } from "../../lib/form-schema";

const FIELDS: { name: keyof HenkatenFormDataInput["approval"]; label: string }[] = [
  { name: "productionDphProd", label: "Production - DpH.Prod" },
  { name: "productionSecHead", label: "Production - Sec.Head" },
  { name: "engineeringDphEng", label: "Engineering - DpH.Eng" },
  { name: "engineeringSecHead1", label: "Engineering - Sec.Head 1" },
  { name: "engineeringSecHead2", label: "Engineering - Sec.Head 2" },
  { name: "pemohon", label: "Pemohon" },
];

export function ApprovalFields() {
  const { register } = useFormContext<HenkatenFormDataInput>();

  return (
    <fieldset className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {FIELDS.map((field) => (
        <div key={field.name}>
          <label htmlFor={`approval-${field.name}`} className="block text-sm font-medium">
            {field.label}
          </label>
          <input
            id={`approval-${field.name}`}
            {...register(`approval.${field.name}`)}
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          />
        </div>
      ))}
    </fieldset>
  );
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run components/form/HeaderFields.test.tsx components/form/ApprovalFields.test.tsx`
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add components/form/HeaderFields.tsx components/form/ApprovalFields.tsx components/form/HeaderFields.test.tsx components/form/ApprovalFields.test.tsx
git commit -m "feat: add HeaderFields and ApprovalFields form sections"
```

---

### Task 12: UraianHenkatenSection & LineSectionList (Dynamic +/-)

**Files:**
- Create: `components/form/UraianHenkatenSection.tsx`
- Create: `components/form/LineSectionList.tsx`
- Test: `components/form/LineSectionList.test.tsx`

**Interfaces:**
- Consumes: `RichTextEditor` (Task 10), `DateRangeToggle` (Task 9), `PicInput` (Task 8), `LineSectionInput`/`LineOptions` (Task 2, 4), `useFieldArray`/`useFormContext` (react-hook-form).
- Produces: `LineSectionList()` (used by Task 13's `HenkatenForm`).

**Note:** This test mocks `RichTextEditor` (via a plain textarea substitute) so the dynamic add/remove behavior can be verified without depending on Tiptap internals in jsdom.

- [ ] **Step 1: Write the failing test**

```tsx
// components/form/LineSectionList.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import type { HenkatenFormDataInput } from "../../lib/form-schema";
import { LineSectionList } from "./LineSectionList";

vi.mock("./RichTextEditor", () => ({
  RichTextEditor: ({ value, onChange }: { value: string; onChange: (html: string) => void }) => (
    <textarea aria-label="Deskripsi" value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));

function Harness() {
  const methods = useForm<HenkatenFormDataInput>({
    defaultValues: {
      judul: "",
      jenisHenkaten: "Material",
      jenisHenkatenManual: "",
      tujuan: "",
      waktuMulai: "",
      waktuSelesai: "",
      shiftCount: 1,
      warnaShift: [],
      bendaKerja: "",
      lineHeader: "",
      proses: "",
      approval: {
        productionDphProd: "",
        productionSecHead: "",
        engineeringDphEng: "",
        engineeringSecHead1: "",
        engineeringSecHead2: "",
        pemohon: "",
      },
      background: { descriptionHtml: "" },
      lineSections: [],
    },
  });
  return (
    <FormProvider {...methods}>
      <LineSectionList />
    </FormProvider>
  );
}

describe("LineSectionList", () => {
  it("starts with no sections and adds one per click", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.queryAllByLabelText("Deskripsi")).toHaveLength(0);

    await user.click(screen.getByText("+ Tambah Section Line"));
    expect(screen.getAllByLabelText("Deskripsi")).toHaveLength(1);

    await user.click(screen.getByText("+ Tambah Section Line"));
    expect(screen.getAllByLabelText("Deskripsi")).toHaveLength(2);
  });

  it("removes only the targeted section", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByText("+ Tambah Section Line"));
    await user.click(screen.getByText("+ Tambah Section Line"));
    expect(screen.getAllByLabelText("Deskripsi")).toHaveLength(2);

    await user.click(screen.getByLabelText("Hapus section 1"));
    expect(screen.getAllByLabelText("Deskripsi")).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/form/LineSectionList.test.tsx`
Expected: FAIL with "Cannot find module './LineSectionList'".

- [ ] **Step 3: Write `components/form/UraianHenkatenSection.tsx`**

```tsx
"use client";

import { useFormContext } from "react-hook-form";
import type { HenkatenFormDataInput } from "../../lib/form-schema";
import { RichTextEditor } from "./RichTextEditor";
import { DateRangeToggle } from "./DateRangeToggle";
import { PicInput } from "./PicInput";

const LINE_OPTIONS = [
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
] as const;

interface UraianHenkatenSectionProps {
  index: number;
  onRemove: () => void;
}

export function UraianHenkatenSection({ index, onRemove }: UraianHenkatenSectionProps) {
  const { register, watch, setValue } = useFormContext<HenkatenFormDataInput>();
  const base = `lineSections.${index}` as const;

  const descriptionHtml = watch(`${base}.descriptionHtml`);
  const waktuMode = watch(`${base}.waktuMode`);
  const waktuStart = watch(`${base}.waktuStart`);
  const waktuEnd = watch(`${base}.waktuEnd`);
  const pic = watch(`${base}.pic`);

  return (
    <div className="space-y-2 rounded border border-gray-300 p-3">
      <div className="flex items-center justify-between">
        <select {...register(`${base}.line`)} className="rounded border border-gray-300 px-2 py-1 text-sm">
          {LINE_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-red-600"
          aria-label={`Hapus section ${index + 1}`}
        >
          Hapus
        </button>
      </div>

      <RichTextEditor
        value={descriptionHtml}
        onChange={(html) => setValue(`${base}.descriptionHtml`, html)}
        placeholder="Deskripsi"
      />

      <DateRangeToggle
        mode={waktuMode}
        start={waktuStart}
        end={waktuEnd}
        onModeChange={(mode) => setValue(`${base}.waktuMode`, mode)}
        onStartChange={(value) => setValue(`${base}.waktuStart`, value)}
        onEndChange={(value) => setValue(`${base}.waktuEnd`, value)}
      />

      <PicInput value={pic} onChange={(next) => setValue(`${base}.pic`, next)} />
    </div>
  );
}
```

- [ ] **Step 4: Write `components/form/LineSectionList.tsx`**

```tsx
"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import type { HenkatenFormDataInput, LineSectionInput } from "../../lib/form-schema";
import { UraianHenkatenSection } from "./UraianHenkatenSection";

function createEmptyLineSection(): LineSectionInput {
  return {
    id: crypto.randomUUID(),
    line: "Melting",
    descriptionHtml: "",
    waktuMode: "single",
    waktuStart: "",
    waktuEnd: "",
    pic: [],
  };
}

export function LineSectionList() {
  const { control } = useFormContext<HenkatenFormDataInput>();
  const { fields, append, remove } = useFieldArray({ control, name: "lineSections" });

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <UraianHenkatenSection key={field.id} index={index} onRemove={() => remove(index)} />
      ))}
      <button
        type="button"
        onClick={() => append(createEmptyLineSection())}
        className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
      >
        + Tambah Section Line
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/form/LineSectionList.test.tsx`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add components/form/UraianHenkatenSection.tsx components/form/LineSectionList.tsx components/form/LineSectionList.test.tsx
git commit -m "feat: add dynamic UraianHenkatenSection list with add/remove"
```

---

### Task 13: HenkatenForm Orchestrator

**Files:**
- Create: `components/form/HenkatenForm.tsx`
- Test: `components/form/HenkatenForm.test.tsx`

**Interfaces:**
- Consumes: `HeaderFields` (Task 11), `ApprovalFields` (Task 11), `RichTextEditor` (Task 10), `LineSectionList` (Task 12), `henkatenFormSchema`/`getLineSectionWarnings`/`HenkatenFormDataInput` (Task 4), `buildFileName` (Task 2), `zodResolver` (`@hookform/resolvers/zod`).
- Produces: `HenkatenForm()` (used by Task 14's `app/page.tsx`).

- [ ] **Step 1: Write the failing test**

```tsx
// components/form/HenkatenForm.test.tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/form/HenkatenForm.test.tsx`
Expected: FAIL with "Cannot find module './HenkatenForm'".

- [ ] **Step 3: Write `components/form/HenkatenForm.tsx`**

```tsx
"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  henkatenFormSchema,
  getLineSectionWarnings,
  type HenkatenFormDataInput,
} from "../../lib/form-schema";
import { buildFileName } from "../../lib/format-helpers";
import { HeaderFields } from "./HeaderFields";
import { ApprovalFields } from "./ApprovalFields";
import { LineSectionList } from "./LineSectionList";
import { RichTextEditor } from "./RichTextEditor";

const DEFAULT_VALUES: HenkatenFormDataInput = {
  judul: "",
  jenisHenkaten: "Material",
  jenisHenkatenManual: "",
  tujuan: "",
  waktuMulai: "",
  waktuSelesai: "",
  shiftCount: 1,
  warnaShift: [],
  bendaKerja: "",
  lineHeader: "",
  proses: "",
  approval: {
    productionDphProd: "",
    productionSecHead: "",
    engineeringDphEng: "",
    engineeringSecHead1: "",
    engineeringSecHead2: "",
    pemohon: "",
  },
  background: { descriptionHtml: "" },
  lineSections: [],
};

export function HenkatenForm() {
  const methods = useForm<HenkatenFormDataInput>({
    resolver: zodResolver(henkatenFormSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function onSubmit(data: HenkatenFormDataInput) {
    setSubmitError(null);
    setWarnings(getLineSectionWarnings(data));
    setIsGenerating(true);
    try {
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
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = buildFileName(data.judul, data.waktuMulai);
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Gagal generate PDF");
    } finally {
      setIsGenerating(false);
    }
  }

  const backgroundHtml = methods.watch("background.descriptionHtml");

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="mx-auto max-w-3xl space-y-6 p-6">
        <HeaderFields />
        <ApprovalFields />

        <div>
          <label className="block text-sm font-medium">Background</label>
          <RichTextEditor
            value={backgroundHtml}
            onChange={(html) => methods.setValue("background.descriptionHtml", html)}
            placeholder="Deskripsi background"
          />
        </div>

        <LineSectionList />

        {warnings.length > 0 && (
          <ul className="rounded border border-yellow-400 bg-yellow-50 p-3 text-sm text-yellow-800" role="status">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}

        {submitError && (
          <p role="alert" className="text-sm text-red-600">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={isGenerating}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {isGenerating ? "Membuat PDF..." : "Generate PDF"}
        </button>
      </form>
    </FormProvider>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/form/HenkatenForm.test.tsx`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/form/HenkatenForm.tsx components/form/HenkatenForm.test.tsx
git commit -m "feat: add HenkatenForm orchestrator with PDF download flow"
```

---

### Task 14: Wire Into the App Page & Manual End-to-End Verification

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `HenkatenForm` (Task 13).
- Produces: the final rendered page at `/`.

- [ ] **Step 1: Replace `app/page.tsx` with the real page**

```tsx
import { HenkatenForm } from "../components/form/HenkatenForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <h1 className="p-6 text-xl font-bold">Form Henkaten</h1>
      <HenkatenForm />
    </main>
  );
}
```

- [ ] **Step 2: Run the full automated test suite**

Run: `npm test`
Expected: all tests across every task PASS.

- [ ] **Step 3: Start the dev server and manually verify the golden path**

Run: `npm run dev`, then in a browser open `http://localhost:3000` and:
1. Fill Judul, Jenis Henkaten (try "Lain-lain" to confirm the manual text input appears), Tujuan, Waktu Mulai/Selesai, Jumlah/Periode (2 Shift, White + Red), Benda Kerja, Line, Proses, and all 6 approval names.
2. In Background, type a description and upload at least one photo; confirm it appears inline and can be resized by dragging its corner.
3. Click "+ Tambah Section Line" twice; fill each with a different Line dropdown value, a description, at least one photo, PIC (2+ names via Enter), and toggle one section to "Rentang tanggal".
4. Click "Generate PDF"; confirm a PDF file downloads automatically.
5. Open the downloaded PDF and confirm: header (logo placeholder, title, form number, approval names), Henkaten/Tujuan/Waktu/Jumlah-Periode/Benda-Kerja/Line/Proses values, Background section with photo, each Line section with its dropdown value/description/photo/waktu/PIC, and the static bottom boilerplate (Item yang harus dikonfirmasi, Tindak lanjut, Distribusi informasi, flow diagram) all appear and roughly match the layout of the two reference form photos.
6. Leave one added Line section's description empty and click "Generate PDF" again; confirm a warning message appears but the PDF still generates.

Expected: PDF downloads successfully and visually matches the reference layout; warnings appear for incomplete sections without blocking generation.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire HenkatenForm into the home page"
```

---

## Post-Plan Notes

- The PDF layout in Task 5 is a faithful first pass at the original form's structure (header/approval grid, info table, Uraian Henkaten table, static bottom boilerplate) built with hand-written CSS rather than pixel-measured from the scanned photos. After Task 14's manual verification, expect to spend a follow-up pass nudging `lib/pdf-template/pdf-styles.ts` spacing/column widths once the actual generated PDF is compared side-by-side with the two reference photos.
- When the real Toyota logo file becomes available, drop it into `public/logo.png` and replace the `.logo-box` placeholder `<div>LOGO</div>` in `renderHenkatenHtml.ts` with an `<img src="/logo.png" />` (or embed it as a base64 constant, since the API route does not have network access to `/public` at render time — reading it from disk via `fs.readFileSync` and converting to a data URI is the simplest approach). No other code changes needed.
