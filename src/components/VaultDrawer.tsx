import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Archive, Download, Pencil, Trash2, Eye, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";
import { buildQrSvg, svgToDataUrl, svgToPngBlob, downloadBlob } from "@/lib/qrRender";
import { readVault, renameEntry, removeEntry, clearVault, type VaultEntry } from "@/lib/vault";
import type { QRData, QROptions } from "@/hooks/useQRGenerator";

interface VaultDrawerProps {
  entries: VaultEntry[];
  onEntriesChange: (entries: VaultEntry[]) => void;
  onRestore: (data: QRData, options: QROptions) => void;
}

export default function VaultDrawer({ entries, onEntriesChange, onRestore }: VaultDrawerProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (open) onEntriesChange(readVault());
  }, [open, onEntriesChange]);

  const download = async (entry: VaultEntry, kind: "png" | "svg") => {
    try {
      const svg = buildQrSvg(entry.value, entry.options);
      if (kind === "svg") {
        downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `${entry.name || "qnova-qr"}.svg`);
      } else {
        downloadBlob(await svgToPngBlob(svg, entry.options.size), `${entry.name || "qnova-qr"}.png`);
      }
    } catch {
      toast.error("Could not re-export that code.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="flex items-center gap-2 h-8 px-3 rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Open My Vault"
        >
          <Archive className="w-3.5 h-3.5" />
          My Vault
          {entries.length > 0 && (
            <span className="px-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">{entries.length}</span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>My Vault</SheetTitle>
          <SheetDescription>Recently generated codes, saved on this device.</SheetDescription>
        </SheetHeader>

        {entries.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">Nothing saved yet. Generate a code and hit “Save to Vault”.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {entries.map((entry) => {
              let preview = "";
              try {
                preview = svgToDataUrl(buildQrSvg(entry.value, entry.options));
              } catch {
                preview = "";
              }
              return (
                <div key={entry.id} className="rounded-xl border border-border bg-card p-3 flex gap-3">
                  <div className="w-16 h-16 rounded-lg bg-muted/40 shrink-0 flex items-center justify-center overflow-hidden p-1">
                    {preview && <img src={preview} alt={`Saved QR code ${entry.name}`} className="w-full h-full object-contain" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    {editing === entry.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm input-focus"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            onEntriesChange(renameEntry(entry.id, draft.trim() || entry.name));
                            setEditing(null);
                          }}
                          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                          aria-label="Save name"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-foreground truncate">{entry.name}</p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">{entry.value}</p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Eye className="w-3 h-3" /> {entry.scans} scans
                      <span className="mx-1">·</span>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <VaultAction
                        icon={<RotateCcw className="w-3 h-3" />}
                        label="Re-edit"
                        onClick={() => {
                          onRestore(entry.data, entry.options);
                          setOpen(false);
                        }}
                      />
                      <VaultAction icon={<Download className="w-3 h-3" />} label="PNG" onClick={() => download(entry, "png")} />
                      <VaultAction icon={<Download className="w-3 h-3" />} label="SVG" onClick={() => download(entry, "svg")} />
                      <VaultAction
                        icon={<Pencil className="w-3 h-3" />}
                        label="Rename"
                        onClick={() => {
                          setEditing(entry.id);
                          setDraft(entry.name);
                        }}
                      />
                      <VaultAction
                        icon={<Trash2 className="w-3 h-3" />}
                        label="Delete"
                        onClick={() => onEntriesChange(removeEntry(entry.id))}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => onEntriesChange(clearVault())}
              className="w-full py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear vault
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function VaultAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 rounded-md border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}