export interface ScannabilityResult {
  score: number;
  ratio: number;
  level: "poor" | "fair" | "good" | "excellent";
  message: string;
  /** ISO 15415 symbol contrast: (R_light − R_dark) as a percentage of full reflectance. */
  isoContrast: number;
  /** ISO 15415 symbol-contrast grade, A (best) to F (fail). */
  isoGrade: "A" | "B" | "C" | "D" | "F";
  /** True when symbol contrast reaches the ISO grade-C (40%) pass threshold. */
  isoPass: boolean;
  /** Human-readable ISO validation problems, empty when the design passes. */
  isoIssues: string[];
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

/** ISO/IEC 15415 symbol contrast (SC) = (R_max − R_min) × 100, using relative luminance as reflectance. */
export function symbolContrast(dark: string, light: string) {
  const a = luminance(dark);
  const b = luminance(light);
  return Math.round(Math.abs(b - a) * 100);
}

export function isoGradeFor(sc: number): ScannabilityResult["isoGrade"] {
  if (sc >= 70) return "A";
  if (sc >= 55) return "B";
  if (sc >= 40) return "C";
  if (sc >= 20) return "D";
  return "F";
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

  const isoContrast = Math.min(
    symbolContrast(opts.fgColor, opts.bgColor),
    symbolContrast(opts.eyeColor, opts.bgColor),
  );
  const isoGrade = isoGradeFor(isoContrast);
  const isoPass = isoContrast >= 40;

  const isoIssues: string[] = [];
  if (!isoPass) {
    isoIssues.push(
      `Symbol contrast is ${isoContrast}% (grade ${isoGrade}). ISO 15415 requires at least 40% — pick a darker module colour or a lighter background.`,
    );
  }
  if (symbolContrast(opts.eyeColor, opts.bgColor) < 40) {
    isoIssues.push("The corner eyes need the same 40% contrast as the modules — scanners locate the symbol with them first.");
  }
  if (luminance(opts.fgColor) > luminance(opts.bgColor)) {
    isoIssues.push("Inverted code: ISO 18004 expects dark modules on a light background. Some scanners refuse to read light-on-dark.");
  }
  if (opts.logoDataUrl && !opts.logoWhiteBg) {
    isoIssues.push("A logo without a solid backing overlaps data modules — enable the white backing to stay inside the error-correction budget.");
  }

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

  return { score, ratio, level, message, isoContrast, isoGrade, isoPass, isoIssues };
}
