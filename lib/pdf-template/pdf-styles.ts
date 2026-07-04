export const pdfStyles = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #111; margin: 0; }
  .doc { border: 1px solid #000; }
  .header-top { display: flex; border-bottom: 1px solid #000; }
  .logo-box { width: 90px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-right: 1px solid #000; font-size: 9px; color: #888; }
  .logo-img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .title-box { flex: 1; padding: 6px 8px; }
  .title-box .company { font-weight: bold; font-size: 11px; }
  .title-box .title { font-weight: bold; font-size: 12px; margin-top: 4px; }
  .title-box .formno { font-size: 9px; margin-top: 8px; }
  .approval-table { width: 100%; border-collapse: collapse; table-layout: fixed; border-bottom: 1px solid #000; }
  .approval-table th, .approval-table td { border: 1px solid #000; padding: 3px; text-align: center; font-size: 9px; overflow: hidden; }
  .approval-table th { background: #f2f2f2; font-weight: bold; }
  .approval-table .role-cell { font-size: 8px; color: #555; padding: 1px 4px; }
  .approval-table .signature-cell { height: 50px; }
  .approval-table .name-cell { height: 12px; font-size: 8.5px; vertical-align: top; padding-top: 2px; padding-bottom: 2px; }
  .jenis-table { width: 100%; border-collapse: collapse; table-layout: fixed; border-bottom: 1px solid #000; }
  .jenis-table th, .jenis-table td { border: 1px solid #000; padding: 3px; text-align: center; font-size: 9px; }
  .jenis-table th { background: #f2f2f2; font-weight: bold; }
  .jenis-table td.jenis-selected { font-weight: bold; }
  .jenis-manual { display: block; font-size: 8px; color: #555; margin-top: 2px; }
  .info-grid { display: grid; grid-template-columns: 1fr 220px; border-bottom: 1px solid #000; }
  .info-left table, .info-right table { width: 100%; border-collapse: collapse; }
  .info-left td, .info-right td { border: 1px solid #000; padding: 4px; vertical-align: top; font-size: 9.5px; }
  .info-left .label, .info-right .label { font-weight: bold; width: 110px; background: #f2f2f2; }
  .info-left .value-cell { font-weight: bold; }
  .uraian-table { width: 100%; border-collapse: collapse; }
  .uraian-table th, .uraian-table td { border: 1px solid #000; padding: 4px; vertical-align: top; font-size: 9.5px; }
  .uraian-table th { background: #d9d9d9; text-align: center; }
  .col-uraian { width: 60%; }
  .col-waktu { width: 20%; }
  .col-pic { width: 20%; }
  .uraian-table td.col-waktu, .uraian-table td.col-pic { text-align: center; vertical-align: middle; font-weight: bold; }
  .section-title { font-weight: bold; margin-bottom: 4px; }
  .desc-html img { max-width: 100%; }
  .desc-html { line-height: 1.4; }
  .bottom-static table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  .bottom-static th, .bottom-static td { border: 1px solid #000; padding: 2px; font-size: 8px; }
  .bottom-block { margin-top: 4px; font-size: 8px; }
  .flow { display: flex; align-items: center; margin-top: 4px; font-size: 7.5px; }
  .flow-box { border: 1px solid #000; padding: 3px; flex: 1; text-align: center; }
  .flow-arrow { padding: 0 2px; }
`;
