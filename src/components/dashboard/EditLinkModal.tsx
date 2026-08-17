import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { normalizeUrl, shortUrl, updateLink, type DynamicLink } from "@/lib/dynamicLinks";

interface Props {
  link: DynamicLink | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (link: DynamicLink) => void;
}

function toLocalInput(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditLinkModal({ link, onOpenChange, onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [active, setActive] = useState(true);
  const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!link) return;
    setTitle(link.title);
    setDestination(link.destination_url);
    setActive(link.is_active);
    setExpires(toLocalInput(link.expires_at));
  }, [link]);

  const save = async () => {
    if (!link) return;
    if (!destination.trim()) {
      toast.error("Add a destination URL.");
      return;
    }
    setBusy(true);
    try {
      const saved = await updateLink(link.id, {
        title: title.trim() || "Untitled campaign",
        destination_url: normalizeUrl(destination),
        is_active: active,
        expires_at: expires ? new Date(expires).toISOString() : null,
      });
      onSaved(saved);
      toast.success("Destination updated — the printed QR code stays the same.");
      onOpenChange(false);
    } catch {
      toast.error("Could not save the changes.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(link)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit campaign</DialogTitle>
          <DialogDescription>
            The QR matrix never changes — only where it sends people.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Fixed short link</p>
            <p className="text-sm text-foreground break-all">{link ? shortUrl(link.short_code) : ""}</p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Campaign name</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Destination URL</span>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="https://example.com/summer-menu"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Expiration date (optional)</span>
            <input
              type="datetime-local"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">Paused codes show an unavailable page.</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          <button
            onClick={save}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save changes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}