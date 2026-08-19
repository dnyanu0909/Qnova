import { useMemo } from "react";
import type { QRData, QROptions } from "@/hooks/useQRGenerator";
import { buildQRString } from "@/hooks/useQRGenerator";
import { buildQrSvg, svgToDataUrl } from "@/lib/qrRender";

const baseData: QRData = {
  type: "url",
  text: "",
  url: "",
  wifi: { ssid: "", password: "", encryption: "WPA", hidden: false },
  contact: { name: "", title: "", company: "", phone: "", email: "", address: "", avatarDataUrl: "" },
  pdf: { title: "", url: "" },
  social: { handle: "", tagline: "", avatarDataUrl: "", links: [] },
  menu: { restaurant: "", url: "", note: "", items: [] },
};

const baseOptions: QROptions = {
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

export interface GalleryTemplate {
  id: string;
  label: string;
  blurb: string;
  data: QRData;
  options: QROptions;
}

export const galleryTemplates: GalleryTemplate[] = [
  {
    id: "menu",
    label: "Restaurant Menu",
    blurb: "Warm table-tent styling with a “View Menu” frame.",
    data: {
      ...baseData,
      type: "menu",
      menu: {
        restaurant: "Olive & Ember",
        url: "https://example.com/menu",
        note: "Seasonal kitchen · open 12–23h",
        items: [
          { name: "Charred aubergine", price: "€9" },
          { name: "Truffle tagliatelle", price: "€16" },
        ],
      },
    },
    options: { ...baseOptions, fgColor: "#7c2d12", eyeColor: "#c2410c", dotStyle: "rounded", cornerStyle: "rounded", frame: "label", frameLabel: "View Menu" },
  },
  {
    id: "card",
    label: "Modern Minimalist Business Card",
    blurb: "Sharp monochrome vCard, print-perfect at 3.5 × 2 in.",
    data: {
      ...baseData,
      type: "contact",
      contact: {
        name: "Ava Lindqvist",
        title: "Product Designer",
        company: "Northlight Studio",
        phone: "+46 70 123 45 67",
        email: "ava@northlight.studio",
        address: "Stockholm, Sweden",
        avatarDataUrl: "",
      },
    },
    options: { ...baseOptions, fgColor: "#0d0d0d", eyeColor: "#0d0d0d", dotStyle: "square", cornerStyle: "square", frame: "none" },
  },
  {
    id: "wifi",
    label: "Wi-Fi Table Stand",
    blurb: "Auto-connect code with a bold “Connect” caption.",
    data: { ...baseData, type: "wifi", wifi: { ssid: "Cafe Guest", password: "welcome2026", encryption: "WPA", hidden: false } },
    options: { ...baseOptions, fgColor: "#0c4a6e", eyeColor: "#0ea5e9", gradientTo: "#0ea5e9", dotStyle: "dots", cornerStyle: "circle", frame: "card", frameLabel: "Connect to Wi-Fi" },
  },
  {
    id: "event",
    label: "Event Pass",
    blurb: "High-contrast gradient pass with a scan prompt.",
    data: { ...baseData, type: "url", url: "https://example.com/pass/qnova-summit" },
    options: { ...baseOptions, fgColor: "#4c1d95", gradientTo: "#db2777", eyeColor: "#db2777", dotStyle: "rounded", cornerStyle: "rounded", frame: "card", frameLabel: "Scan for entry" },
  },
];

function Thumb({ tpl }: { tpl: GalleryTemplate }) {
  const src = useMemo(() => {
    try {
      const svg = buildQrSvg(buildQRString(tpl.data), tpl.options);
      return svg ? svgToDataUrl(svg) : "";
    } catch {
      return "";
    }
  }, [tpl]);
  return src ? <img src={src} alt={`${tpl.label} QR template`} className="h-full w-full object-contain" /> : null;
}

export default function TemplateGallery({ onApply }: { onApply: (tpl: GalleryTemplate) => void }) {
  return (
    <section id="templates" className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Instant template gallery</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pick a design and the editor fills in the content and styling for you.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {galleryTemplates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => onApply(tpl)}
            className="group rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm"
          >
            <div className="flex aspect-square items-center justify-center rounded-lg border border-border bg-muted/30 p-3">
              <Thumb tpl={tpl} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground group-hover:text-primary">{tpl.label}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tpl.blurb}</p>
            <span className="mt-2 inline-block text-xs font-medium text-primary">Use this template →</span>
          </button>
        ))}
      </div>
    </section>
  );
}