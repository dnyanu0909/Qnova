import { useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { Upload, FileSpreadsheet, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { buildQrSvg, svgToDataUrl, svgToPngBlob, downloadBlob } from "@/lib/qrRender";
import type { QROptions } from "@/hooks/useQRGenerator";

interface BatchRow {
  label: string;
  value: string;
}

function parseCsv(text: string): BatchRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const split = (line: string) =>
    line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
  const first = split(lines[0]).map((c) => c.toLowerCase());
  const hasHeader = first.some((c) => ["url", "link", "value", "name", "label", "email", "phone"].includes(c));
  const body = hasHeader ? lines.slice(1) : lines;
  const nameIdx = hasHeader ? first.findIndex((c) => c === "name" || c === "label") : -1;
  const valueIdx = hasHeader ? first.findIndex((c) => c === "url" || c === "link" || c === "value") : -1;

  return body
    .map((line, i) => {
      const cells = split(line);
      const value = (valueIdx >= 0 ? cells[valueIdx] : cells.find((c) => c.length > 0)) ?? "";
      const label = (nameIdx >= 0 ? cells[nameIdx] : "") || `row-${i + 1}`;
      return { label, value };
    })
    .filter((r) => r.value.length > 0);
}

function safeName(s: string) {
  return s.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "qr";
}

export default function BatchMode({ options }: { options: QROptions }) {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(
    () =>
      rows.map((row) => {
        try {
          const svg = buildQrSvg(row.value, options);
          return { ...row, svg, url: svgToDataUrl(svg) };
        } catch {
          return { ...row, svg: "", url: "" };
        }
      }),
    [rows, options],
  );

  const valid = items.filter((i) => i.svg);

  const onFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseCsv(text);
    if (!parsed.length) {
      toast.error("No usable rows found in that CSV.");
      return;
    }
    setRows(parsed.slice(0, 200));
    setFileName(file.name);
    toast.success(`Loaded ${parsed.length} row${parsed.length === 1 ? "" : "s"}`);
  };

  const downloadZip = async () => {
    if (!valid.length) return;
    setBusy(true);
    try {
      const zip = new JSZip();
      const png = zip.folder("png")!;
      const svgFolder = zip.folder("svg")!;
      const used = new Map<string, number>();
      for (const item of valid) {
        const base = safeName(item.label);
        const n = (used.get(base) ?? 0) + 1;
        used.set(base, n);
        const name = n > 1 ? `${base}-${n}` : base;
        svgFolder.file(`${name}.svg`, item.svg);
        const blob = await svgToPngBlob(item.svg, Math.min(options.size, 1024));
        png.file(`${name}.png`, blob);
      }
      zip.file("index.csv", ["label,value", ...valid.map((i) => `"${i.label}","${i.value}"`)].join("\n"));
      const out = await zip.generateAsync({ type: "blob" });
      downloadBlob(out, `qnova-batch-${valid.length}-codes.zip`);
    } catch {
      toast.error("Could not build the ZIP archive.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Batch CSV generator</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a CSV with a <code className="text-foreground">url</code> (or <code className="text-foreground">value</code>) column and an
              optional <code className="text-foreground">name</code> column. Current design settings apply to every code.
            </p>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:opacity-90 active:scale-[0.98] transition-all shrink-0"
          >
            <Upload className="w-4 h-4" /> Upload CSV
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
        </div>

        {fileName && (
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <FileSpreadsheet className="w-4 h-4" /> {fileName}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-medium text-foreground">
              {valid.length} of {items.length} encodable
            </span>
            <button
              onClick={downloadZip}
              disabled={!valid.length || busy}
              className="ml-auto flex items-center gap-2 py-2.5 px-4 rounded-xl border border-border bg-card font-medium text-sm hover:bg-secondary transition-colors disabled:opacity-40"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              {busy ? "Packaging…" : "Download all as ZIP (PNG + SVG)"}
            </button>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="glass-card p-5 sm:p-6 lg:p-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item, i) => (
              <div key={`${item.label}-${i}`} className="rounded-xl border border-border bg-muted/30 p-3 flex flex-col gap-2">
                <div className="aspect-square rounded-lg overflow-hidden bg-card flex items-center justify-center p-2">
                  {item.url ? (
                    <img src={item.url} alt={`QR code for ${item.label}`} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xs text-destructive text-center px-2">Too long to encode</span>
                  )}
                </div>
                <p className="text-xs font-medium text-foreground truncate">{item.label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!items.length && (
        <div className="glass-card p-10 text-center text-sm text-muted-foreground">
          No rows yet — upload a CSV to generate a batch grid.
        </div>
      )}
    </div>
  );
}