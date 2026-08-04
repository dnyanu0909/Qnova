import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Images, Copy, ExternalLink, Trash2, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { readPages, removePage, type GalleryEntry } from "@/lib/pageGallery";
import type { MicroPageForm } from "@/hooks/useMicroPage";

interface Props {
  onEdit: (form: MicroPageForm) => void;
  refreshKey?: number;
}

export default function PageGalleryDrawer({ onEdit, refreshKey = 0 }: Props) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setEntries(readPages());
  }, [open, refreshKey]);

  const copy = async (entry: GalleryEntry) => {
    await navigator.clipboard.writeText(entry.url);
    setCopied(entry.id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Link copied");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors">
          <Images className="w-3.5 h-3.5" /> My Pages
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>My Pages</SheetTitle>
          <SheetDescription>Every micro-landing page you published from this browser.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {entries.length === 0 && <p className="text-sm text-muted-foreground">No published pages yet.</p>}
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  {entry.form.avatarDataUrl && (
                    <img src={entry.form.avatarDataUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{entry.name}</p>
                  <p className="truncate text-xs text-muted-foreground">/p/{entry.slug}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open
                </a>
                <button
                  onClick={() => copy(entry)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
                >
                  {copied === entry.id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />} Share
                </button>
                <button
                  onClick={() => {
                    onEdit(entry.form);
                    setOpen(false);
                    toast.success("Loaded into the editor");
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => setEntries(removePage(entry.id))}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
