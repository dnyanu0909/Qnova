import { useEffect, useState } from "react";
import { Palette, Save, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fileToResizedDataUrl } from "@/lib/imageResize";
import { brandKitPatch, clearBrandKit, defaultBrandKit, readBrandKit, saveBrandKit, type BrandKit } from "@/lib/brandKit";
import type { QROptions } from "@/hooks/useQRGenerator";

interface Props {
  options: QROptions;
  onApply: (patch: Partial<QROptions>) => void;
}

export default function BrandKitPanel({ options, onApply }: Props) {
  const [kit, setKit] = useState<BrandKit>(defaultBrandKit);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = readBrandKit();
    if (stored) {
      setKit(stored);
      setSaved(true);
    }
  }, []);

  const set = <K extends keyof BrandKit>(key: K, value: BrandKit[K]) => setKit((p) => ({ ...p, [key]: value }));

  const save = () => {
    saveBrandKit(kit);
    setSaved(true);
    toast.success("Brand kit saved");
  };

  const apply = () => {
    onApply(brandKitPatch(kit));
    toast.success("Brand kit applied to this QR code");
  };

  const captureCurrent = () => {
    const next: BrandKit = {
      ...kit,
      primary: options.fgColor,
      secondary: options.eyeColor,
      useGradient: options.gradientTo !== null,
      logoDataUrl: options.logoDataUrl ?? null,
      frame: options.frame,
      frameLabel: options.frameLabel,
    };
    setKit(next);
    saveBrandKit(next);
    setSaved(true);
    toast.success("Saved current design as your brand kit");
  };

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Brand Kit</span>
        </div>
        <button
          onClick={apply}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-3.5 h-3.5" /> Apply My Brand Kit
        </button>
      </div>

      <input
        value={kit.name}
        onChange={(e) => set("name", e.target.value)}
        placeholder="Brand name"
        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground input-focus"
      />

      <div className="grid grid-cols-2 gap-3">
        {([
          ["Primary colour", "primary"],
          ["Secondary colour", "secondary"],
        ] as const).map(([label, key]) => (
          <label key={key} className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-2 py-1.5">
              <input
                type="color"
                value={kit[key]}
                onChange={(e) => set(key, e.target.value)}
                className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <span className="text-xs font-mono text-muted-foreground">{kit[key]}</span>
            </div>
          </label>
        ))}
      </div>

      <label className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
        Use gradient (primary → secondary)
        <input
          type="checkbox"
          checked={kit.useGradient}
          onChange={(e) => set("useGradient", e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Frame template</span>
          <select
            value={kit.frame}
            onChange={(e) => set("frame", e.target.value as BrandKit["frame"])}
            className="w-full rounded-lg border border-input bg-card px-2 py-2 text-xs text-foreground"
          >
            <option value="none">No frame</option>
            <option value="card">Card</option>
            <option value="label">Caption label</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Frame caption</span>
          <input
            value={kit.frameLabel}
            onChange={(e) => set("frameLabel", e.target.value)}
            className="w-full rounded-lg border border-input bg-card px-2 py-2 text-xs text-foreground"
          />
        </label>
      </div>

      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Brand logo overlay</span>
        <div className="flex items-center gap-2">
          {kit.logoDataUrl && (
            <img src={kit.logoDataUrl} alt="Brand logo" className="h-9 w-9 rounded-lg border border-border object-contain bg-card" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) set("logoDataUrl", await fileToResizedDataUrl(file, 256));
            }}
            className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-secondary file:text-foreground file:cursor-pointer"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={save}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
        >
          <Save className="w-3.5 h-3.5" /> Save kit
        </button>
        <button
          onClick={captureCurrent}
          className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
        >
          Use current design
        </button>
        {saved && (
          <button
            onClick={() => {
              clearBrandKit();
              setKit(defaultBrandKit);
              setSaved(false);
              toast.success("Brand kit cleared");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
