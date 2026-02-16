import { Download, QrCode } from "lucide-react";

interface PreviewPanelProps {
  qrDataUrl: string;
  error: string;
  onDownload: () => void;
}

export default function PreviewPanel({ qrDataUrl, error, onDownload }: PreviewPanelProps) {
  return (
    <div className="glass-card p-6 lg:p-8 flex flex-col items-center justify-center min-h-[400px] lg:min-h-0 lg:h-full">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        <div>
          <h2 className="text-lg font-semibold text-foreground text-center">Preview</h2>
          <p className="text-sm text-muted-foreground text-center mt-1">
            {qrDataUrl ? "Your QR code is ready" : "Configure and generate your QR code"}
          </p>
        </div>

        {error && (
          <div className="w-full px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        <div className="w-full aspect-square max-w-[320px] rounded-2xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden transition-all duration-300">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Generated QR Code"
              className="w-full h-full object-contain p-4 animate-in fade-in duration-500"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground/50">
              <QrCode className="w-16 h-16" strokeWidth={1} />
              <span className="text-sm font-medium">No QR code yet</span>
            </div>
          )}
        </div>

        {qrDataUrl && (
          <button
            onClick={onDownload}
            className="flex items-center gap-2 py-3 px-6 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-secondary active:scale-[0.98] transition-all duration-200 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
        )}
      </div>
    </div>
  );
}
