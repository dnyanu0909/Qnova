import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, LinkIcon, TriangleAlert, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  captureLead,
  logScan,
  pickDestination,
  resolveLink,
  scanCount,
  verifyPin,
  type ResolvedLink,
} from "@/lib/dynamicLinks";
import { normalizeUrl } from "@/lib/dynamicLinks";

type Stage = "loading" | "pin" | "lead" | "error";

export default function Redirect() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [stage, setStage] = useState<Stage>("loading");
  const [link, setLink] = useState<ResolvedLink | null>(null);
  const [destination, setDestination] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  const go = useCallback(async (linkRow: ResolvedLink, url: string) => {
    try {
      await logScan(linkRow.id);
    } catch {
      /* analytics is best-effort */
    }
    window.location.replace(url);
  }, []);

  useEffect(() => {
    if (!shortCode || started.current) return;
    started.current = true;
    (async () => {
      try {
        const row = await resolveLink(shortCode);
        if (!row) {
          setStage("error");
          return;
        }
        setLink(row);

        const expired = row.expires_at ? new Date(row.expires_at).getTime() <= Date.now() : false;
        let capped = false;
        if (row.max_scans && row.max_scans > 0) {
          capped = (await scanCount(row.id)) >= row.max_scans;
        }

        if (!row.is_active || expired || capped) {
          if (row.fallback_url?.trim()) {
            const fallback = normalizeUrl(row.fallback_url);
            setDestination(fallback);
            await go(row, fallback);
            return;
          }
          setStage("error");
          return;
        }

        const target = pickDestination(row).url;
        setDestination(target);

        if (row.gates?.pin) {
          setStage("pin");
          return;
        }
        if (row.gates?.lead) {
          setStage("lead");
          return;
        }
        await go(row, target);
      } catch {
        setStage("error");
      }
    })();
  }, [shortCode, go]);

  const submitPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link || !shortCode) return;
    setBusy(true);
    try {
      const ok = await verifyPin(shortCode, pin.trim());
      if (!ok) {
        toast.error("That PIN is not correct.");
        return;
      }
      if (link.gates?.lead) {
        setStage("lead");
        return;
      }
      await go(link, destination);
    } catch {
      toast.error("Could not check the PIN. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;
    setBusy(true);
    try {
      await captureLead({ linkId: link.id, name, email });
      await go(link, destination);
    } catch {
      toast.error("Could not submit your details. Try again.");
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 text-center">
      {stage === "loading" && (
        <div className="space-y-3">
          <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Taking you there…</h1>
          {destination && (
            <a href={destination} className="text-sm text-primary underline break-all">
              {destination}
            </a>
          )}
        </div>
      )}

      {stage === "pin" && (
        <form onSubmit={submitPin} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 text-left shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <Lock className="w-4 h-4 text-foreground" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-foreground">Protected link</h1>
              <p className="text-xs text-muted-foreground">Enter the PIN to continue{link?.title ? ` to ${link.title}` : ""}.</p>
            </div>
          </div>
          <input
            autoFocus
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-center text-lg tracking-[0.4em] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={busy || !pin.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Unlock
          </button>
        </form>
      )}

      {stage === "lead" && (
        <form onSubmit={submitLead} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 text-left shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <Mail className="w-4 h-4 text-foreground" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-foreground">Almost there</h1>
              <p className="text-xs text-muted-foreground">Tell us who you are to open this link.</p>
            </div>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Continue
          </button>
          <p className="text-[11px] text-muted-foreground">Your details are shared only with the owner of this QR code.</p>
        </form>
      )}

      {stage === "error" && (
        <div className="space-y-3 max-w-sm">
          <TriangleAlert className="w-7 h-7 mx-auto text-destructive" />
          <h1 className="text-lg font-semibold text-foreground">This link is unavailable</h1>
          <p className="text-sm text-muted-foreground">
            The QR campaign may be paused, expired, out of scans or removed by its owner.
          </p>
          <a href="/" className="inline-flex items-center gap-2 text-sm text-primary">
            <LinkIcon className="w-3.5 h-3.5" /> Back to QNova
          </a>
        </div>
      )}
    </main>
  );
}
