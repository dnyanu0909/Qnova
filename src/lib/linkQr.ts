import { buildQrSvg, type QrRenderOptions } from "@/lib/qrRender";

export const defaultLinkQrOptions: QrRenderOptions = {
  fgColor: "#1e1b4b",
  bgColor: "#ffffff",
  eyeColor: "#1e1b4b",
  gradientTo: null,
  dotStyle: "rounded",
  cornerStyle: "rounded",
  frame: "none",
  frameLabel: "Scan Me",
  logoDataUrl: null,
  logoWhiteBg: true,
};

export function linkQrSvg(url: string, overrides?: Partial<QrRenderOptions>) {
  return buildQrSvg(url, { ...defaultLinkQrOptions, ...(overrides ?? {}) });
}