import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  QrCode,
  Copy,
  Check,
  FileCode,
  FileText,
  Ruler,
  Share2,
  Grid3x3,
  Image as ImageIcon,
  Contrast,
  Maximize2,
  X,
} from "lucide-react";
import { downloadBlob, svgToPngBlob } from "@/lib/qrRender";
import { buildEps, buildPrintPdf, printGuidance, qrModuleCount } from "@/lib/printExport";
import { toast } from "sonner";
import ScannabilityMeter from "@/components/ScannabilityMeter";
import type { ScannabilityResult } from "@/lib/scannability";

interface PreviewPanelProps {
  previewUrl: string;
  svg: string;
  /** Raw encoded content — used for vector exports and print-size math. */
  content: string;
  label: string;
  fgColor: string;
  bgColor: string;
  exportSize: number;
  highRes: boolean;
  error: string;
  shield: ScannabilityResult;
}

const DPI_PRESETS = [
  { id: "1x", label: "1x", detail: "WEB · 72 DPI", px: 512 },
  { id: "2x", label: "2x", detail: "SCREEN · 150 DPI", px: 1024 },
  { id: "4x", label: "4x", detail: "PRINT · 300 DPI", px: 2400 },
] as const;

export default function PreviewPanel({
  previewUrl,
  svg,
  content,
  label,
  fgColor,
  bgColor,
  exportSize,
  highRes,
  error,
  shield,
}: PreviewPanelProps) {
  const [copied, setCopied] = useState(false);
  const [dpiId, setDpiId] = useState<(typeof DPI_PRESETS)[number]["id"]>("1x");
  const [view, setView] = useState<"matrix" | "mockup">("matrix");
  const [inverted, setInverted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const ready = Boolean(svg);

  const dpi = DPI_PRESETS.find((p) => p.id === dpiId) ?? DPI_PRESETS[0];
  const pngSize = highRes ? Math.max(dpi.px, 2480) : dpi.px;

  const guidance = useMemo(() => {
    if (!ready) return null;
    const g = printGuidance(qrModuleCount(content));
    return g.ok ? g : null;
  }, [ready, content]);

  const modules = useMemo(() => (ready ? qrModuleCount(content) : 0), [ready, content]);
  const dimMm = guidance ? Math.round(guidance.minSizeCm * 10) : null;

  const downloadPng = async () => {
    try {
      const blob = await svgToPngBlob(svg, pngSize);
      downloadBlob(blob, `qnova-qr-${pngSize}px.png`);
      toast.success(`PNG exported at ${pngSize}px (${dpi.detail}).`);
    } catch {
      toast.error("Could not export the PNG.");
    }
  };

  const downloadSvgFile = () => {
    downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), "qnova-qr.svg");
  };

  const downloadEps = () => {
    try {
      const eps = buildEps(content, fgColor, bgColor);
      downloadBlob(new Blob([eps], { type: "application/postscript" }), "qnova-qr.eps");
      toast.success("Vector EPS exported — square modules, 4-module quiet zone.");
    } catch {
      toast.error("Could not build the EPS file.");
    }
  };

  const downloadPdf = () => {
    try {
      buildPrintPdf(content, fgColor, bgColor, label).save("qnova-qr-print.pdf");
      toast.success("Print PDF exported — vector modules with ISO quiet zone.");
    } catch {
      toast.error("Could not build the print PDF.");
    }
  };

  const copyImage = useCallback(async () => {
    if (!svg) return;
    try {
      const blob = await svgToPngBlob(svg, Math.min(exportSize, 1024));
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      toast.success("QR code copied to clipboard", {
        description: "Clean PNG blob ready to paste anywhere.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Your browser blocked clipboard access.");
    }
  }, [svg, exportSize]);

  const shareAsset = async () => {
    if (!svg) return;
    try {
      const blob = await svgToPngBlob(svg, Math.min(exportSize, 1024));
      const file = new File([blob], "qnova-qr.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ title: label || "QNova QR code", files: [file] });
        return;
      }
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.success("Temporary view link opened in a new tab.");
    } catch {
      toast.error("Sharing was cancelled or unavailable.");
    }
  };

  const downloadPngRef = useRef<(() => Promise<void>) | null>(null);
  downloadPngRef.current = downloadPng;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || !ready) return;
      const key = e.key.toLowerCase();
      if (key === "c" && e.shiftKey) {
        e.preventDefault();
        void copyImage();
      } else if (key === "s" && !e.shiftKey) {
        e.preventDefault();
        exportRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        void downloadPngRef.current?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copyImage, ready]);

  return (
    <div className="glass-card p-5 sm:p-6 lg:p-7 lg:sticky lg:top-24 lg:self-start">
      <div className="flex flex-col items-center gap-5">
        <div className="w-full flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Studio canvas</h2>
            <p className="label-tech mt-1">{ready ? "LIVE · AUTO-RENDER" : "AWAITING INPUT"}</p>
          </div>
          <span className="metric text-[10px] text-muted-foreground">
            {modules ? `${modules}×${modules} MOD` : "—"}
          </span>
        </div>

        {error && (
          <div className="w-full px-3 py-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs metric text-center">
            {error}
          </div>
        )}

        <div className="inline-flex rounded-full border border-border bg-secondary/50 p-0.5">
          {([
            { id: "matrix", label: "Matrix View", icon: <Grid3x3 className="w-3.5 h-3.5" /> },
            { id: "mockup", label: "Live Mockup", icon: <ImageIcon className="w-3.5 h-3.5" /> },
          ] as const).map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-all active:scale-[0.98] ${
                view === v.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v.icon}
              {v.label}
            </button>
          ))}
        </div>

        {/* Blueprint studio canvas with CAD tick marks + dimension labels */}
        <div className="relative w-full max-w-[340px] px-6 py-6">
          <TickMark className="left-0 top-0" />
          <TickMark className="right-0 top-0" />
          <TickMark className="left-0 bottom-0" />
          <TickMark className="right-0 bottom-0" />

          <span className="absolute left-1/2 -translate-x-1/2 top-0.5 metric text-[9px] text-muted-foreground">
            {dimMm ? `${dimMm}mm` : "—"}
          </span>
          <span className="absolute top-1/2 -translate-y-1/2 -right-1 rotate-90 metric text-[9px] text-muted-foreground">
            {dimMm ? `${dimMm}mm` : "—"}
          </span>
          <span className="absolute left-1/2 -translate-x-1/2 bottom-0.5 metric text-[9px] text-muted-foreground">
            {ready ? `Q-ZONE 4 MOD` : "QUIET ZONE"}
          </span>

          <div className="blueprint-grid aspect-square rounded-lg border border-border flex items-center justify-center overflow-hidden p-5">
            {!ready ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                <QrCode className="w-14 h-14" strokeWidth={1} />
                <span className="label-tech">NO SIGNAL</span>
              </div>
            ) : view === "matrix" ? (
              <img
                src={previewUrl}
                alt="Live QR code preview"
                className="w-full h-full object-contain animate-in fade-in duration-200"
                style={inverted ? { filter: "invert(1)" } : undefined}
              />
            ) : (
              <MockupStand previewUrl={previewUrl} label={label} inverted={inverted} />
            )}
          </div>
        </div>

        {/* Floating translucent action pill bar */}
        <div className="flex items-center gap-1 rounded-full border border-border bg-card/70 backdrop-blur px-1.5 py-1 -mt-2">
          <PillAction onClick={copyImage} disabled={!ready} icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}>
            {copied ? "Copied" : "Copy PNG"} <span className="metric text-[9px] opacity-60">⌘C</span>
          </PillAction>
          <span className="h-4 w-px bg-border" />
          <PillAction onClick={() => setInverted((v) => !v)} disabled={!ready} active={inverted} icon={<Contrast className="w-3.5 h-3.5" />}>
            Invert Mockup
          </PillAction>
          <span className="h-4 w-px bg-border" />
          <PillAction onClick={() => setFullscreen(true)} disabled={!ready} icon={<Maximize2 className="w-3.5 h-3.5" />}>
            Full Screen
          </PillAction>
        </div>

        <div className="w-full max-w-[340px]">
          <ScannabilityMeter result={shield} />
        </div>

        {guidance && (
          <div className="w-full max-w-[340px] flex items-start gap-2.5 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
            <Ruler className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Min. print size{" "}
              <span className="metric font-semibold text-foreground">
                {guidance.minSizeCm.toFixed(1)}×{guidance.minSizeCm.toFixed(1)} cm
              </span>{" "}
              for reliable scanning at{" "}
              <span className="metric text-foreground">~{guidance.scanDistanceCm} cm</span>. Matrix{" "}
              <span className="metric text-foreground">
                {guidance.modules}×{guidance.modules}
              </span>
              , 4-module quiet zone included.
            </p>
          </div>
        )}

        <div ref={exportRef} className="w-full max-w-[340px] space-y-2.5">
          <div className="grid grid-cols-3 gap-1.5">
            {DPI_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setDpiId(p.id)}
                className={`rounded-md border px-2 py-2 text-center transition-all active:scale-[0.98] ${
                  dpiId === p.id
                    ? "border-primary bg-primary/10 text-foreground accent-glow"
                    : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="block metric text-xs font-semibold">{p.label}</span>
                <span className="block metric text-[8px] leading-tight tracking-wide">{p.detail}</span>
              </button>
            ))}
          </div>

          <button
            onClick={downloadPng}
            disabled={!ready}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm uppercase tracking-wide hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            <Download className="w-4 h-4" /> Download PNG <span className="metric text-xs">· {pngSize}px</span>
          </button>

          <div className="grid grid-cols-3 gap-1.5">
            <ActionButton onClick={downloadSvgFile} disabled={!ready} icon={<Download className="w-3.5 h-3.5" />} label="SVG" />
            <ActionButton onClick={downloadEps} disabled={!ready} icon={<FileCode className="w-3.5 h-3.5" />} label="EPS" />
            <ActionButton onClick={downloadPdf} disabled={!ready} icon={<FileText className="w-3.5 h-3.5" />} label="PDF" />
          </div>
          <p className="metric text-[9px] text-center text-muted-foreground tracking-wide">
            VECTOR EXPORTS · SQUARE MODULES · ISO 4-MODULE QUIET ZONE
          </p>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={copyImage}
              disabled={!ready}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-border bg-background/40 text-foreground font-medium text-[13px] hover:border-primary/50 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy image"}
            </button>
            <button
              onClick={shareAsset}
              disabled={!ready}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-border bg-background/40 text-foreground font-medium text-[13px] hover:border-primary/50 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              <Share2 className="w-3.5 h-3.5" /> Share asset
            </button>
          </div>
          <p className="metric text-[9px] text-center text-muted-foreground tracking-wide">
            ⌘/CTRL + SHIFT + C COPY · ⌘/CTRL + S DOWNLOAD
          </p>
        </div>
      </div>

      {fullscreen && ready && (
        <div
          className="fixed inset-0 z-50 blueprint-grid bg-background/98 flex flex-col items-center justify-center p-8 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={() => setFullscreen(false)}
            aria-label="Close full screen"
            className="absolute top-5 right-5 w-9 h-9 rounded-md border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-[0.98] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
          <img
            src={previewUrl}
            alt="Full screen QR code"
            className="w-full max-w-[min(80vh,80vw)] aspect-square object-contain rounded-lg bg-card p-6 border border-border"
            style={inverted ? { filter: "invert(1)" } : undefined}
          />
          <p className="label-tech mt-5">
            {modules ? `${modules}×${modules} MOD` : ""} {dimMm ? `· ${dimMm}mm × ${dimMm}mm` : ""} · ESC TO EXIT
          </p>
        </div>
      )}
    </div>
  );
}

function TickMark({ className }: { className: string }) {
  return (
    <span className={`pointer-events-none absolute ${className} h-3 w-3 text-primary/70`} aria-hidden>
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current" />
      <span className="absolute top-1/2 left-0 w-full h-px -translate-y-1/2 bg-current" />
    </span>
  );
}

function PillAction({
  onClick,
  disabled,
  icon,
  active,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-all active:scale-[0.98] disabled:opacity-40 ${
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function ActionButton({
  onClick,
  disabled,
  icon,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-md border border-border bg-background/40 text-foreground metric text-[11px] font-semibold hover:border-primary/50 active:scale-[0.98] transition-all disabled:opacity-40"
    >
      {icon}
      {label}
    </button>
  );
}

function MockupStand({ previewUrl, label, inverted }: { previewUrl: string; label: string; inverted?: boolean }) {
  return (
    <div className="w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
      <div className="relative w-[78%]">
        {/* matte acrylic table stand */}
        <div className="relative rounded-[10px] bg-gradient-to-b from-card to-secondary/70 border border-border px-4 pt-4 pb-5 shadow-[0_18px_35px_-18px_hsl(var(--foreground)/0.45)]">
          <div className="pointer-events-none absolute inset-0 rounded-[10px] bg-gradient-to-tr from-foreground/[0.06] via-transparent to-background/50" />
          <div className="rounded-md bg-background p-2">
            <img
              src={previewUrl}
              alt="QR code shown on a table stand mockup"
              className="w-full aspect-square object-contain"
              style={inverted ? { filter: "invert(1)" } : undefined}
            />
          </div>
          <p className="mt-3 text-center label-tech">{label ? label.slice(0, 22) : "Scan me"}</p>
        </div>
        {/* stand base + reflection */}
        <div className="mx-auto mt-1 h-2.5 w-[62%] rounded-b-[8px] bg-gradient-to-b from-border to-muted" />
        <div className="mx-auto mt-1 h-6 w-[80%] rounded-[50%] bg-foreground/10 blur-md" />
      </div>
    </div>
  );
}
