export interface ScannabilityResult {
  score: number;
  ratio: number;
  level: "poor" | "fair" | "good" | "excellent";
  message: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full.slice(0, 6) || "000000", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export function scannability(opts: {
  fgColor: string;
  bgColor: string;
  eyeColor: string;
  logoDataUrl: string | null;
  logoWhiteBg: boolean;
  contentLength: number;
}): ScannabilityResult {
  const ratio = Math.min(
    contrastRatio(opts.fgColor, opts.bgColor),
    contrastRatio(opts.eyeColor, opts.bgColor),
  );

  // Camera sensors need far more contrast than text: 7:1 is the comfort floor.
  let score = Math.round(Math.min(100, (ratio / 12) * 100));
  if (luminance(opts.fgColor) > luminance(opts.bgColor)) score -= 8; // inverted codes scan worse
  if (opts.logoDataUrl && !opts.logoWhiteBg) score -= 12;
  if (opts.contentLength > 300) score -= 10;
  if (opts.contentLength > 800) score -= 15;
  score = Math.max(0, Math.min(100, score));

  let level: ScannabilityResult["level"] = "excellent";
  let message = "Excellent — scans instantly on any camera.";
  if (score < 40) {
    level = "poor";
    message = "Too low. Cameras will struggle — increase the contrast between foreground and background.";
  } else if (score < 65) {
    level = "fair";
    message = "Risky in low light. Darken the foreground or lighten the background.";
  } else if (score < 85) {
    level = "good";
    message = "Good — reliable on most phones.";
  }

  return { score, ratio, level, message };
}
