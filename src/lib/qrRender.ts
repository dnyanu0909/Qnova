import QRCode from "qrcode";

export type DotStyle = "square" | "rounded" | "dots";
export type CornerStyle = "square" | "rounded" | "circle";
export type FrameStyle = "none" | "card" | "label";

export interface QrRenderOptions {
  fgColor: string;
  bgColor: string;
  eyeColor: string;
  dotStyle: DotStyle;
  cornerStyle: CornerStyle;
  frame: FrameStyle;
  frameLabel: string;
  logoDataUrl: string | null;
  logoWhiteBg: boolean;
  gradientTo: string | null;
}

const MARGIN = 4;

function isEye(row: number, col: number, size: number) {
  return (
    (row < 7 && col < 7) ||
    (row < 7 && col >= size - 7) ||
    (row >= size - 7 && col < 7)
  );
}

function eyeShape(x: number, y: number, o: QrRenderOptions) {
  const rx = o.cornerStyle === "circle" ? 3.5 : o.cornerStyle === "rounded" ? 2 : 0;
  const irx = o.cornerStyle === "circle" ? 1.5 : o.cornerStyle === "rounded" ? 0.9 : 0;
  return (
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="6" height="6" rx="${rx}" ry="${rx}" fill="none" stroke="${o.eyeColor}" stroke-width="1"/>` +
    `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="${irx}" ry="${irx}" fill="${o.eyeColor}"/>`
  );
}

export function buildQrSvg(text: string, o: QrRenderOptions): string {
  const qr = QRCode.create(text, { errorCorrectionLevel: "H" });
  const size = qr.modules.size;
  const data = qr.modules.data as unknown as ArrayLike<number>;
  const dim = size + MARGIN * 2;
  const hasLabel = o.frame === "label" && !!o.frameLabel.trim();
  const height = dim + (hasLabel ? 8 : 0);

  let dots = "";
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!data[row * size + col]) continue;
      if (isEye(row, col, size)) continue;
      const x = col + MARGIN;
      const y = row + MARGIN;
      if (o.dotStyle === "dots") {
        dots += `<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.5"/>`;
      } else if (o.dotStyle === "rounded") {
        dots += `<rect x="${x}" y="${y}" width="1" height="1" rx="0.35" ry="0.35"/>`;
      } else {
        dots += `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`;
      }
    }
  }

  const eyes =
    eyeShape(MARGIN, MARGIN, o) +
    eyeShape(MARGIN + size - 7, MARGIN, o) +
    eyeShape(MARGIN, MARGIN + size - 7, o);

  const bgRadius = o.frame === "none" ? 0 : 3;
  const bg = `<rect width="${dim}" height="${height}" rx="${bgRadius}" ry="${bgRadius}" fill="${o.bgColor}"/>`;

  let logo = "";
  if (o.logoDataUrl) {
    const l = dim * 0.22;
    const pos = (dim - l) / 2;
    const pad = dim * 0.015;
    if (o.logoWhiteBg) {
      logo += `<rect x="${pos - pad}" y="${pos - pad}" width="${l + pad * 2}" height="${l + pad * 2}" rx="${l * 0.18}" fill="#ffffff"/>`;
    }
    logo += `<image x="${pos}" y="${pos}" width="${l}" height="${l}" href="${o.logoDataUrl}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  const label = hasLabel
    ? `<text x="${dim / 2}" y="${dim + 5.6}" font-family="Inter, system-ui, sans-serif" font-size="4.2" font-weight="700" letter-spacing="0.35" text-anchor="middle" fill="${o.eyeColor}">${escapeXml(
        o.frameLabel.toUpperCase(),
      )}</text>`
    : "";

  const border =
    o.frame !== "none"
      ? `<rect x="0.6" y="0.6" width="${dim - 1.2}" height="${height - 1.2}" rx="${bgRadius}" ry="${bgRadius}" fill="none" stroke="${o.eyeColor}" stroke-width="1.2"/>`
      : "";

  const gradId = "qnova-grad";
  const defs = o.gradientTo
    ? `<defs><linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${o.fgColor}"/><stop offset="100%" stop-color="${o.gradientTo}"/></linearGradient></defs>`
    : "";
  const dotFill = o.gradientTo ? `url(#${gradId})` : o.fgColor;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${height}" shape-rendering="geometricPrecision">${defs}${bg}<g fill="${dotFill}">${dots}</g>${eyes}${logo}${label}${border}</svg>`;
}

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export async function svgToPngBlob(svg: string, pixelSize: number): Promise<Blob> {
  const viewBox = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const w = viewBox ? Number(viewBox[1]) : 100;
  const h = viewBox ? Number(viewBox[2]) : 100;
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not rasterize QR code."));
    img.src = svgToDataUrl(svg);
  });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(pixelSize);
  canvas.height = Math.round((pixelSize * h) / w);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed."))), "image/png"),
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
