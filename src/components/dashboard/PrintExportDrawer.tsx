import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import { FileDown, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { downloadBlob, svgToDataUrl, svgToPngBlob } from "@/lib/qrRender";
import { linkQrSvg } from "@/lib/linkQr";
import { shortUrl, type DynamicLink } from "@/lib/dynamicLinks";

type PresetId = "tent" | "card" | "sheet6" | "sheet12";

interface Preset {
  id: PresetId;
  label: string;
  description: string;
  /** trim size in inches */
  page: [number, number];
  grid?: [number, number];
}

const A4: [number, number] = [8.27, 11.69];

const presets: Preset[] = [
  { id: "tent", label: "Table tent / counter display", description: "4 × 6 in, single code", page: [4, 6] },
  { id: "card", label: "Standard business card", description: "3.5 × 2 in, single code", page: [3.5, 2] },
  { id: "sheet6", label: "Sticker sheet — 6 up", description: "A4, 2 × 3 grid", page: A4, grid: [2, 3] },
  { id: "sheet12", label: "Sticker sheet — 12 up", description: "A4, 3 × 4 grid", page: A4, grid: [3, 4] },
];

const BLEED = 0.125;

interface Props {
  link: DynamicLink | null;
  onOpenChange: (open: boolean) => void;
}

export default function PrintExportDrawer({ link, onOpenChange }: Props) {
  const [presetId, setPresetId] = useState<PresetId>("tent");
  const [busy, setBusy] = useState(false);
  const preset = presets.find((p) => p.id === presetId)!;

  useEffect(() => {
    if (link) setPresetId("tent");
  }, [link]);

  const svg = useMemo(() => {
    if (!link) return "";
    try {
      return linkQrSvg(shortUrl(link.short_code), link.qr_options);
    } catch {
      return "";
    }
  }, [link]);

  const exportSvg = () => {
    if (!svg) return;
    downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `qnova-${link?.short_code}-vector.svg`);
  };

  const exportPdf = async () => {
    if (!svg || !link) return;
    setBusy(true);
    try {
      const pngBlob = await svgToPngBlob(svg, 1200);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(pngBlob);
      });

      const [tw, th] = preset.page;
      const w = tw + BLEED * 2;
      const h = th + BLEED * 2;
      const doc = new jsPDF({ unit: "in", format: [w, h], orientation: w >= h ? "landscape" : "portrait" });

      // bleed / trim guides
      doc.setDrawColor(180);
      doc.setLineWidth(0.005);
      doc.rect(BLEED, BLEED, tw, th);
      const mark = 0.09;
      const corners: [number, number][] = [
        [BLEED, BLEED],
        [BLEED + tw, BLEED],
        [BLEED, BLEED + th],
        [BLEED + tw, BLEED + th],
      ];
      corners.forEach(([x, y]) => {
        doc.line(x - mark, y, x + mark, y);
        doc.line(x, y - mark, x, y + mark);
      });

      if (preset.grid) {
        const [cols, rows] = preset.grid;
        const cellW = tw / cols;
        const cellH = th / rows;
        const side = Math.min(cellW, cellH) * 0.72;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cx = BLEED + c * cellW + cellW / 2;
            const cy = BLEED + r * cellH + cellH / 2;
            doc.setDrawColor(220);
            doc.rect(BLEED + c * cellW, BLEED + r * cellH, cellW, cellH);
            doc.addImage(dataUrl, "PNG", cx - side / 2, cy - side / 2 - 0.08, side, side);
            doc.setFontSize(6);
            doc.setTextColor(90);
            doc.text(link.title.slice(0, 28), cx, cy + side / 2 + 0.06, { align: "center" });
          }
        }
      } else {
        const side = Math.min(tw, th) * 0.62;
        const cx = BLEED + tw / 2;
        doc.addImage(dataUrl, "PNG", cx - side / 2, BLEED + th * 0.14, side, side);
        doc.setFontSize(preset.id === "card" ? 8 : 13);
        doc.setTextColor(30);
        doc.text(link.title, cx, BLEED + th * 0.14 + side + (preset.id === "card" ? 0.16 : 0.3), { align: "center" });
        doc.setFontSize(preset.id === "card" ? 6 : 9);
        doc.setTextColor(120);
        doc.text("Scan me", cx, BLEED + th * 0.14 + side + (preset.id === "card" ? 0.28 : 0.52), { align: "center" });
      }

      doc.save(`qnova-${link.short_code}-${preset.id}-print.pdf`);
    } catch {
      toast.error("Could not build the print PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={Boolean(link)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-primary" /> Print-ready export
          </SheetTitle>
          <SheetDescription>{link?.title} · /r/{link?.short_code}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-border bg-secondary/30 p-6 flex justify-center">
            {svg ? (
              <img src={svgToDataUrl(svg)} alt="QR code print preview" className="w-40 h-40" />
            ) : (
              <p className="text-sm text-muted-foreground">Preview unavailable</p>
            )}
          </div>

          <div className="space-y-2">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => setPresetId(p.id)}
                className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                  presetId === p.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
                }`}
              >
                <p className="text-sm font-medium text-foreground">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.description}</p>
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            PDFs include a {BLEED}" bleed margin with trim box and crop marks.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={exportPdf}
              disabled={!svg || busy}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} Print PDF
            </button>
            <button
              onClick={exportSvg}
              disabled={!svg}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" /> Vector SVG
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}