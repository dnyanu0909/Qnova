import { useMemo, useState } from "react";
import { Download, Zap } from "lucide-react";
import { linkQrSvg } from "@/lib/linkQr";
import { svgToDataUrl, svgToPngBlob, downloadBlob } from "@/lib/qrRender";
import { toast } from "sonner";

export default function QuickStart() {
  const [url, setUrl] = useState("https://qnova.lovable.app");

  const svg = useMemo(() => {
    const v = url.trim();
    if (!v) return "";
    try {
      return linkQrSvg(v, { dotStyle: "rounded", cornerStyle: "rounded" });
    } catch {
      return "";
    }
  }, [url]);

  const png = async () => {
    try {
      downloadBlob(await svgToPngBlob(svg, 1024), "qnova-quickstart.png");
    } catch {
      toast.error("Could not export the PNG.");
    }
  };

  return (
    <div className="glass-card p-5 sm:p-6 w-full max-w-sm">
      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
        <Zap className="h-3.5 w-3.5" /> Quick start — no sign-up
      </div>
      <label htmlFor="quickstart-url" className="mt-4 block text-xs font-medium text-muted-foreground">
        Paste any link
      </label>
      <input
        id="quickstart-url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://your-link.com"
        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      />
      <div className="mt-4 mx-auto flex h-44 w-44 items-center justify-center rounded-xl border border-border bg-muted/30 p-3">
        {svg ? (
          <img src={svgToDataUrl(svg)} alt="Quick start QR code preview" className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground">Add a link</span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={png}
          disabled={!svg}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Download className="h-4 w-4" /> PNG
        </button>
        <button
          onClick={() => downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), "qnova-quickstart.svg")}
          disabled={!svg}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
        >
          <Download className="h-4 w-4" /> SVG
        </button>
      </div>
    </div>
  );
}