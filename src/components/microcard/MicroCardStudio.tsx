import { useEffect, useState } from "react";
import { Link as LinkIcon, Copy, Check, Download, Smartphone } from "lucide-react";
import { useMicroPage } from "@/hooks/useMicroPage";
import MicroCardForm from "./MicroCardForm";
import MicroCardView from "./MicroCardView";
import { qrToPngDataUrl, qrToSvgString, downloadDataUrl, downloadSvg } from "@/lib/qrExport";
import { fileToResizedDataUrl } from "@/lib/imageResize";

export default function MicroCardStudio() {
  const {
    form,
    slug,
    pageUrl,
    isPublishing,
    error,
    update,
    updateSocial,
    addButton,
    updateButton,
    removeButton,
    publish,
  } = useMicroPage();

  const [qrPng, setQrPng] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!pageUrl) {
      setQrPng("");
      return;
    }
    let cancelled = false;
    qrToPngDataUrl(pageUrl, { size: 420, fgColor: "#1e1b4b", bgColor: "#ffffff", logoDataUrl })
      .then((url) => !cancelled && setQrPng(url))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pageUrl, logoDataUrl]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSvgQr = async () => {
    const svg = await qrToSvgString(pageUrl, {
      size: 420,
      fgColor: "#1e1b4b",
      bgColor: "#ffffff",
      logoDataUrl,
    });
    downloadSvg(svg, `${slug}-qr.svg`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      <MicroCardForm
        form={form}
        onUpdate={update}
        onUpdateSocial={updateSocial}
        onAddButton={addButton}
        onUpdateButton={updateButton}
        onRemoveButton={removeButton}
      />

      <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div className="glass-card p-6 lg:p-8 flex flex-col items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
            <Smartphone className="w-4 h-4" />
            Live mobile preview
          </div>
          <div className="w-[300px] rounded-[2.25rem] border-[10px] border-foreground/85 bg-card overflow-hidden shadow-2xl">
            <div className="h-[560px] overflow-y-auto">
              <MicroCardView
                data={{
                  fullName: form.fullName,
                  headline: form.headline,
                  bio: form.bio,
                  avatarUrl: form.avatarDataUrl,
                  phone: form.phone,
                  email: form.email,
                  accent: form.accent,
                  socials: form.socials,
                  buttons: form.buttons,
                }}
                compact
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 lg:p-8 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <button
            onClick={publish}
            disabled={isPublishing}
            className="w-full py-3.5 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
          >
            {isPublishing ? "Publishing..." : slug ? "Publish new version" : "Publish page & generate QR"}
          </button>

          {slug && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2.5">
                <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <a
                  href={pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-sm text-foreground hover:underline"
                >
                  {pageUrl}
                </a>
                <button onClick={copyLink} aria-label="Copy link" className="text-muted-foreground hover:text-foreground">
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex justify-center">
                {qrPng && (
                  <img
                    src={qrPng}
                    alt={`QR code linking to ${form.fullName || "your"} micro page`}
                    className="w-56 h-56 rounded-xl border border-border"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Logo overlay (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) setLogoDataUrl(await fileToResizedDataUrl(file, 256));
                  }}
                  className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-foreground hover:file:opacity-90 file:cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => downloadDataUrl(qrPng, `${slug}-qr.png`)}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-secondary transition-colors"
                >
                  <Download className="w-4 h-4" />
                  PNG
                </button>
                <button
                  onClick={downloadSvgQr}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-secondary transition-colors"
                >
                  <Download className="w-4 h-4" />
                  SVG
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}