import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Camera, Copy, Check, ExternalLink, UserRound, Wifi, ScanLine, Upload, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { parseScan, vcardToFile, type ScanResult } from "@/lib/scanParse";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ScannerModal({ open, onOpenChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError("");
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      const tick = () => {
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" });
        if (code?.data) {
          setResult(parseScan(code.data));
          stop();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setError("Camera access was blocked or unavailable. You can upload a QR image instead.");
    }
  }, [stop]);

  useEffect(() => {
    if (open) start();
    else stop();
    return stop;
  }, [open, start, stop]);

  const scanFile = async (file: File) => {
    const bitmapUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" });
      URL.revokeObjectURL(bitmapUrl);
      if (code?.data) {
        stop();
        setResult(parseScan(code.data));
      } else {
        toast.error("No QR code found in that image.");
      }
    };
    img.src = bitmapUrl;
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-4 h-4" /> Scan a QR code
          </DialogTitle>
          <DialogDescription>Point your camera at any QR code — we detect the type automatically.</DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-black">
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              {/* scanning grid overlay */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-6 rounded-xl border-2 border-primary/70" />
                <div className="absolute inset-6 grid grid-cols-3 grid-rows-3 opacity-30">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-primary/40" />
                  ))}
                </div>
                <div className="absolute left-6 right-6 top-[8%] h-0.5 bg-primary animate-[scanline_2.4s_ease-in-out_infinite]" />
              </div>
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/90 px-6 text-center text-sm text-muted-foreground">
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={start}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Camera className="w-4 h-4" /> Restart camera
              </button>
              <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer">
                <Upload className="w-4 h-4" /> Upload image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) scanFile(file);
                  }}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{result.label}</p>
              {result.kind === "wifi" && result.wifi ? (
                <div className="text-sm text-foreground space-y-1">
                  <p>SSID: <span className="font-medium">{result.wifi.ssid}</span></p>
                  <p>Security: <span className="font-medium">{result.wifi.encryption}</span></p>
                  {result.wifi.password && <p>Password: <span className="font-mono">{result.wifi.password}</span></p>}
                </div>
              ) : result.kind === "vcard" && result.vcard ? (
                <div className="text-sm text-foreground space-y-1">
                  <p className="font-medium">{result.vcard.name}</p>
                  {result.vcard.title && <p className="text-muted-foreground">{result.vcard.title}</p>}
                  {result.vcard.phone && <p>{result.vcard.phone}</p>}
                  {result.vcard.email && <p>{result.vcard.email}</p>}
                </div>
              ) : (
                <p className="text-sm text-foreground break-all">{result.raw}</p>
              )}
            </div>

            <div className="space-y-2">
              {result.url && (
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <ExternalLink className="w-4 h-4" /> Open link
                </a>
              )}
              {result.kind === "vcard" && (
                <button
                  onClick={() => vcardToFile(result.raw, result.vcard?.name || "contact")}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <UserRound className="w-4 h-4" /> Save contact
                </button>
              )}
              {result.kind === "wifi" && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.wifi?.password || "");
                    toast.success("Wi-Fi password copied");
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Wifi className="w-4 h-4" /> Copy Wi-Fi password
                </button>
              )}
              <button
                onClick={copy}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />} Copy content
              </button>
              <button
                onClick={start}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Scan another
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
