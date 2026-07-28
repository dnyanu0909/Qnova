import QRCode from "qrcode";

export interface QRExportOptions {
  size: number;
  fgColor: string;
  bgColor: string;
  logoDataUrl?: string | null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function qrToPngDataUrl(text: string, opts: QRExportOptions): Promise<string> {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, text, {
    width: opts.size,
    margin: 2,
    color: { dark: opts.fgColor, light: opts.bgColor },
    errorCorrectionLevel: "H",
  });

  if (opts.logoDataUrl) {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const img = await loadImage(opts.logoDataUrl);
      const logoSize = canvas.width * 0.2;
      const x = (canvas.width - logoSize) / 2;
      const y = (canvas.height - logoSize) / 2;
      ctx.fillStyle = opts.bgColor;
      ctx.fillRect(x - 6, y - 6, logoSize + 12, logoSize + 12);
      ctx.drawImage(img, x, y, logoSize, logoSize);
    }
  }

  return canvas.toDataURL("image/png");
}

export async function qrToSvgString(text: string, opts: QRExportOptions): Promise<string> {
  const svg = await QRCode.toString(text, {
    type: "svg",
    width: opts.size,
    margin: 2,
    color: { dark: opts.fgColor, light: opts.bgColor },
    errorCorrectionLevel: "H",
  });

  if (!opts.logoDataUrl) return svg;

  const viewBox = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const unit = viewBox ? Number(viewBox[1]) : opts.size;
  const logo = unit * 0.2;
  const pos = (unit - logo) / 2;
  const pad = unit * 0.015;

  const overlay =
    `<rect x="${pos - pad}" y="${pos - pad}" width="${logo + pad * 2}" height="${logo + pad * 2}" fill="${opts.bgColor}"/>` +
    `<image x="${pos}" y="${pos}" width="${logo}" height="${logo}" href="${opts.logoDataUrl}" preserveAspectRatio="xMidYMid slice"/>`;

  return svg.replace(/<\/svg>\s*$/, `${overlay}</svg>`);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export function downloadSvg(svg: string, filename: string) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}