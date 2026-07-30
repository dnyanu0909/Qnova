import { useState } from "react";
import { Download, QrCode, Copy, Check, Printer } from "lucide-react";
import { downloadBlob, svgToPngBlob } from "@/lib/qrRender";
import { toast } from "sonner";
import ScannabilityMeter from "@/components/ScannabilityMeter";
import type { ScannabilityResult } from "@/lib/scannability";

interface PreviewPanelProps {
  previewUrl: string;
  svg: string;
  exportSize: number;
  highRes: boolean;
  error: string;
  shield: ScannabilityResult;
}

export default function PreviewPanel({ previewUrl, svg, exportSize, highRes, error, shield }: PreviewPanelProps) {
  const [copied, setCopied] = useState(false);
  const ready = Boolean(svg);

  const downloadPng = async () => {
    try {
      const blob = await svgToPngBlob(svg, exportSize);
      downloadBlob(blob, `qnova-qr-${exportSize}px.png`);
    } catch {
      toast.error("Could not export the PNG.");
    }
  };

  const downloadSvgFile = () => {
    downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), "qnova-qr.svg");
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

        <div className="w-full max-w-[340px] space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <ActionButton onClick={downloadPng} disabled={!ready} icon={<Download className="w-4 h-4" />} label="PNG" />
            <ActionButton onClick={downloadSvgFile} disabled={!ready} icon={<Download className="w-4 h-4" />} label="SVG" />
          </div>
          <button
            onClick={copyImage}
            disabled={!ready}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy image to clipboard"}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Printer className="w-3.5 h-3.5" />
            {highRes ? "Print mode: 2480px @ 300 DPI" : `Exporting at ${exportSize}px`}
          </p>
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
      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-secondary transition-colors disabled:opacity-40"
    >
      {icon}
      {label}
    </button>
  );
}
