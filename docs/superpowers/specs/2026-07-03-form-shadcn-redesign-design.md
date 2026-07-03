# Design: Redesain Form Henkaten dengan shadcn/ui (Navbar + Footer)

**Tanggal:** 2026-07-03
**Status:** Approved

## Latar Belakang

Form web Henkaten ([[2026-07-02-henkaten-pdf-generator-design]]) saat ini fungsional tapi tampilannya masih polos: input/select/textarea Tailwind biasa tanpa navbar, footer, atau sistem desain yang konsisten. User minta form dirapikan dan didesain ulang bergaya modern-tapi-formal, memakai library shadcn/ui, lengkap dengan navbar dan footer.

Tujuan: redesain UI murni (visual + struktur markup), tanpa mengubah logika form, schema Zod, validasi, atau endpoint `/api/generate-pdf`. Layout PDF hasil generate tidak terpengaruh sama sekali — perubahan ini hanya di form pengisian (web), bukan template PDF.

## Arsitektur

- Tetap Next.js App Router + TypeScript + Tailwind CSS + react-hook-form, tidak ada perubahan stack inti.
- **shadcn/ui** ditambahkan via `npx shadcn@latest init`, yang menghasilkan `components.json`, `lib/utils.ts` (helper `cn()`), dan CSS variables tema di `app/globals.css`. Komponen shadcn di-generate ke `components/ui/*` (Button, Input, Textarea, Label, Checkbox, Card, Separator, Badge, Alert).
- **Ikon**: tambah dependency `lucide-react` (dipakai bareng shadcn di ekosistemnya) untuk ikon kecil (loading spinner, hapus, tambah, upload).
- **Font**: Inter di-load lewat `next/font/google` di `app/layout.tsx`, diterapkan sebagai font-sans global.
- Komponen form yang ada (`HeaderFields`, `ApprovalFields`, `LineSectionList`, `UraianHenkatenSection`, `PicInput`, `DateRangeToggle`, `RichTextEditor`) direstyle memakai komponen shadcn di atas — nama file, props, dan behaviour (register/watch/setValue react-hook-form) tidak berubah, hanya JSX/className yang diganti.
- Native `<select>` dan `<input type="date">` tetap dipakai (dibungkus styling shadcn-like via `Input`/utility classes), tidak diganti dengan Radix Select atau date-picker kalender kustom — supaya tidak ada refactor besar pada `register()` dan supaya scope tetap ketat sesuai YAGNI.

## Layout Halaman

- `app/layout.tsx` dipecah jadi tiga bagian: `<Navbar />`, `{children}`, `<Footer />`, dibungkus container flex-col `min-h-screen` supaya footer selalu di bawah (sticky footer pattern) meski konten pendek.
- **Navbar** (`components/layout/Navbar.tsx`): sticky top, `bg-slate-900 text-white`, border-bottom `border-slate-800`. Kiri: judul "Henkaten PDF Generator" (font-semibold) + subtitle kecil "Generate PDF Lembar Permohonan Henkaten" (text-slate-400, disembunyikan di layar sempit). Tanpa menu navigasi (single-page app).
- **Footer** (`components/layout/Footer.tsx`): `bg-slate-50 border-t`, satu baris center, text kecil `text-slate-500`: "© 2026 Henkaten PDF Generator".
- **Page shell**: background halaman `bg-slate-50`. Konten form dibungkus container `max-w-3xl` (mengikuti lebar form saat ini), padding responsif `px-4 py-8 sm:px-6`.
- **Tema warna**: aksen hijau industrial (emerald) di-set sebagai `--primary`/`--ring` pada CSS variables shadcn di `globals.css`, dipakai konsisten di semua tombol utama, focus ring, dan elemen aktif.

## Restrukturisasi Form

Form dipecah jadi beberapa `Card` shadcn bertajuk jelas (bagian "rapihkan"):

1. **Card "Informasi Umum"** — isi `HeaderFields`: judul, jenis henkaten (+ input manual kondisional), tujuan, waktu mulai/selesai, jumlah/periode (shift + checkbox warna), benda kerja, line, proses. Semua pakai `Input`/`Textarea`/`Label`/`Checkbox` shadcn; select tetap native dengan className bergaya `Input`.
2. **Card "Approval"** — isi `ApprovalFields`, grid `grid-cols-2 sm:grid-cols-3`, tiap field `Label` + `Input`.
3. **Card "Background"** — isi `RichTextEditor` level atas: tombol "Upload Foto" jadi `Button` variant `outline` kecil dengan ikon lucide `ImagePlus`, area editor Tiptap dibungkus container bergaya `Input` (border, rounded, focus-within ring).
4. **Card "Uraian Henkaten per Line"** — isi `LineSectionList`. Tiap item (`UraianHenkatenSection`) jadi nested `Card`/bordered block berisi:
   - Select Line (native, styled) + tombol "Hapus" (`Button` variant `ghost`, teks merah, ikon `Trash2`).
   - `RichTextEditor` (sama seperti Background).
   - `DateRangeToggle`: checkbox shadcn "Rentang tanggal" + input date bergaya `Input`.
   - `PicInput`: tiap nama jadi `Badge` dengan tombol hapus (×) di dalamnya, input tambah nama menyatu di kotak yang sama bergaya `Input`.
   - Tombol "+ Tambah Section Line" di bawah list: `Button` variant `outline`, border dashed, lebar penuh.
5. **Warnings** (peringatan section kosong) — `Alert` dengan className kuning/warning (border-yellow, bg-yellow-50), ikon `TriangleAlert`.
6. **Error submit** — `Alert` variant `destructive`.
7. **Submit button** — `Button` shadcn, lebar penuh di mobile / lebar konten di desktop, menampilkan ikon `Loader2` (animate-spin) + teks "Membuat PDF..." saat `isGenerating`.

Struktur `Card` antar-section dipisah dengan `Separator` atau spacing (`space-y-6`) — dipilih spacing antar Card (bukan satu Card besar berisi semua) supaya tiap bagian form terlihat sebagai unit visual terpisah dan lebih mudah dipindai (scan) user saat mengisi form panjang ini.

## Testing

- Semua test file `.test.tsx` yang sudah ada (`HeaderFields.test.tsx`, `ApprovalFields.test.tsx`, `LineSectionList.test.tsx`, `PicInput.test.tsx`, `DateRangeToggle.test.tsx`, `RichTextEditor.test.tsx`, `HenkatenForm.test.tsx`) harus tetap lulus tanpa perubahan assertion pada logika — hanya penyesuaian selector jika berbasis className yang berubah (idealnya test berbasis role/label/text sehingga tidak perlu diubah).
- Tidak perlu snapshot test visual baru; cukup pastikan `vitest run` tetap hijau setelah restyle.

## Di Luar Cakupan (Out of Scope)

- Tidak mengubah schema Zod, validasi, atau logic `onSubmit`/fetch ke `/api/generate-pdf`.
- Tidak mengubah template/layout PDF hasil generate (`lib/pdf-template/*`).
- Tidak membangun date-picker kalender kustom (Popover + Calendar shadcn) — tetap native `<input type="date">`.
- Tidak menambah halaman/menu navigasi baru — navbar tanpa link.
- Tidak mengganti native `<select>` dengan Radix Select — demi menghindari refactor besar pada `register()` react-hook-form.
