import { useEffect, useState } from "react";
import { Loader2, Plus, Route, ShieldCheck, Timer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  normalizeUrl,
  shortUrl,
  updateLink,
  type DaypartRule,
  type DynamicLink,
} from "@/lib/dynamicLinks";

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

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export default function EditLinkModal({ link, onOpenChange, onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [active, setActive] = useState(true);
  const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);

  const [ios, setIos] = useState("");
  const [android, setAndroid] = useState("");
  const [desktop, setDesktop] = useState("");
  const [dayparts, setDayparts] = useState<DaypartRule[]>([]);

  const [leadGate, setLeadGate] = useState(false);
  const [pinGate, setPinGate] = useState(false);
  const [pin, setPin] = useState("");
  const [maxScans, setMaxScans] = useState("");
  const [fallback, setFallback] = useState("");

  useEffect(() => {
    if (!link) return;
    setTitle(link.title);
    setDestination(link.destination_url);
    setActive(link.is_active);
    setExpires(toLocalInput(link.expires_at));
    const rules = link.routing_rules ?? {};
    setIos(rules.devices?.ios ?? "");
    setAndroid(rules.devices?.android ?? "");
    setDesktop(rules.devices?.desktop ?? "");
    setDayparts(rules.dayparts ?? []);
    setLeadGate(Boolean(link.gates?.lead));
    setPinGate(Boolean(link.gates?.pin));
    setPin("");
    setMaxScans(link.max_scans ? String(link.max_scans) : "");
    setFallback(link.fallback_url ?? "");
  }, [link]);

  const patchDaypart = (index: number, patch: Partial<DaypartRule>) =>
    setDayparts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));

  const save = async () => {
    if (!link) return;
    if (!destination.trim()) {
      toast.error("Add a destination URL.");
      return;
    }
    if (pinGate && !pin.trim() && !link.gates?.pin) {
      toast.error("Set a PIN to enable PIN protection.");
      return;
    }
    setBusy(true);
    try {
      const saved = await updateLink(link.id, {
        title: title.trim() || "Untitled campaign",
        destination_url: normalizeUrl(destination),
        is_active: active,
        expires_at: expires ? new Date(expires).toISOString() : null,
        routing_rules: {
          devices: {
            ios: ios.trim() ? normalizeUrl(ios) : "",
            android: android.trim() ? normalizeUrl(android) : "",
            desktop: desktop.trim() ? normalizeUrl(desktop) : "",
          },
          dayparts: dayparts
            .filter((d) => d.url.trim() && d.start && d.end)
            .map((d) => ({ ...d, url: normalizeUrl(d.url) })),
        },
        gates: { lead: leadGate, pin: pinGate },
        ...(pin.trim() ? { access_pin: pin.trim() } : {}),
        ...(pinGate ? {} : { access_pin: null }),
        max_scans: maxScans.trim() ? Math.max(1, parseInt(maxScans, 10) || 0) : null,
        fallback_url: fallback.trim() ? normalizeUrl(fallback) : null,
      });
      onSaved(saved);
      toast.success("Routing and gates updated — the printed QR code stays the same.");
      onOpenChange(false);
    } catch {
      toast.error("Could not save the changes.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(link)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit campaign</DialogTitle>
          <DialogDescription>
            The QR matrix never changes — only where it sends people, and who gets through.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Fixed short link</p>
            <p className="text-sm text-foreground break-all">{link ? shortUrl(link.short_code) : ""}</p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Campaign name</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Default destination URL</span>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="https://example.com/summer-menu"
              className={inputClass}
            />
          </label>

          {/* Routing rules */}
          <section className="rounded-xl border border-border p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Routing rules</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Device rules win first, then time windows, then the default destination.
            </p>

            <div className="grid gap-3">
              {[
                { label: "iOS / iPhone", value: ios, set: setIos, hint: "https://apps.apple.com/…" },
                { label: "Android", value: android, set: setAndroid, hint: "https://play.google.com/…" },
                { label: "Desktop", value: desktop, set: setDesktop, hint: "https://example.com/web" },
              ].map((row) => (
                <label key={row.label} className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{row.label}</span>
                  <input
                    value={row.value}
                    onChange={(e) => row.set(e.target.value)}
                    placeholder={row.hint}
                    className={inputClass}
                  />
                </label>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Time-based routing (dayparting)</span>
                <button
                  onClick={() => setDayparts((prev) => [...prev, { start: "06:00", end: "11:00", url: "" }])}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-secondary"
                >
                  <Plus className="w-3 h-3" /> Add window
                </button>
              </div>
              {dayparts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No time windows — every scan uses the default URL.</p>
              ) : (
                dayparts.map((part, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={part.start}
                      onChange={(e) => patchDaypart(i, { start: e.target.value })}
                      className="rounded-xl border border-border bg-background px-2 py-2 text-xs text-foreground"
                    />
                    <input
                      type="time"
                      value={part.end}
                      onChange={(e) => patchDaypart(i, { end: e.target.value })}
                      className="rounded-xl border border-border bg-background px-2 py-2 text-xs text-foreground"
                    />
                    <input
                      value={part.url}
                      onChange={(e) => patchDaypart(i, { url: e.target.value })}
                      placeholder="https://example.com/breakfast"
                      className={inputClass}
                    />
                    <button
                      onClick={() => setDayparts((prev) => prev.filter((_, idx) => idx !== i))}
                      className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive"
                      aria-label="Remove time window"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Gates */}
          <section className="rounded-xl border border-border p-4 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Access &amp; lead gates</h3>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Email lead gate</p>
                <p className="text-xs text-muted-foreground">Ask for name &amp; email before the redirect.</p>
              </div>
              <Switch checked={leadGate} onCheckedChange={setLeadGate} />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Password / PIN protection</p>
                <p className="text-xs text-muted-foreground">Visitors must enter the PIN to continue.</p>
              </div>
              <Switch checked={pinGate} onCheckedChange={setPinGate} />
            </div>

            {pinGate && (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {link?.gates?.pin ? "New PIN (leave blank to keep current)" : "PIN"}
                </span>
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="e.g. 4821"
                  className={inputClass}
                />
              </label>
            )}
          </section>

          {/* Auto expiry */}
          <section className="rounded-xl border border-border p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Auto-expiry</h3>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Expiration date (optional)</span>
              <input type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)} className={inputClass} />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Maximum scans (optional)</span>
              <input
                type="number"
                min={1}
                value={maxScans}
                onChange={(e) => setMaxScans(e.target.value)}
                placeholder="e.g. 500"
                className={inputClass}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Fallback URL after expiry / cap</span>
              <input
                value={fallback}
                onChange={(e) => setFallback(e.target.value)}
                placeholder="https://example.com/campaign-ended"
                className={inputClass}
              />
            </label>
          </section>

          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">Paused codes use the fallback URL, or show an unavailable page.</p>
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
