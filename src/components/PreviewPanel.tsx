import { useMemo, useState } from "react";
import { Download, QrCode, Copy, Check, FileCode, FileText, Ruler } from "lucide-react";
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
  exportSize: number;
  highRes: boolean;
  error: string;
  shield: ScannabilityResult;
}

const DPI_PRESETS = [
  { id: "1x", label: "1x", detail: "Web · 72 DPI", px: 512 },
  { id: "2x", label: "2x", detail: "Screen · 150 DPI", px: 1024 },
  { id: "4x", label: "4x", detail: "Print · 300+ DPI", px: 2400 },
] as const;

export default function PreviewPanel({
  previewUrl,
  svg,
  content,
  label,
  exportSize,
  highRes,
  error,
  shield,
}: PreviewPanelProps) {
  const [copied, setCopied] = useState(false);
  const [dpiId, setDpiId] = useState<(typeof DPI_PRESETS)[number]["id"]>("1x");
  const ready = Boolean(svg);

  const dpi = DPI_PRESETS.find((p) => p.id === dpiId) ?? DPI_PRESETS[0];
  const pngSize = highRes ? Math.max(dpi.px, 2480) : dpi.px;

  const guidance = useMemo(() => {
    if (!ready) return null;
    const g = printGuidance(qrModuleCount(content));
    return g.ok ? g : null;
  }, [ready, content]);

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
      const eps = buildEps(content, shield ? "#000000" : "#000000", "#ffffff");
      downloadBlob(new Blob([eps], { type: "application/postscript" }), "qnova-qr.eps");
      toast.success("Vector EPS exported — square modules, 4-module quiet zone.");
    } catch {
      toast.error("Could not build the EPS file.");
    }
  };

  const downloadPdf = () => {
    try {
      buildPrintPdf(content, "#000000", "#ffffff", label).save("qnova-qr-print.pdf");
      toast.success("Print PDF exported — vector modules with ISO quiet zone.");
    } catch {
      toast.error("Could not build the print PDF.");
    }
  };

  const copyImage = async () => {
    try {
      const blob = await svgToPngBlob(svg, Math.min(exportSize, 1024));
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      toast.success("QR code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Your browser blocked clipboard access.");
    }
  };

  return (
    <div className="glass-card p-5 sm:p-6 lg:p-8 lg:sticky lg:top-24 lg:self-start">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Live preview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {ready ? "Updates instantly as you type" : "Add content to see your QR code"}
          </p>
        </div>

        {error && (
          <div className="w-full px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        <div className="w-full max-w-[340px] aspect-square rounded-2xl border border-border bg-muted/30 flex items-center justify-center overflow-hidden p-5">
          {ready ? (
            <img src={previewUrl} alt="Live QR code preview" className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground/50">
              <QrCode className="w-16 h-16" strokeWidth={1} />
              <span className="text-sm font-medium">No QR code yet</span>
            </div>
          )}
        </div>

        <div className="w-full max-w-[340px]">
          <ScannabilityMeter result={shield} />
        </div>

        {guidance && (
          <div className="w-full max-w-[340px] flex items-start gap-2.5 rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <Ruler className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Minimum recommended print size:{" "}
              <span className="font-semibold text-foreground">
                {guidance.minSizeCm.toFixed(1)} × {guidance.minSizeCm.toFixed(1)} cm
              </span>{" "}
              for reliable scanning at ~{guidance.scanDistanceCm} cm distance. {guidance.modules}×
              {guidance.modules} matrix, 4-module quiet zone included.
            </p>
          </div>
        )}

        <div className="w-full max-w-[340px] space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {DPI_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setDpiId(p.id)}
                className={`rounded-xl border px-2 py-2 text-center transition-colors ${
                  dpiId === p.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="block text-sm font-semibold">{p.label}</span>
                <span className="block text-[10px] leading-tight">{p.detail}</span>
              </button>
            ))}
          </div>

          <button
            onClick={downloadPng}
            disabled={!ready}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none"
          >
            <Download className="w-4 h-4" /> Download PNG · {pngSize}px
          </button>

          <div className="grid grid-cols-3 gap-2">
            <ActionButton onClick={downloadSvgFile} disabled={!ready} icon={<Download className="w-4 h-4" />} label="SVG" />
            <ActionButton onClick={downloadEps} disabled={!ready} icon={<FileCode className="w-4 h-4" />} label="EPS" />
            <ActionButton onClick={downloadPdf} disabled={!ready} icon={<FileText className="w-4 h-4" />} label="Print PDF" />
          </div>
          <p className="text-[11px] text-center text-muted-foreground">
            Vector exports use clean square modules with the ISO 4-module quiet zone preserved.
          </p>

          <button
            onClick={copyImage}
            disabled={!ready}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-secondary transition-colors disabled:opacity-40"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy image to clipboard"}
          </button>
        </div>
      </div>
    </div>
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
      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-secondary transition-colors disabled:opacity-40"
    >
      {icon}
      {label}
    </button>
  );
}
