import type { QROptions } from "@/hooks/useQRGenerator";

export interface BrandKit {
  name: string;
  primary: string;
  secondary: string;
  useGradient: boolean;
  logoDataUrl: string | null;
  frame: QROptions["frame"];
  frameLabel: string;
}

const KEY = "qnova-brandkit-v1";

export const defaultBrandKit: BrandKit = {
  name: "My Brand",
  primary: "#1e1b4b",
  secondary: "#6366f1",
  useGradient: false,
  logoDataUrl: null,
  frame: "card",
  frameLabel: "Scan Me",
};

export function readBrandKit(): BrandKit | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return { ...defaultBrandKit, ...(JSON.parse(raw) as BrandKit) };
  } catch {
    return null;
  }
}

export function saveBrandKit(kit: BrandKit): BrandKit {
  try {
    localStorage.setItem(KEY, JSON.stringify(kit));
  } catch {
    /* storage unavailable */
  }
  return kit;
}

export function clearBrandKit() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}

export function brandKitPatch(kit: BrandKit): Partial<QROptions> {
  return {
    fgColor: kit.primary,
    eyeColor: kit.secondary,
    gradientTo: kit.useGradient ? kit.secondary : null,
    logoDataUrl: kit.logoDataUrl,
    logoWhiteBg: true,
    frame: kit.frame,
    frameLabel: kit.frameLabel,
  };
}
