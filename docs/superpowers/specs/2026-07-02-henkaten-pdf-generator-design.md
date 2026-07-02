# Design: Aplikasi Generate PDF Henkaten

**Tanggal:** 2026-07-02
**Status:** Approved

## Latar Belakang

PT TMMIN Casting Division menggunakan form kertas "Lembar Permohonan Melakukan Henkaten" (FRM-FB20-E007) yang diisi manual dan dicetak dari Excel. Dua contoh form yang sudah diisi (scan foto) menjadi acuan layout yang harus direplikasi persis: header info + tabel approval, blok info henkaten (judul, tujuan, waktu, jenis, jumlah/periode, benda kerja, line, proses), tabel "Uraian Henkaten" (Background + beberapa section per line produksi dengan waktu & PIC), serta bagian statis (item konfirmasi, tindak lanjut, distribusi informasi, diagram flow).

Tujuan: ganti proses isi-manual-di-Excel dengan form web yang menghasilkan PDF dengan layout identik ke form asli, tanpa menyimpan data di server (stateless — isi form → generate → download).

## Arsitektur

- **Next.js (App Router) + TypeScript + Tailwind CSS**, tanpa database.
- **Form state**: `react-hook-form` + `useFieldArray` untuk daftar section "Uraian Henkaten" yang dinamis (ditambah lewat tombol +).
- **Rich text + gambar inline resizable**: `Tiptap` dengan ekstensi Image yang mendukung resize, dipakai di textarea Background dan tiap section Line — foto diselipkan di antara teks dan bisa diatur ukurannya seperti insert gambar di MS Word.
- **Upload foto**: dikonversi ke base64 data URL di klien (tanpa storage/bucket), dikompres otomatis ke maks ~1MB per foto sebelum disisipkan ke rich text, untuk menjaga ukuran payload tetap di bawah limit body size Vercel serverless function.
- **Generate PDF**: klik "Generate PDF" → seluruh data form (JSON, termasuk HTML rich text + gambar base64) dikirim ke API Route `/api/generate-pdf` → server merender data ke template HTML/Tailwind yang meniru layout form asli → `puppeteer-core` + `@sparticuz/chromium` mencetak HTML tsb ke PDF A4 potrait → PDF dikembalikan sebagai file untuk langsung di-download browser. Tidak ada file yang disimpan di server (stateless, sesuai keputusan: tanpa penyimpanan/riwayat).

### Kenapa Puppeteer, bukan react-pdf atau html2canvas

Dipertimbangkan 3 opsi:
1. **Puppeteer-core + @sparticuz/chromium (dipilih)** — render HTML/Tailwind ke PDF via headless Chromium yang kompatibel serverless Vercel. Fidelitas tertinggi untuk tabel berbingkai kompleks, teks tetap tajam & selectable, gambar ter-embed rapi.
2. **@react-pdf/renderer** — lebih ringan (tanpa headless browser, cold-start lebih cepat) tapi meniru tabel kompleks + rich text dengan gambar inline resizable jauh lebih rumit karena bukan HTML biasa.
3. **html2canvas + jsPDF** (client-side) — tidak butuh server tapi hasil berupa gambar (teks buram saat print, file besar, page-break sering berantakan). Kualitas tidak memadai untuk kebutuhan "persis layout".

## Struktur Field Form

### Header (info umum & approval)

| Field | Tipe | Catatan |
|---|---|---|
| Judul Trial/Henkaten | text input | wajib |
| Jenis Henkaten | dropdown single-select: Material / Mesin / Metode / Man / Lain-lain | jika "Lain-lain" dipilih, muncul input teks manual tambahan |
| Tujuan/Pelaksanaan Henkaten | textarea | |
| Waktu Pelaksanaan Henkaten | date picker mulai + selesai | wajib |
| Jumlah/Periode | pilih shift (1 atau 2) + pilih warna (White/Red/keduanya) | digabung otomatis jadi teks di PDF, mis. "2 Shift (White Red)" |
| Benda Kerja | text input | |
| Line (header) | text input bebas | wajib |
| Proses | text input bebas | wajib |

Kolom nama approval (6 kolom, semua text input, muncul di PDF tanpa gambar tanda tangan):
- Production – DpH.Prod
- Production – Sec.Head
- Engineering – DpH.Eng
- Engineering – Sec.Head 1
- Engineering – Sec.Head 2
- Pemohon

Catatan label: di form web dua kolom Sec.Head Engineering diberi label "Sec.Head 1" dan "Sec.Head 2" agar tidak membingungkan user saat mengisi, tapi di PDF hasil tetap tercetak "Sec.Head" saja (tanpa angka) sesuai layout asli.

Logo Toyota digambar sebagai placeholder kotak "LOGO" di PDF (file logo asli tinggal ditaruh di `/public` nanti tanpa mengubah kode). Judul form ("LEMBAR PERMOHONAN MELAKUKAN HENKATEN") dan nomor form ("FRM-FB20-E007") statis, mengikuti form asli.

### Tabel Uraian Henkaten (dinamis)

- **Background** (selalu ada, tidak bisa dihapus): rich text editor (deskripsi + foto inline resizable, bisa lebih dari satu foto). Tanpa kolom Waktu/PIC (sesuai form asli, baris Background tidak mengisi kolom tsb).
- **Section Line** (0 atau lebih, ditambah lewat tombol +, masing-masing punya tombol hapus):
  - Dropdown Line: Melting, Pouring, Analysis, Moulding, RCS, Core Making, Finishing, Maintenance, Die Press, Engineering
  - Rich text editor: deskripsi + foto inline resizable
  - Waktu: toggle "tanggal tunggal" vs "rentang tanggal" (mulai–selesai)
  - PIC: input tag, bisa lebih dari satu nama (chip yang bisa ditambah/dihapus)

### Bagian Statis Bawah (boilerplate, tanpa input form)

Digambar persis seperti form asli, tidak ada field untuk mengisi:
- Tabel "Item yang harus dikonfirmasi" (kosong)
- "Tindak lanjut" (kosong)
- "Distribusi informasi: 1. Engineering Quality 2. All Line"
- Diagram flow: "PIC Yang melakukan Henkaten → Sect Head Lokasi dilakukan Henkaten → Dept. Head Eng, Prod → Copy untuk yang berhubungan"

## Alur Generate PDF & Validasi

- **Tombol +**: menambah satu section Line baru di bawah section terakhir, tanpa batas maksimum.
- **Validasi minimal**: wajib diisi = Judul Henkaten, Waktu Pelaksanaan, Line (header), Proses. Section Line yang ditambah tapi dibiarkan kosong hanya diberi peringatan (warning), tidak diblokir keras — user tetap bisa generate versi draft.
- **Alur klik Generate**: tombol menampilkan loading state → POST ke `/api/generate-pdf` → sukses: PDF langsung terunduh dengan nama file otomatis `Henkaten_<judul-slug>_<tanggal>.pdf` → gagal (payload gambar kebesaran, error render, dll): tampilkan pesan error jelas di form tanpa menghilangkan data yang sudah diisi user.

## Di Luar Cakupan (Out of Scope)

- Tidak ada database / penyimpanan riwayat submission di server.
- Tidak ada autentikasi/login.
- Tidak ada tanda tangan digital (gambar signature) — hanya nama teks.
- Tidak ada fitur crop/rotate foto — hanya resize & posisi (seperti insert gambar Word).
- Logo asli belum tersedia — pakai placeholder.
