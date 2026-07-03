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
