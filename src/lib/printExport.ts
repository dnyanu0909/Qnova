import QRCode from "qrcode";
import { jsPDF } from "jspdf";

const QUIET_ZONE = 4; // ISO/IEC 18004: quiet zone of at least 4 modules on all sides

export interface QrMatrix {
  /** Number of modules per side, excluding the quiet zone. */
  size: number;
  /** Row-major module bits (1 = dark). */
  data: ArrayLike<number>;
}

export function getQrMatrix(text: string): QrMatrix {
  const qr = QRCode.create(text, { errorCorrectionLevel: "H" });
  return { size: qr.modules.size, data: qr.modules.data as unknown as ArrayLike<number> };
}

export function qrModuleCount(text: string): number {
  try {
    return getQrMatrix(text).size;
  } catch {
    return 0;
  }
}

export interface PrintGuidance {
  modules: number;
  /** Minimum recommended symbol size in centimetres (one side). */
  minSizeCm: number;
  /** Comfortable scanning distance in centimetres at that size. */
  scanDistanceCm: number;
  ok: boolean;
}

/**
 * Print-size guidance based on module count.
 * Rule of thumb: 0.5 mm minimum module width for print, and a 10:1
 * scan-distance-to-symbol-width ratio.
 */
export function printGuidance(moduleCount: number): PrintGuidance {
  if (!moduleCount) return { modules: 0, minSizeCm: 0, scanDistanceCm: 0, ok: false };
  const withQuietZone = moduleCount + QUIET_ZONE * 2;
  const minMm = withQuietZone * 0.5;
  const minSizeCm = Math.round(minMm) / 10;
  return {
    modules: moduleCount,
    minSizeCm,
    scanDistanceCm: Math.round(minMm), // 10:1 → mm size ≈ cm distance
    ok: true,
  };
}

function hexToUnitRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full.slice(0, 6) || "000000", 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Clean vector EPS with square modules and the ISO 4-module quiet zone.
 * Gradients and logos are flattened to the solid foreground colour —
 * the correct, safest output for print production.
 */
export function buildEps(text: string, fgColor: string, bgColor: string): string {
  const { size, data } = getQrMatrix(text);
  const dim = size + QUIET_ZONE * 2;
  const PT = 8; // 1 module = 8 pt
  const W = dim * PT;
  const [fr, fg, fb] = hexToUnitRgb(fgColor).map((v) => v.toFixed(3));
  const [br, bg, bb] = hexToUnitRgb(bgColor).map((v) => v.toFixed(3));

  const lines: string[] = [
    "%!PS-Adobe-3.0 EPSF-3.0",
    `%%BoundingBox: 0 0 ${W} ${W}`,
    "%%Creator: QNova Print Preflight Exporter",
    "%%Title: QNova QR Code (vector, 4-module quiet zone)",
    "%%EndComments",
    `${br} ${bg} ${bb} setrgbcolor`,
    `0 0 ${W} ${W} rectfill`,
    `${fr} ${fg} ${fb} setrgbcolor`,
  ];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!data[row * size + col]) continue;
      const x = (col + QUIET_ZONE) * PT;
      const y = W - (row + QUIET_ZONE + 1) * PT;
      lines.push(`${x} ${y} ${PT} ${PT} rectfill`);
    }
  }
  lines.push("showpage", "%%EOF");
  return lines.join("\n");
}

/**
 * Vector print PDF: square modules drawn as PDF rectangles (fully
 * resolution-independent), 4-module quiet zone, crop-safe page.
 */
export function buildPrintPdf(text: string, fgColor: string, bgColor: string, title: string): jsPDF {
  const { size, data } = getQrMatrix(text);
  const dim = size + QUIET_ZONE * 2;
  const symbolMm = 50; // physical symbol size on the page
  const pageMm = 80;
  const doc = new jsPDF({ unit: "mm", format: [pageMm, pageMm] });
  const m = symbolMm / dim;
  const ox = (pageMm - symbolMm) / 2;
  const oy = (pageMm - symbolMm) / 2 - 6;

  const [br, bg, bb] = hexToUnitRgb(bgColor).map((v) => Math.round(v * 255));
  const [fr, fg, fb] = hexToUnitRgb(fgColor).map((v) => Math.round(v * 255));

  doc.setFillColor(br, bg, bb);
  doc.rect(ox - 2, oy - 2, symbolMm + 4, symbolMm + 4, "F");
  doc.setFillColor(fr, fg, fb);
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!data[row * size + col]) continue;
      doc.rect(ox + (col + QUIET_ZONE) * m, oy + (row + QUIET_ZONE) * m, m + 0.02, m + 0.02, "F");
    }
  }

  doc.setFontSize(8);
  doc.setTextColor(120);
  const caption = title.trim() || "QNova QR code";
  doc.text(caption, pageMm / 2, oy + symbolMm + 8, { align: "center" });
  doc.text(
    `Vector output · ISO 18004 quiet zone: 4 modules · ${size}×${size} matrix`,
    pageMm / 2,
    oy + symbolMm + 12.5,
    { align: "center" },
  );
  return doc;
}
