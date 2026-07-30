import { useCallback, useEffect, useMemo, useState } from "react";
import type { QrRenderOptions } from "@/lib/qrRender";
import { buildQrSvg, svgToDataUrl } from "@/lib/qrRender";
import { scannability } from "@/lib/scannability";

export type QRType = "url" | "contact" | "wifi" | "pdf" | "social" | "menu";

export interface SocialLink {
  network: string;
  url: string;
}

export interface MenuItem {
  name: string;
  price: string;
}

export interface QRData {
  type: QRType;
  text: string;
  url: string;
  wifi: { ssid: string; password: string; encryption: "WPA" | "WEP" | "nopass"; hidden: boolean };
  contact: {
    name: string;
    title: string;
    company: string;
    phone: string;
    email: string;
    address: string;
    avatarDataUrl: string;
  };
  pdf: { title: string; url: string };
  social: { handle: string; tagline: string; avatarDataUrl: string; links: SocialLink[] };
  menu: { restaurant: string; url: string; note: string; items: MenuItem[] };
}

export interface QROptions extends QrRenderOptions {
  size: number;
  highRes: boolean;
}

export interface QRTemplate {
  id: string;
  label: string;
  swatch: string[];
  patch: Partial<QROptions>;
}

const initialData: QRData = {
  type: "url",
  text: "",
  url: "",
  wifi: { ssid: "", password: "", encryption: "WPA", hidden: false },
  contact: { name: "", title: "", company: "", phone: "", email: "", address: "", avatarDataUrl: "" },
  pdf: { title: "", url: "" },
  social: { handle: "", tagline: "", avatarDataUrl: "", links: [] },
  menu: { restaurant: "", url: "", note: "", items: [] },
};

const initialOptions: QROptions = {
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
  size: 512,
  highRes: false,
};

export const templates: QRTemplate[] = [
  {
    id: "minimal",
    label: "Minimal",
    swatch: ["#ffffff", "#1e1b4b"],
    patch: { fgColor: "#1e1b4b", bgColor: "#ffffff", eyeColor: "#1e1b4b", gradientTo: null, dotStyle: "square", cornerStyle: "square", frame: "none" },
  },
  {
    id: "gradient",
    label: "Gradient",
    swatch: ["#6366f1", "#ec4899"],
    patch: { fgColor: "#6366f1", gradientTo: "#ec4899", bgColor: "#ffffff", eyeColor: "#6366f1", dotStyle: "dots", cornerStyle: "circle", frame: "card" },
  },
  {
    id: "dark",
    label: "Dark Mode",
    swatch: ["#0b1020", "#a5b4fc"],
    patch: { fgColor: "#e2e8f0", bgColor: "#0b1020", eyeColor: "#a5b4fc", gradientTo: null, dotStyle: "rounded", cornerStyle: "rounded", frame: "card" },
  },
  {
    id: "contrast",
    label: "High Contrast",
    swatch: ["#ffffff", "#000000"],
    patch: { fgColor: "#000000", bgColor: "#ffffff", eyeColor: "#000000", gradientTo: null, dotStyle: "square", cornerStyle: "square", frame: "label" },
  },
];

function esc(v: string) {
  return v.replace(/([,;\\])/g, "\\$1");
}

export function buildQRString(data: QRData): string {
  switch (data.type) {
    case "url":
      return data.url.trim();
    case "pdf":
      return data.pdf.url.trim();
    case "menu":
      return data.menu.url.trim();
    case "social": {
      const first = data.social.links.find((l) => l.url.trim());
      return first ? first.url.trim() : "";
    }
    case "wifi":
      return data.wifi.ssid
        ? `WIFI:T:${data.wifi.encryption};S:${esc(data.wifi.ssid)};P:${esc(data.wifi.password)};${data.wifi.hidden ? "H:true;" : ""};`
        : "";
    case "contact": {
      const c = data.contact;
      if (!c.name && !c.phone && !c.email) return "";
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${c.name}`,
        c.title ? `TITLE:${c.title}` : "",
        c.company ? `ORG:${c.company}` : "",
        c.phone ? `TEL;TYPE=CELL:${c.phone}` : "",
        c.email ? `EMAIL:${c.email}` : "",
        c.address ? `ADR;TYPE=WORK:;;${esc(c.address)};;;;` : "",
        "END:VCARD",
      ]
        .filter(Boolean)
        .join("\n");
    }
    default:
      return "";
  }
}

export function useQRGenerator() {
  const [data, setData] = useState<QRData>(initialData);
  const [options, setOptions] = useState<QROptions>(initialOptions);
  const [templateId, setTemplateId] = useState<string>("minimal");
  const [error, setError] = useState<string>("");

  const updateData = useCallback(<K extends keyof QRData>(key: K, value: QRData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateOptions = useCallback(<K extends keyof QROptions>(key: K, value: QROptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyTemplate = useCallback((id: string) => {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setTemplateId(id);
    setOptions((prev) => ({ ...prev, ...tpl.patch }));
  }, []);

  const value = buildQRString(data);
  const hasContent = value.trim().length > 0;

  const svg = useMemo(() => {
    if (!hasContent) return "";
    try {
      return buildQrSvg(value, options);
    } catch {
      return "";
    }
  }, [value, options, hasContent]);

  useEffect(() => {
    if (hasContent && !svg) setError("This content is too long to encode in a QR code.");
    else setError("");
  }, [hasContent, svg]);

  const previewUrl = svg ? svgToDataUrl(svg) : "";
  const exportSize = options.highRes ? Math.max(options.size, 2480) : options.size;

  const shield = useMemo(
    () =>
      scannability({
        fgColor: options.fgColor,
        bgColor: options.bgColor,
        eyeColor: options.eyeColor,
        logoDataUrl: options.logoDataUrl,
        logoWhiteBg: options.logoWhiteBg,
        contentLength: value.length,
      }),
    [options.fgColor, options.bgColor, options.eyeColor, options.logoDataUrl, options.logoWhiteBg, value.length],
  );

  return {
    data,
    options,
    templateId,
    svg,
    previewUrl,
    exportSize,
    hasContent,
    error,
    shield,
    updateData,
    updateOptions,
    applyTemplate,
  };
}
