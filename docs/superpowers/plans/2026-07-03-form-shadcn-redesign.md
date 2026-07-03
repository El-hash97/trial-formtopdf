# Form shadcn/ui Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Henkaten web form to a modern-but-formal look using shadcn/ui-style components, with a navbar and footer, without changing any form logic, validation, or PDF generation behavior.

**Architecture:** Introduce a local shadcn/ui component layer (`components/ui/*`) built by hand (not the `shadcn` CLI, to keep every file's contents explicit and deterministic) on top of the existing Tailwind config, themed via CSS variables (emerald/green primary, slate neutrals). Wrap the existing page in a `Navbar` + `Footer` shell. Restyle each existing form component in place — same props, same `react-hook-form` `register`/`watch`/`setValue` wiring, same accessible labels/roles/test ids — only the JSX/className changes to use the new primitives.

**Tech Stack:** Next.js (App Router, TypeScript), Tailwind CSS, `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/react-label`, `lucide-react`, `next/font/google` (Inter). No new test framework — existing Vitest + React Testing Library setup is reused.

## Global Constraints

- Pure UI redesign: do not change `lib/form-schema.ts`, any validation, the `/api/generate-pdf` route, or `lib/pdf-template/*` (spec: "Di Luar Cakupan").
- Every existing accessible label text, `aria-label`, placeholder, `data-testid`, and text content used by an existing `.test.tsx` file must stay byte-identical so the existing test suite passes unmodified (spec: "Testing"). Where this doc's code changes a visible string, it explicitly says so and that string must match what the corresponding test expects.
- No Radix Select and no calendar/date-picker component — keep native `<select>` and `<input type="date">`, just restyled, to avoid a `react-hook-form` `register()`/`Controller` refactor (spec: "Di Luar Cakupan").
- Checkboxes stay native `<input type="checkbox">` (styled), not Radix Checkbox, for the same `register()`-compatibility reason — this is a deliberate deviation from the shadcn-standard Radix-based Checkbox, documented here so it isn't "fixed" later.
- Navbar has no navigation links (logo/title only); footer is a single copyright line — both per approved design.
- Color theme: slate neutrals + emerald/green primary (`--primary: 160 84% 30%` in HSL). Font: Inter via `next/font/google`.
- All new source files use relative imports (`../../lib/...`, `../ui/...`), matching this codebase's existing convention — no `@/` alias imports anywhere despite the alias being configured.

---

### Task 1: Design tokens, Tailwind theme, and `cn()` helper

**Files:**
- Create: `lib/utils.ts`
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` from `lib/utils.ts`, imported by every `components/ui/*` file in later tasks. Produces Tailwind theme colors (`border`, `input`, `ring`, `background`, `foreground`, `primary`, `secondary`, `destructive`, `muted`, `accent`, `card`) and `borderRadius` (`lg`/`md`/`sm`) driven by CSS variables, consumed by every `components/ui/*` className in later tasks. Produces `font-sans` mapped to the `--font-inter` CSS variable, consumed by Task 3.

- [ ] **Step 1: Install the new dependencies**

Run: `npm install class-variance-authority clsx tailwind-merge lucide-react @radix-ui/react-label`

Expected: command exits 0, `package.json` `dependencies` now includes all five packages, `package-lock.json` updated.

- [ ] **Step 2: Create `lib/utils.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Replace `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 4: Replace `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --primary: 160 84% 30%;
    --primary-foreground: 0 0% 100%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 210 40% 96%;
    --accent-foreground: 222 47% 11%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 160 84% 30%;
    --radius: 0.5rem;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 5: Verify the project still type-checks**

Run: `npx tsc --noEmit`

Expected: exits 0, no type errors.

- [ ] **Step 6: Commit**

```bash
git add lib/utils.ts tailwind.config.ts app/globals.css package.json package-lock.json
git commit -m "chore: add shadcn-style design tokens and cn() helper"
```

---

### Task 2: shadcn-style UI primitives

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/textarea.tsx`
- Create: `components/ui/label.tsx`
- Create: `components/ui/checkbox.tsx`
- Create: `components/ui/card.tsx`
- Create: `components/ui/badge.tsx`
- Create: `components/ui/alert.tsx`
- Test: `components/ui/primitives.test.tsx`

**Interfaces:**
- Consumes: `cn` from `../../lib/utils` (Task 1).
- Produces: `Button`/`buttonVariants` (variants: `default`, `outline`, `ghost`, `destructive`; sizes: `default`, `sm`, `icon`), `Input`, `Textarea`, `Label`, `Checkbox` (native `<input type="checkbox">`, styled, forwards all props), `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`, `Badge`, `Alert`/`AlertDescription` (variants: `default`, `destructive`; `role` prop defaults to `"status"`). All consumed by Tasks 4–10.

- [ ] **Step 1: Write the failing smoke test**

Create `components/ui/primitives.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { Checkbox } from "./checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import { Badge } from "./badge";
import { Alert, AlertDescription } from "./alert";

describe("ui primitives", () => {
  it("renders a Button as a native button element", () => {
    render(<Button>Simpan</Button>);
    expect(screen.getByRole("button", { name: "Simpan" })).toBeInTheDocument();
  });

  it("associates Label with Input via htmlFor", () => {
    render(
      <>
        <Label htmlFor="nama">Nama</Label>
        <Input id="nama" />
      </>
    );
    expect(screen.getByLabelText("Nama")).toBeInTheDocument();
  });

  it("renders a Textarea", () => {
    render(<Textarea aria-label="Catatan" />);
    expect(screen.getByLabelText("Catatan")).toBeInTheDocument();
  });

  it("renders a native checkbox input", () => {
    render(<Checkbox aria-label="Setuju" />);
    expect(screen.getByLabelText("Setuju")).toHaveAttribute("type", "checkbox");
  });

  it("renders Card sections", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Judul Kartu</CardTitle>
        </CardHeader>
        <CardContent>Isi kartu</CardContent>
      </Card>
    );
    expect(screen.getByText("Judul Kartu")).toBeInTheDocument();
    expect(screen.getByText("Isi kartu")).toBeInTheDocument();
  });

  it("renders a Badge", () => {
    render(<Badge>Budi</Badge>);
    expect(screen.getByText("Budi")).toBeInTheDocument();
  });

  it("renders an Alert with the given role", () => {
    render(
      <Alert variant="destructive" role="alert">
        <AlertDescription>Terjadi kesalahan</AlertDescription>
      </Alert>
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Terjadi kesalahan");
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run components/ui/primitives.test.tsx`

Expected: FAIL — none of `./button`, `./input`, etc. exist yet.

- [ ] **Step 3: Create `components/ui/button.tsx`**

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

- [ ] **Step 4: Create `components/ui/input.tsx`**

```tsx
import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
```

- [ ] **Step 5: Create `components/ui/textarea.tsx`**

```tsx
import * as React from "react";
import { cn } from "../../lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
```

- [ ] **Step 6: Create `components/ui/label.tsx`**

```tsx
"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "../../lib/utils";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

- [ ] **Step 7: Create `components/ui/checkbox.tsx`**

```tsx
import * as React from "react";
import { cn } from "../../lib/utils";

const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      className={cn(
        "h-4 w-4 shrink-0 rounded-sm border border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
```

- [ ] **Step 8: Create `components/ui/card.tsx`**

```tsx
import * as React from "react";
import { cn } from "../../lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-4 p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
```

- [ ] **Step 9: Create `components/ui/badge.tsx`**

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border border-transparent bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground transition-colors",
  {
    variants: { variant: { default: "" } },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

- [ ] **Step 10: Create `components/ui/alert.tsx`**

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const alertVariants = cva("relative w-full rounded-lg border p-4 text-sm", {
  variants: {
    variant: {
      default: "border-yellow-400 bg-yellow-50 text-yellow-800",
      destructive: "border-destructive/50 bg-destructive/10 text-destructive",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, role, ...props }, ref) => (
    <div ref={ref} role={role ?? "status"} className={cn(alertVariants({ variant }), className)} {...props} />
  )
);
Alert.displayName = "Alert";

const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  )
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription };
```

- [ ] **Step 11: Run the test again to confirm it passes**

Run: `npx vitest run components/ui/primitives.test.tsx`

Expected: PASS (7 tests).

- [ ] **Step 12: Commit**

```bash
git add components/ui
git commit -m "feat: add shadcn-style UI primitives"
```

---

### Task 3: Navbar, Footer, and page shell

**Files:**
- Create: `components/layout/Navbar.tsx`
- Create: `components/layout/Navbar.test.tsx`
- Create: `components/layout/Footer.tsx`
- Create: `components/layout/Footer.test.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Produces: `Navbar` and `Footer` components (no props), consumed by `app/layout.tsx` in this task.

- [ ] **Step 1: Write the failing tests**

Create `components/layout/Navbar.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Navbar } from "./Navbar";

describe("Navbar", () => {
  it("shows the app title", () => {
    render(<Navbar />);
    expect(screen.getByText("Henkaten PDF Generator")).toBeInTheDocument();
  });
});
```

Create `components/layout/Footer.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("shows the copyright line", () => {
    render(<Footer />);
    expect(screen.getByText("© 2026 Henkaten PDF Generator")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run them to confirm they fail**

Run: `npx vitest run components/layout`

Expected: FAIL — `./Navbar` and `./Footer` don't exist yet.

- [ ] **Step 3: Create `components/layout/Navbar.tsx`**

```tsx
export function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900 text-white">
      <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6">
        <div>
          <p className="text-base font-semibold leading-tight">Henkaten PDF Generator</p>
          <p className="hidden text-xs text-slate-400 sm:block">
            Generate PDF Lembar Permohonan Henkaten
          </p>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Create `components/layout/Footer.tsx`**

```tsx
export function Footer() {
  return (
    <footer className="border-t bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-4 text-center text-xs text-slate-500 sm:px-6">
        © 2026 Henkaten PDF Generator
      </div>
    </footer>
  );
}
```

- [ ] **Step 5: Run the tests again to confirm they pass**

Run: `npx vitest run components/layout`

Expected: PASS (2 tests).

- [ ] **Step 6: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Generate PDF Henkaten",
  description: "Form untuk mengisi dan generate PDF Lembar Permohonan Henkaten",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Replace `app/page.tsx`**

```tsx
import { HenkatenForm } from "../components/form/HenkatenForm";

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <HenkatenForm />
    </div>
  );
}
```

- [ ] **Step 8: Run the full test suite to confirm nothing else broke**

Run: `npx vitest run`

Expected: PASS — all existing test files plus the two new layout tests and Task 2's primitives test.

- [ ] **Step 9: Commit**

```bash
git add components/layout app/layout.tsx app/page.tsx
git commit -m "feat: add navbar, footer, and page shell"
```

---

### Task 4: Restyle `HeaderFields`

**Files:**
- Modify: `components/form/HeaderFields.tsx`
- Test: `components/form/HeaderFields.test.tsx` (already exists, unmodified)

**Interfaces:**
- Consumes: `Input`, `Textarea`, `Label`, `Checkbox` from `../ui/*` (Task 2).
- No prop/behavior changes — same `id`s (`judul`, `jenisHenkaten`, `tujuan`, `waktuMulai`, `waktuSelesai`, `shiftCount`, `bendaKerja`, `lineHeader`, `proses`), same `aria-label="Jumlah/Periode Shift"`, same `data-testid="jumlah-periode-preview"`, same placeholder `"Tulis jenis henkaten"`, same checkbox labels `"White"`/`"Red"`.

- [ ] **Step 1: Confirm the existing test currently passes (baseline)**

Run: `npx vitest run components/form/HeaderFields.test.tsx`

Expected: PASS (2 tests) — this is the pre-restyle baseline.

- [ ] **Step 2: Replace `components/form/HeaderFields.tsx`**

```tsx
"use client";

import { useFormContext } from "react-hook-form";
import type { HenkatenFormDataInput } from "../../lib/form-schema";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";

const JENIS_OPTIONS = ["Material", "Mesin", "Metode", "Man", "Lain-lain"] as const;

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function HeaderFields() {
  const { register, watch } = useFormContext<HenkatenFormDataInput>();
  const jenisHenkaten = watch("jenisHenkaten");
  const shiftCount = watch("shiftCount");
  const warnaShift = watch("warnaShift");

  return (
    <fieldset className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="judul">Judul Trial/Henkaten</Label>
        <Input id="judul" {...register("judul")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="jenisHenkaten">Jenis Henkaten</Label>
        <select id="jenisHenkaten" {...register("jenisHenkaten")} className={SELECT_CLASS}>
          {JENIS_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {jenisHenkaten === "Lain-lain" && (
          <Input
            {...register("jenisHenkatenManual")}
            placeholder="Tulis jenis henkaten"
            className="mt-2"
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tujuan">Tujuan / Pelaksanaan Henkaten</Label>
        <Textarea id="tujuan" {...register("tujuan")} rows={3} />
      </div>

      <div className="flex gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="waktuMulai">Waktu Mulai</Label>
          <Input id="waktuMulai" type="date" {...register("waktuMulai")} className="w-auto" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="waktuSelesai">Waktu Selesai</Label>
          <Input id="waktuSelesai" type="date" {...register("waktuSelesai")} className="w-auto" />
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="block text-sm font-medium">Jumlah/Periode</span>
        <div className="flex items-center gap-4">
          <label htmlFor="shiftCount" className="sr-only">Jumlah/Periode Shift</label>
          <select
            id="shiftCount"
            aria-label="Jumlah/Periode Shift"
            {...register("shiftCount", { valueAsNumber: true })}
            className="h-10 w-auto rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value={1}>1 Shift</option>
            <option value={2}>2 Shift</option>
          </select>
          <label className="flex items-center gap-1.5 text-sm">
            <Checkbox value="White" {...register("warnaShift")} /> White
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <Checkbox value="Red" {...register("warnaShift")} /> Red
          </label>
        </div>
        <p className="text-xs text-muted-foreground" data-testid="jumlah-periode-preview">
          {shiftCount} Shift{warnaShift?.length ? ` (${warnaShift.join(" ")})` : ""}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bendaKerja">Benda Kerja</Label>
        <Input id="bendaKerja" {...register("bendaKerja")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lineHeader">Line</Label>
        <Input id="lineHeader" {...register("lineHeader")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="proses">Proses</Label>
        <Input id="proses" {...register("proses")} />
      </div>
    </fieldset>
  );
}
```

- [ ] **Step 3: Run the test again to confirm it still passes**

Run: `npx vitest run components/form/HeaderFields.test.tsx`

Expected: PASS (2 tests), no assertion changes needed.

- [ ] **Step 4: Commit**

```bash
git add components/form/HeaderFields.tsx
git commit -m "style: restyle HeaderFields with shadcn-style primitives"
```

---

### Task 5: Restyle `ApprovalFields`

**Files:**
- Modify: `components/form/ApprovalFields.tsx`
- Test: `components/form/ApprovalFields.test.tsx` (already exists, unmodified)

**Interfaces:**
- Consumes: `Input`, `Label` from `../ui/*` (Task 2).
- No prop/behavior changes — same six labels (`"Production - DpH.Prod"`, `"Production - Sec.Head"`, `"Engineering - DpH.Eng"`, `"Engineering - Sec.Head 1"`, `"Engineering - Sec.Head 2"`, `"Pemohon"`) and same `id={approval-${field.name}}`.

- [ ] **Step 1: Confirm baseline passes**

Run: `npx vitest run components/form/ApprovalFields.test.tsx`

Expected: PASS (2 tests).

- [ ] **Step 2: Replace `components/form/ApprovalFields.tsx`**

```tsx
"use client";

import { useFormContext } from "react-hook-form";
import type { HenkatenFormDataInput } from "../../lib/form-schema";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

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
    <fieldset className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {FIELDS.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <Label htmlFor={`approval-${field.name}`}>{field.label}</Label>
          <Input id={`approval-${field.name}`} {...register(`approval.${field.name}`)} />
        </div>
      ))}
    </fieldset>
  );
}
```

- [ ] **Step 3: Run the test again to confirm it still passes**

Run: `npx vitest run components/form/ApprovalFields.test.tsx`

Expected: PASS (2 tests).

- [ ] **Step 4: Commit**

```bash
git add components/form/ApprovalFields.tsx
git commit -m "style: restyle ApprovalFields with shadcn-style primitives"
```

---

### Task 6: Restyle `PicInput`

**Files:**
- Modify: `components/form/PicInput.tsx`
- Test: `components/form/PicInput.test.tsx` (already exists, unmodified)

**Interfaces:**
- Consumes: `Badge` from `../ui/badge` (Task 2).
- No prop/behavior changes — same placeholder `"Ketik nama, Enter untuk tambah"`, same `aria-label={Hapus ${name}}`, names still rendered as plain text found via `getByText`.

- [ ] **Step 1: Confirm baseline passes**

Run: `npx vitest run components/form/PicInput.test.tsx`

Expected: PASS (2 tests).

- [ ] **Step 2: Replace `components/form/PicInput.tsx`**

```tsx
"use client";

import { useState, type KeyboardEvent } from "react";
import { Badge } from "../ui/badge";

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
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background p-2 focus-within:ring-2 focus-within:ring-ring">
      {value.map((name, index) => (
        <Badge key={`${name}-${index}`} className="gap-1 py-1">
          {name}
          <button
            type="button"
            aria-label={`Hapus ${name}`}
            onClick={() => removeName(index)}
            className="text-muted-foreground hover:text-destructive"
          >
            &times;
          </button>
        </Badge>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addName}
        placeholder="Ketik nama, Enter untuk tambah"
        className="min-w-[140px] flex-1 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
```

- [ ] **Step 3: Run the test again to confirm it still passes**

Run: `npx vitest run components/form/PicInput.test.tsx`

Expected: PASS (2 tests).

- [ ] **Step 4: Commit**

```bash
git add components/form/PicInput.tsx
git commit -m "style: restyle PicInput with shadcn-style Badge chips"
```

---

### Task 7: Restyle `DateRangeToggle`

**Files:**
- Modify: `components/form/DateRangeToggle.tsx`
- Test: `components/form/DateRangeToggle.test.tsx` (already exists, unmodified)

**Interfaces:**
- Consumes: `Checkbox` from `../ui/checkbox`, `Input` from `../ui/input` (Task 2).
- No prop/behavior changes — same `aria-label`s (`"Tanggal"`, `"Tanggal mulai"`, `"Tanggal selesai"`), same label text `"Rentang tanggal"`.

- [ ] **Step 1: Confirm baseline passes**

Run: `npx vitest run components/form/DateRangeToggle.test.tsx`

Expected: PASS (3 tests).

- [ ] **Step 2: Replace `components/form/DateRangeToggle.tsx`**

```tsx
"use client";

import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";

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
        <Checkbox
          checked={mode === "range"}
          onChange={(event) => onModeChange(event.target.checked ? "range" : "single")}
        />
        Rentang tanggal
      </label>
      {mode === "single" ? (
        <Input
          type="date"
          aria-label="Tanggal"
          value={start}
          onChange={(event) => onStartChange(event.target.value)}
          className="w-auto text-sm"
        />
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="Tanggal mulai"
            value={start}
            onChange={(event) => onStartChange(event.target.value)}
            className="w-auto text-sm"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="date"
            aria-label="Tanggal selesai"
            value={end}
            onChange={(event) => onEndChange(event.target.value)}
            className="w-auto text-sm"
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Run the test again to confirm it still passes**

Run: `npx vitest run components/form/DateRangeToggle.test.tsx`

Expected: PASS (3 tests).

- [ ] **Step 4: Commit**

```bash
git add components/form/DateRangeToggle.tsx
git commit -m "style: restyle DateRangeToggle with shadcn-style primitives"
```

---

### Task 8: Restyle `RichTextEditor`

**Files:**
- Modify: `components/form/RichTextEditor.tsx`
- Test: `components/form/RichTextEditor.test.tsx` (already exists, unmodified)

**Interfaces:**
- Consumes: `buttonVariants` from `../ui/button`, `cn` from `../../lib/utils` (Task 1–2), `ImagePlus` icon from `lucide-react`.
- No prop/behavior changes — the upload trigger stays a `<label>` wrapping a hidden `<input type="file">` (required so `screen.getByText("Upload Foto").querySelector("input")` keeps working), text stays exactly `"Upload Foto"`.

- [ ] **Step 1: Confirm baseline passes**

Run: `npx vitest run components/form/RichTextEditor.test.tsx`

Expected: PASS (2 tests).

- [ ] **Step 2: Replace `components/form/RichTextEditor.tsx`**

```tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ResizeImage from "tiptap-extension-resize-image";
import type { ChangeEvent } from "react";
import { ImagePlus } from "lucide-react";
import { compressImageToDataUrl } from "../../lib/image-compress";
import { buttonVariants } from "../ui/button";
import { cn } from "../../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, ResizeImage.configure({ inline: true })],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "min-h-[120px] rounded-md border border-input p-3 text-sm focus:outline-none",
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
      <label className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer")}>
        <ImagePlus className="h-4 w-4" />
        Upload Foto
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
      </label>
      <EditorContent editor={editor} />
    </div>
  );
}
```

- [ ] **Step 3: Run the test again to confirm it still passes**

Run: `npx vitest run components/form/RichTextEditor.test.tsx`

Expected: PASS (2 tests) — `getByText("Upload Foto")` still resolves to the `<label>` (the `ImagePlus` SVG contributes no text content) and `.querySelector("input")` still finds the file input inside it.

- [ ] **Step 4: Commit**

```bash
git add components/form/RichTextEditor.tsx
git commit -m "style: restyle RichTextEditor upload button with shadcn-style Button"
```

---

### Task 9: Restyle `UraianHenkatenSection` and `LineSectionList`

**Files:**
- Modify: `components/form/UraianHenkatenSection.tsx`
- Modify: `components/form/LineSectionList.tsx`
- Test: `components/form/LineSectionList.test.tsx` (already exists, unmodified)

**Interfaces:**
- Consumes: `Button` from `../ui/button`, `Card`/`CardContent` from `../ui/card` (Task 2), `Trash2` icon from `lucide-react`.
- No prop/behavior changes — same `aria-label={Hapus section ${index + 1}}`, and the "add section" button text stays exactly `"+ Tambah Section Line"` (the existing test does an exact-text `getByText` match on this string).

- [ ] **Step 1: Confirm baseline passes**

Run: `npx vitest run components/form/LineSectionList.test.tsx`

Expected: PASS (2 tests).

- [ ] **Step 2: Replace `components/form/UraianHenkatenSection.tsx`**

```tsx
"use client";

import { useFormContext } from "react-hook-form";
import { Trash2 } from "lucide-react";
import type { HenkatenFormDataInput } from "../../lib/form-schema";
import { RichTextEditor } from "./RichTextEditor";
import { DateRangeToggle } from "./DateRangeToggle";
import { PicInput } from "./PicInput";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

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
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <select
            {...register(`${base}.line`)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {LINE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={`Hapus section ${index + 1}`}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </Button>
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
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Replace `components/form/LineSectionList.tsx`**

```tsx
"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import type { HenkatenFormDataInput, LineSectionInput } from "../../lib/form-schema";
import { UraianHenkatenSection } from "./UraianHenkatenSection";
import { Button } from "../ui/button";

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
    <div className="space-y-4">
      {fields.map((field, index) => (
        <UraianHenkatenSection key={field.id} index={index} onRemove={() => remove(index)} />
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => append(createEmptyLineSection())}
        className="w-full border-dashed"
      >
        + Tambah Section Line
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Run the test again to confirm it still passes**

Run: `npx vitest run components/form/LineSectionList.test.tsx`

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/form/UraianHenkatenSection.tsx components/form/LineSectionList.tsx
git commit -m "style: restyle line section list with shadcn-style Card and Button"
```

---

### Task 10: Restyle `HenkatenForm` (Card grouping, Alert, submit button)

**Files:**
- Modify: `components/form/HenkatenForm.tsx`
- Test: `components/form/HenkatenForm.test.tsx` (already exists, unmodified)

**Interfaces:**
- Consumes: `Button` from `../ui/button`, `Card`/`CardHeader`/`CardTitle`/`CardContent` from `../ui/card`, `Alert`/`AlertDescription` from `../ui/alert` (Task 2), `Loader2` icon from `lucide-react`.
- No prop/behavior changes — `onSubmit`, fetch call, error/warning state, and the button's accessible name `"Generate PDF"` (default state) stay identical. The warnings block keeps `role="status"`; the error block keeps `role="alert"`.

- [ ] **Step 1: Confirm baseline passes**

Run: `npx vitest run components/form/HenkatenForm.test.tsx`

Expected: PASS (2 tests).

- [ ] **Step 2: Replace `components/form/HenkatenForm.tsx`**

```tsx
"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";

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
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Umum</CardTitle>
          </CardHeader>
          <CardContent>
            <HeaderFields />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <ApprovalFields />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Background</CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              value={backgroundHtml}
              onChange={(html) => methods.setValue("background.descriptionHtml", html)}
              placeholder="Deskripsi background"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uraian Henkaten per Line</CardTitle>
          </CardHeader>
          <CardContent>
            <LineSectionList />
          </CardContent>
        </Card>

        {warnings.length > 0 && (
          <Alert role="status">
            <AlertDescription>
              <ul>
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {submitError && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isGenerating} className="w-full sm:w-auto">
          {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
          {isGenerating ? "Membuat PDF..." : "Generate PDF"}
        </Button>
      </form>
    </FormProvider>
  );
}
```

- [ ] **Step 3: Run the test again to confirm it still passes**

Run: `npx vitest run components/form/HenkatenForm.test.tsx`

Expected: PASS (2 tests) — the error alert's accessible role stays `"alert"` and the submit button's default accessible name stays `"Generate PDF"`.

- [ ] **Step 4: Commit**

```bash
git add components/form/HenkatenForm.tsx
git commit -m "style: group HenkatenForm into shadcn-style Cards with Alert and loading button"
```

---

### Task 11: Full regression check and visual smoke test

**Files:** none (verification only)

**Interfaces:** none — this task only runs checks.

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`

Expected: PASS — every test file in `components/ui`, `components/layout`, and `components/form` is green, with no assertion changes from before this plan.

- [ ] **Step 2: Type-check the whole project**

Run: `npx tsc --noEmit`

Expected: exits 0, no type errors.

- [ ] **Step 3: Start the dev server and visually confirm the redesign**

Run: `npm run dev` (use a free port if 3000 is occupied, e.g. `npm run dev -- -p 3100`)

Open the app in a browser and confirm:
- Dark slate navbar at the top showing "Henkaten PDF Generator".
- Page background is light slate, form content is centered in Cards titled "Informasi Umum", "Approval", "Background", "Uraian Henkaten per Line".
- Buttons and focus rings use the emerald/green accent color.
- Footer at the bottom shows "© 2026 Henkaten PDF Generator".
- Adding a Line section, uploading a photo, toggling date range, and adding a PIC tag all still work exactly as before.

Stop the dev server once confirmed (`Ctrl+C`).

- [ ] **Step 4: Commit (only if Step 3 required follow-up fixes)**

If Step 3 required no code changes, there is nothing to commit for this task. If a visual bug was fixed, stage and commit that specific fix with a message describing what was wrong.
