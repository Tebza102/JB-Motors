import {
  DOCUMENT_PROFILE,
  ESTIMATE_DOCUMENT,
  INVOICE_DOCUMENT,
  MONTHLY_REPORT_DOCUMENT,
  PDF_FILENAMES,
  SERVICE_HISTORY_DOCUMENT,
} from "./data.ts";
import type { PdfDocumentKind } from "./data.ts";

type PdfLib = typeof import("pdf-lib");
type PdfDocument = Awaited<ReturnType<PdfLib["PDFDocument"]["create"]>>;
type PdfPage = ReturnType<PdfDocument["addPage"]>;
type PdfFont = Awaited<ReturnType<PdfDocument["embedFont"]>>;

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 46;
const BODY_WIDTH = PAGE_WIDTH - MARGIN * 2;

function ascii(value: string): string {
  return value
    .replaceAll("’", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("−", "-")
    .replaceAll("·", "-")
    .replaceAll("…", "...")
    .replace(/[^\x20-\x7E]/g, "");
}

function wrapText(value: string, font: PdfFont, size: number, maxWidth: number): string[] {
  const words = ascii(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) current = candidate;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

async function createRenderer(logoBytes?: Uint8Array) {
  const pdfLib = await import("pdf-lib");
  const pdfDoc = await pdfLib.PDFDocument.create();
  const regular = await pdfDoc.embedFont(pdfLib.StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(pdfLib.StandardFonts.HelveticaBold);
  let logo: Awaited<ReturnType<PdfDocument["embedPng"]>> | null = null;
  if (logoBytes?.length) {
    try { logo = await pdfDoc.embedPng(logoBytes); } catch { logo = null; }
  }
  const colours = {
    ink: pdfLib.rgb(0.11, 0.12, 0.13),
    muted: pdfLib.rgb(0.39, 0.42, 0.44),
    line: pdfLib.rgb(0.86, 0.87, 0.87),
    warm: pdfLib.rgb(0.60, 0.29, 0.14),
    warmPale: pdfLib.rgb(0.98, 0.94, 0.91),
    green: pdfLib.rgb(0.15, 0.45, 0.30),
    white: pdfLib.rgb(1, 1, 1),
  };

  let page: PdfPage;
  let y = 0;

  const addPage = (title: string, reference: string) => {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
    if (logo) {
      const scale = Math.min(128 / logo.width, 42 / logo.height);
      page.drawImage(logo, { x: MARGIN, y: y - logo.height * scale, width: logo.width * scale, height: logo.height * scale });
    } else {
      page.drawText(DOCUMENT_PROFILE.businessName, { x: MARGIN, y: y - 18, size: 18, font: bold, color: colours.ink });
    }
    page.drawText(ascii(title), { x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize(ascii(title), 16), y: y - 14, size: 16, font: bold, color: colours.ink });
    page.drawText(ascii(reference), { x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(ascii(reference), 8), y: y - 30, size: 8, font: regular, color: colours.muted });
    y -= 62;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1.2, color: colours.warm });
    y -= 20;
    return page;
  };

  const ensureSpace = (height: number, title: string, reference: string) => {
    if (y - height < 58) addPage(title, reference);
  };

  const text = (value: string, options?: { size?: number; font?: PdfFont; color?: ReturnType<PdfLib["rgb"]>; width?: number; gap?: number }) => {
    const size = options?.size ?? 9;
    const selectedFont = options?.font ?? regular;
    const lineGap = options?.gap ?? size * 1.42;
    const lines = wrapText(value, selectedFont, size, options?.width ?? BODY_WIDTH);
    lines.forEach((line) => {
      page.drawText(line, { x: MARGIN, y, size, font: selectedFont, color: options?.color ?? colours.ink });
      y -= lineGap;
    });
    return lines.length * lineGap;
  };

  const sectionTitle = (label: string) => {
    y -= 5;
    page.drawText(ascii(label.toUpperCase()), { x: MARGIN, y, size: 8, font: bold, color: colours.warm });
    y -= 18;
  };

  const keyValues = (items: Array<[string, string]>) => {
    for (const [label, value] of items) {
      ensureSpace(30, "CONTINUED", "JB MOTORS");
      page.drawText(ascii(label.toUpperCase()), { x: MARGIN, y, size: 7, font: bold, color: colours.muted });
      const wrapped = wrapText(value, regular, 9, 330);
      wrapped.forEach((line, index) => page.drawText(line, { x: 205, y: y - index * 12, size: 9, font: regular, color: colours.ink }));
      y -= Math.max(24, wrapped.length * 12 + 6);
      page.drawLine({ start: { x: MARGIN, y: y + 7 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 7 }, thickness: 0.5, color: colours.line });
    }
  };

  const drawRows = (headers: string[], rows: string[][], widths: number[], title: string, reference: string) => {
    const drawHeaderRow = () => {
      page.drawRectangle({ x: MARGIN, y: y - 18, width: BODY_WIDTH, height: 22, color: colours.ink });
      let x = MARGIN + 6;
      headers.forEach((header, index) => {
        page.drawText(ascii(header.toUpperCase()), { x, y: y - 10, size: 6.5, font: bold, color: colours.white });
        x += widths[index];
      });
      y -= 28;
    };
    drawHeaderRow();
    rows.forEach((row) => {
      const wrapped = row.map((cell, index) => wrapText(cell, regular, 7.5, widths[index] - 10));
      const rowHeight = Math.max(28, Math.max(...wrapped.map((lines) => lines.length)) * 11 + 9);
      if (y - rowHeight < 58) {
        addPage(`${title} - continued`, reference);
        drawHeaderRow();
      }
      let x = MARGIN + 6;
      wrapped.forEach((lines, index) => {
        lines.forEach((line, lineIndex) => page.drawText(line, { x, y: y - lineIndex * 11, size: 7.5, font: index === wrapped.length - 1 ? bold : regular, color: colours.ink }));
        x += widths[index];
      });
      y -= rowHeight;
      page.drawLine({ start: { x: MARGIN, y: y + 6 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 6 }, thickness: 0.5, color: colours.line });
    });
  };

  const totalRows = (items: ReadonlyArray<readonly [string, string]>) => {
    y -= 8;
    items.forEach(([label, value], index) => {
      const last = index === items.length - 1;
      if (last) page.drawRectangle({ x: 318, y: y - 9, width: PAGE_WIDTH - MARGIN - 318, height: 24, color: colours.warmPale });
      page.drawText(ascii(label), { x: 326, y, size: last ? 9 : 8, font: last ? bold : regular, color: colours.ink });
      page.drawText(ascii(value), { x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize(ascii(value), last ? 10 : 8), y, size: last ? 10 : 8, font: bold, color: last ? colours.warm : colours.ink });
      y -= 24;
    });
  };

  const finish = async () => {
    const pages = pdfDoc.getPages();
    pages.forEach((pdfPage, index) => {
      pdfPage.drawLine({ start: { x: MARGIN, y: 42 }, end: { x: PAGE_WIDTH - MARGIN, y: 42 }, thickness: 0.5, color: colours.line });
      pdfPage.drawText("LOCAL DEMO DOCUMENT - NOT A PRODUCTION RECORD", { x: MARGIN, y: 27, size: 6.5, font: bold, color: colours.warm });
      const pageText = `Page ${index + 1} of ${pages.length}`;
      pdfPage.drawText(pageText, { x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(pageText, 7), y: 27, size: 7, font: regular, color: colours.muted });
    });
    return pdfDoc.save();
  };

  return { addPage, ensureSpace, text, sectionTitle, keyValues, drawRows, totalRows, finish, fonts: { regular, bold }, colours, get y() { return y; } };
}

async function getLogoBytes(): Promise<Uint8Array | undefined> {
  if (typeof window === "undefined") return undefined;
  const response = await fetch(DOCUMENT_PROFILE.logoPath);
  if (!response.ok) throw new Error("The JB Motors logo could not be loaded for the PDF.");
  return new Uint8Array(await response.arrayBuffer());
}

export async function generatePdfBytes(kind: PdfDocumentKind, logoBytes?: Uint8Array): Promise<Uint8Array> {
  const renderer = await createRenderer(logoBytes);
  if (kind === "estimate") {
    const doc = ESTIMATE_DOCUMENT;
    renderer.addPage(doc.type, doc.reference);
    renderer.keyValues([
      ["Prepared for", `${doc.customer.name} - ${doc.customer.phone} - ${doc.customer.email}`],
      ["Vehicle", `${doc.vehicle.label} - ${doc.vehicle.registration} - ${doc.vehicle.kilometres}`],
      ["Details", `Created ${doc.created} - Valid until ${doc.validUntil} - Prepared by ${doc.preparedBy}`],
      ["Status", doc.status],
    ]);
    renderer.sectionTitle("Estimate lines");
    renderer.drawRows(["Description", "Qty", "Unit price", "Total"], doc.lines.map((line) => [`${line.description} - ${line.detail}`, line.quantity, line.unitPrice, line.total]), [245, 70, 92, 96], doc.type, doc.reference);
    renderer.totalRows(doc.totals);
    renderer.ensureSpace(100, doc.type, doc.reference);
    renderer.sectionTitle("Notes and validity");
    renderer.text(doc.notes, { width: BODY_WIDTH });
    renderer.text(doc.terms, { width: BODY_WIDTH, color: renderer.colours.muted });
    renderer.text(DOCUMENT_PROFILE.contactNote, { width: BODY_WIDTH, color: renderer.colours.warm });
  } else if (kind === "invoice") {
    const doc = INVOICE_DOCUMENT;
    renderer.addPage(doc.type, doc.reference);
    renderer.keyValues([
      ["Bill to", `${doc.customer.name} - ${doc.customer.phone} - ${doc.customer.vatStatus}`],
      ["Vehicle", `${doc.vehicle.label} - ${doc.vehicle.registration} - ${doc.vehicle.kilometres}`],
      ["Invoice details", `${doc.issued} - Job ${doc.jobReference} - ${doc.paymentTerms}`],
      ["Status", doc.status],
    ]);
    renderer.sectionTitle("Invoice lines");
    renderer.drawRows(["Description", "Qty", "Unit price", "Total"], doc.lines.map((line) => [`${line.description} - ${line.detail}`, line.quantity, line.unitPrice, line.total]), [245, 70, 92, 96], doc.type, doc.reference);
    renderer.totalRows(doc.totals);
    renderer.ensureSpace(70, doc.type, doc.reference);
    renderer.sectionTitle("Payment received");
    renderer.text(doc.payment);
    renderer.text("JB Motors VAT registration is pending owner confirmation; this demo does not assert a verified supplier VAT number.", { color: renderer.colours.warm });
    renderer.text(DOCUMENT_PROFILE.contactNote, { color: renderer.colours.muted });
  } else if (kind === "service-history") {
    const doc = SERVICE_HISTORY_DOCUMENT;
    renderer.addPage(doc.type, doc.reference);
    renderer.keyValues([
      ["Customer", `${doc.customer.name} - ${doc.customer.phone}`],
      ["Vehicle", `${doc.vehicle.label} - ${doc.vehicle.registration}`],
      ["VIN", doc.vehicle.vin],
      ["Current kilometres", doc.currentKilometres],
    ]);
    renderer.sectionTitle("Completed services");
    renderer.drawRows(["Date", "Service", "Kilometres", "Job", "Total"], doc.entries.map((entry) => [entry.date, entry.service, entry.kilometres, entry.jobReference, entry.total]), [78, 155, 90, 90, 90], doc.type, doc.reference);
    renderer.ensureSpace(70, doc.type, doc.reference);
    renderer.sectionTitle("Record note");
    renderer.text("This local demo history contains the workshop records shown in the JB Motors prototype. It is not connected to a production database.");
    renderer.text(DOCUMENT_PROFILE.contactNote, { color: renderer.colours.muted });
  } else {
    const doc = MONTHLY_REPORT_DOCUMENT;
    renderer.addPage(doc.type, doc.reference);
    renderer.keyValues([["Reporting period", doc.period], ["Workshop", `${DOCUMENT_PROFILE.businessName} - ${DOCUMENT_PROFILE.location}`], ["Prepared for", `${DOCUMENT_PROFILE.ownerName} - Owner / Administrator`]]);
    doc.groups.forEach((group) => {
      renderer.ensureSpace(150, doc.type, doc.reference);
      renderer.sectionTitle(group.title);
      renderer.drawRows(["Measure", "Value"], group.stats.map(([value, label]) => [label, value]), [360, 143], doc.type, doc.reference);
      renderer.text(`Insight: ${group.insight}`, { color: renderer.colours.muted });
      renderer.text(" ", { size: 3, gap: 8 });
    });
    renderer.ensureSpace(70, doc.type, doc.reference);
    renderer.sectionTitle("Report basis");
    renderer.text("Figures are fictional August 2026 prototype data for interface demonstration and operational review only.", { color: renderer.colours.warm });
  }
  return renderer.finish();
}

export async function downloadPdf(kind: PdfDocumentKind): Promise<string> {
  const logoBytes = await getLogoBytes();
  const bytes = await generatePdfBytes(kind, logoBytes);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const url = URL.createObjectURL(new Blob([buffer], { type: "application/pdf" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = PDF_FILENAMES[kind];
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
  return PDF_FILENAMES[kind];
}
