import type { HenkatenFormDataInput, LineSectionInput } from "../form-schema";
import { escapeHtml, sanitizeRichText } from "../html-safety";
import { formatDateID, formatDateRangeLabel, formatJumlahPeriode } from "../format-helpers";
import { pdfStyles } from "./pdf-styles";

const JENIS_OPTIONS = ["Material", "Mesin", "Metode", "Man", "Lain-lain"] as const;

function renderJenisTable(data: HenkatenFormDataInput): string {
  const headerCells = JENIS_OPTIONS.map((option) => `<th>${option}</th>`).join("");
  const bodyCells = JENIS_OPTIONS.map((option) => {
    const isSelected = data.jenisHenkaten === option;
    if (!isSelected) {
      return `<td></td>`;
    }
    const manual =
      option === "Lain-lain"
        ? `<span class="jenis-manual">${escapeHtml(data.jenisHenkatenManual || "Lain-lain")}</span>`
        : "";
    return `<td class="jenis-selected">&#10003;${manual}</td>`;
  }).join("");

  return `
    <table class="jenis-table">
      <tr>${headerCells}</tr>
      <tr>${bodyCells}</tr>
    </table>
  `;
}

function renderApprovalTable(data: HenkatenFormDataInput): string {
  const cols = Array.from({ length: 6 }, () => `<col style="width:16.6667%" />`).join("");
  return `
    <table class="approval-table">
      <colgroup>${cols}</colgroup>
      <tr>
        <th colspan="2">Production</th>
        <th colspan="3">Engineering</th>
        <th colspan="1">Pemohon</th>
      </tr>
      <tr>
        <td class="role-cell">DpH. Prod</td>
        <td class="role-cell">Sec.Head</td>
        <td class="role-cell">DpH. Eng</td>
        <td class="role-cell">Sec.Head</td>
        <td class="role-cell">Sec.Head</td>
        <td class="role-cell"></td>
      </tr>
      <tr>
        <td class="signature-cell"></td>
        <td class="signature-cell"></td>
        <td class="signature-cell"></td>
        <td class="signature-cell"></td>
        <td class="signature-cell"></td>
        <td class="signature-cell"></td>
      </tr>
      <tr>
        <td class="name-cell">${escapeHtml(data.approval.productionDphProd)}</td>
        <td class="name-cell">${escapeHtml(data.approval.productionSecHead)}</td>
        <td class="name-cell">${escapeHtml(data.approval.engineeringDphEng)}</td>
        <td class="name-cell">${escapeHtml(data.approval.engineeringSecHead1)}</td>
        <td class="name-cell">${escapeHtml(data.approval.engineeringSecHead2)}</td>
        <td class="name-cell">${escapeHtml(data.approval.pemohon)}</td>
      </tr>
    </table>
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
    <div class="header-top">
      <div class="logo-box">LOGO</div>
      <div class="title-box">
        <div class="company">PT. TMMIN &mdash; Casting Division</div>
        <div class="title">LEMBAR PERMOHONAN MELAKUKAN HENKATEN</div>
        <div class="formno">FRM-FB20-E007</div>
      </div>
    </div>
    ${renderApprovalTable(data)}
    ${renderJenisTable(data)}

    <div class="info-grid">
      <div class="info-left">
        <table>
          <tr>
            <td class="label">Henkaten</td>
            <td class="value-cell">${escapeHtml(data.judul)}</td>
          </tr>
          <tr>
            <td class="label">Tujuan / Pelaksanaan Henkaten</td>
            <td class="value-cell">${escapeHtml(data.tujuan)}</td>
          </tr>
          <tr>
            <td class="label">Waktu Pelaksanaan Henkaten</td>
            <td class="value-cell">${escapeHtml(waktuLabel)}</td>
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
