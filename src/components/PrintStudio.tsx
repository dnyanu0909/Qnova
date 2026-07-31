import { useState } from "react";
import jsPDF from "jspdf";
import { FileDown, Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { svgToPngBlob, downloadBlob } from "@/lib/qrRender";
import { printPresets, DPI, type PrintPreset } from "@/lib/printPresets";

interface PrintStudioProps {
  previewUrl: string;
  svg: string;
  label: string;
}

type Mockup = "card" | "tent" | "sticker";

const mockups: { value: Mockup; label: string }[] = [
  { value: "card", label: "Business card" },
  { value: "tent", label: "Table tent" },
  { value: "sticker", label: "Product sticker" },
];

export default function PrintStudio({ previewUrl, svg, label }: PrintStudioProps) {
  const [presetId, setPresetId] = useState("business");
  const [mockup, setMockup] = useState<Mockup>("card");
  const [busy, setBusy] = useState(false);
  const preset = printPresets.find((p) => p.id === presetId)!;
  const ready = Boolean(svg);

  const exportPng = async (p: PrintPreset) => {
    const px = Math.round(Math.min(p.inches[0], p.inches[1]) * DPI);
    try {
      setBusy(true);
      downloadBlob(await svgToPngBlob(svg, px), `qnova-${p.id}-${px}px.png`);
    } catch {
      toast.error("Could not export the print PNG.");
    } finally {
      setBusy(false);
    }
  };

  const exportPdf = async (p: PrintPreset) => {
    try {
      setBusy(true);
      const px = Math.round(Math.min(p.inches[0], p.inches[1]) * DPI);
      const blob = await svgToPngBlob(svg, px);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(blob);
      });
      const [w, h] = p.inches;
      const doc = new jsPDF({ unit: "in", format: [w, h], orientation: w >= h ? "landscape" : "portrait" });
      const side = Math.min(w, h) * 0.8;
      doc.addImage(dataUrl, "PNG", (w - side) / 2, (h - side) / 2, side, side);
      doc.save(`qnova-${p.id}.pdf`);
    } catch {
      toast.error("Could not build the PDF.");
    } finally {
      setBusy(false);
    }
  };

  const exportSvg = () => {
    downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), "qnova-vector.svg");
  };

  return (
    <div className="glass-card p-5 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Printer className="w-4 h-4 text-primary" /> Print &amp; mockup studio
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Pick a physical format and preview it before you send it to print.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {printPresets.map((p) => (
          <button
            key={p.id}
            onClick={() => setPresetId(p.id)}
            className={`text-left p-3 rounded-xl border transition-all ${
              presetId === p.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border bg-card hover:bg-secondary"
            }`}
          >
            <p className="text-sm font-medium text-foreground">{p.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {mockups.map((m) => (
          <button
            key={m.value}
            onClick={() => setMockup(m.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              mockup === m.value ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-gradient-to-br from-muted/60 to-muted/20 p-6 flex items-center justify-center min-h-[260px]">
        {!ready ? (
          <p className="text-sm text-muted-foreground">Add content to see the print mockup.</p>
        ) : mockup === "card" ? (
          <div className="w-[340px] max-w-full aspect-[3.5/2] rounded-xl bg-card shadow-2xl border border-border p-4 flex items-center gap-4">
            <img src={previewUrl} alt="QR code on business card mockup" className="h-full aspect-square object-contain" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{label || "Your Brand"}</p>
              <p className="text-xs text-muted-foreground mt-1">Scan to connect</p>
              <div className="mt-3 h-px bg-border" />
              <p className="text-[10px] text-muted-foreground mt-2">3.5 × 2 in · 300 DPI</p>
            </div>
          </div>
        ) : mockup === "tent" ? (
          <div className="w-[190px] max-w-full aspect-[4/6] rounded-t-xl bg-card shadow-2xl border border-border p-4 flex flex-col items-center justify-between">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Scan me</p>
            <img src={previewUrl} alt="QR code on table tent mockup" className="w-full aspect-square object-contain" />
            <p className="text-[11px] text-center text-muted-foreground">{label || "Table service"}</p>
          </div>
        ) : (
          <div className="relative w-[200px] h-[200px] rounded-full bg-card shadow-2xl border border-border flex items-center justify-center">
            <div className="absolute inset-3 rounded-full border border-dashed border-border" />
            <img src={previewUrl} alt="QR code on round product sticker mockup" className="w-[58%] aspect-square object-contain" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => exportPng(preset)}
          disabled={!ready || busy}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border bg-card font-medium text-sm hover:bg-secondary transition-colors disabled:opacity-40"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} PNG @300 DPI
        </button>
        <button
          onClick={exportSvg}
          disabled={!ready}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border bg-card font-medium text-sm hover:bg-secondary transition-colors disabled:opacity-40"
        >
          <FileDown className="w-4 h-4" /> Vector SVG
        </button>
        <button
          onClick={() => exportPdf(preset)}
          disabled={!ready || busy}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} {preset.label} PDF
        </button>
      </div>
    </div>
  );
}