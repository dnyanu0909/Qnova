import { useState } from "react";
import { Link as LinkIcon, Loader2, Copy, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { createLink, shortUrl } from "@/lib/dynamicLinks";
import type { QROptions } from "@/hooks/useQRGenerator";

interface Props {
  destinationUrl: string;
  title: string;
  options: QROptions;
}

export default function SaveDynamicLink({ destinationUrl, title, options }: Props) {
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  const isUrl = /^https?:\/\//i.test(destinationUrl.trim()) || /\./.test(destinationUrl.trim());

  if (loading) return null;

  if (!user) {
    return (
      <Link
        to="/auth"
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-border bg-card text-muted-foreground font-medium text-sm hover:bg-secondary transition-colors"
      >
        <LinkIcon className="w-4 h-4" /> Sign in to save as a trackable dynamic link
      </Link>
    );
  }

  const save = async () => {
    if (!isUrl) {
      toast.error("Dynamic links need a web destination (URL, PDF, menu or social link).");
      return;
    }
    setBusy(true);
    try {
      const link = await createLink({
        userId: user.id,
        title,
        destinationUrl,
        qrOptions: {
          fgColor: options.fgColor,
          bgColor: options.bgColor,
          eyeColor: options.eyeColor,
          gradientTo: options.gradientTo,
          dotStyle: options.dotStyle,
          cornerStyle: options.cornerStyle,
          frame: options.frame,
          frameLabel: options.frameLabel,
          logoDataUrl: options.logoDataUrl,
          logoWhiteBg: options.logoWhiteBg,
        },
      });
      setCode(link.short_code);
      toast.success("Saved as a dynamic link — you can change its destination anytime.");
    } catch {
      toast.error("Could not save the dynamic link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={save}
        disabled={busy || !destinationUrl.trim()}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-secondary transition-colors disabled:opacity-40"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
        Save as dynamic link
      </button>

      {code && (
        <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2.5 space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Trackable short link</p>
          <p className="text-sm text-foreground break-all">{shortUrl(code)}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(shortUrl(code));
                toast.success("Short link copied");
              }}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}