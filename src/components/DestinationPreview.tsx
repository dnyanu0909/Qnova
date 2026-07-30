import type { QRData } from "@/hooks/useQRGenerator";
import {
  Mail, Phone, MapPin, UserRound, Wifi, Lock, FileText, ExternalLink,
  UtensilsCrossed, Instagram, Linkedin, Youtube, Github, Globe, Check,
} from "lucide-react";

const socialIcons: Record<string, typeof Globe> = {
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  github: Github,
};

function Phone_({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-[248px] rounded-[2.5rem] border-[9px] border-foreground/85 bg-card shadow-2xl overflow-hidden">
        <div className="relative bg-muted/40">
          <div className="absolute left-1/2 top-2 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-foreground/85" />
          <div className="h-[420px] overflow-y-auto pt-8">{children}</div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="flex h-full items-center justify-center px-6 text-center text-xs text-muted-foreground">{text}</div>;
}

export default function DestinationPreview({ data }: { data: QRData }) {
  if (data.type === "contact") {
    const c = data.contact;
    const filled = c.name || c.phone || c.email;
    return (
      <Phone_ label="What the scanner sees — contact card">
        {!filled ? (
          <Empty text="Add a name, phone or email to preview the digital contact card." />
        ) : (
          <div className="px-5 pb-8">
            <div className="flex flex-col items-center pt-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
                {c.avatarDataUrl ? (
                  <img src={c.avatarDataUrl} alt={`${c.name || "Contact"} avatar`} className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-9 w-9 text-muted-foreground/60" strokeWidth={1.5} />
                )}
              </div>
              <p className="mt-3 text-base font-semibold text-foreground">{c.name || "Your Name"}</p>
              {c.title && <p className="text-xs text-muted-foreground">{c.title}</p>}
              {c.company && <p className="text-xs text-muted-foreground">{c.company}</p>}
            </div>
            <div className="mt-5 space-y-2">
              {c.phone && <Row icon={Phone} label="mobile" value={c.phone} />}
              {c.email && <Row icon={Mail} label="email" value={c.email} />}
              {c.address && <Row icon={MapPin} label="work" value={c.address} />}
            </div>
            <div className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-center text-xs font-semibold text-primary-foreground">
              Add to Contacts
            </div>
          </div>
        )}
      </Phone_>
    );
  }

  if (data.type === "wifi") {
    const w = data.wifi;
    return (
      <Phone_ label="Auto-connect prompt preview">
        {!w.ssid ? (
          <Empty text="Enter a network name to preview the auto-connect prompt." />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-5 pb-10">
            <div className="w-full rounded-2xl border border-border bg-card p-5 text-center shadow-lg">
              <Wifi className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 text-sm font-semibold text-foreground">Join “{w.ssid}”?</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {w.encryption === "nopass" ? "Open network" : `${w.encryption} secured`}
                {w.hidden ? " · hidden" : ""}
              </p>
              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                {w.password ? "•".repeat(Math.min(w.password.length, 12)) : "No password"}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold">
                <span className="rounded-lg border border-border py-2 text-muted-foreground">Cancel</span>
                <span className="rounded-lg bg-primary py-2 text-primary-foreground">Join</span>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-success">
              <Check className="h-3 w-3" /> Connects without typing the password
            </p>
          </div>
        )}
      </Phone_>
    );
  }

  if (data.type === "social") {
    const s = data.social;
    const links = s.links.filter((l) => l.url.trim());
    return (
      <Phone_ label="Instant link-in-bio page">
        {!s.handle && links.length === 0 ? (
          <Empty text="Add a handle and social links to preview your link-in-bio page." />
        ) : (
          <div className="px-5 pb-8">
            <div className="flex flex-col items-center pt-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
                {s.avatarDataUrl ? (
                  <img src={s.avatarDataUrl} alt="Profile avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-7 w-7 text-muted-foreground/60" strokeWidth={1.5} />
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">{s.handle || "@yourhandle"}</p>
              {s.tagline && <p className="mt-1 text-xs text-muted-foreground">{s.tagline}</p>}
            </div>
            <div className="mt-5 space-y-2">
              {links.map((l, i) => {
                const Icon = socialIcons[l.network] ?? Globe;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-3 py-2.5 text-xs font-medium text-foreground"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="flex-1 truncate capitalize">{l.network}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Phone_>
    );
  }

  if (data.type === "menu") {
    const m = data.menu;
    const items = m.items.filter((i) => i.name.trim());
    return (
      <Phone_ label="Digital menu preview">
        {!m.restaurant && items.length === 0 ? (
          <Empty text="Add your restaurant name and dishes to preview the menu." />
        ) : (
          <div className="px-5 pb-8">
            <div className="pt-4 text-center">
              <UtensilsCrossed className="mx-auto h-6 w-6 text-primary" />
              <p className="mt-2 text-sm font-semibold text-foreground">{m.restaurant || "Your Restaurant"}</p>
              {m.note && <p className="mt-1 text-xs text-muted-foreground">{m.note}</p>}
            </div>
            <div className="mt-5 space-y-2.5">
              {items.map((i, idx) => (
                <div key={idx} className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
                  <span className="text-xs font-medium text-foreground">{i.name}</span>
                  <span className="text-xs text-muted-foreground">{i.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Phone_>
    );
  }

  if (data.type === "pdf") {
    const p = data.pdf;
    return (
      <Phone_ label="Document open preview">
        {!p.url ? (
          <Empty text="Paste a document link to preview the download screen." />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-5 pb-10 text-center">
            <FileText className="h-10 w-10 text-primary" />
            <p className="mt-3 text-sm font-semibold text-foreground">{p.title || "Document.pdf"}</p>
            <p className="mt-1 max-w-[190px] truncate text-[11px] text-muted-foreground">{p.url}</p>
            <div className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground">Open document</div>
          </div>
        )}
      </Phone_>
    );
  }

  return (
    <Phone_ label="Destination preview">
      {!data.url ? (
        <Empty text="Paste a URL to preview where the scan lands." />
      ) : (
        <div className="flex h-full flex-col items-center justify-center px-5 pb-10 text-center">
          <Globe className="h-10 w-10 text-primary" />
          <p className="mt-3 max-w-[190px] break-words text-xs font-medium text-foreground">{data.url}</p>
          <div className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground">Open link</div>
        </div>
      )}
    </Phone_>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-xs text-foreground">{value}</p>
      </div>
    </div>
  );
}
