import { Mail, Phone, Github, Linkedin, Twitter, Instagram, ExternalLink, UserRound, Download, FileText } from "lucide-react";
import type { MicroPageButton, MicroPageSocials } from "@/hooks/useMicroPage";

export interface MicroCardData {
  fullName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  logoUrl?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  phone: string;
  email: string;
  accent: string;
  socials: MicroPageSocials;
  buttons: MicroPageButton[];
}

const socialMeta: { key: keyof MicroPageSocials; label: string; icon: typeof Github }[] = [
  { key: "github", label: "GitHub", icon: Github },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "twitter", label: "X / Twitter", icon: Twitter },
  { key: "instagram", label: "Instagram", icon: Instagram },
];

function normalizeUrl(url: string) {
  if (!url) return "#";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function buildVCard(data: MicroCardData) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${data.fullName}`,
    data.headline ? `TITLE:${data.headline}` : "",
    data.phone ? `TEL:${data.phone}` : "",
    data.email ? `EMAIL:${data.email}` : "",
    ...socialMeta
      .filter((s) => data.socials?.[s.key])
      .map((s) => `URL:${normalizeUrl(data.socials[s.key])}`),
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\n");
}

export default function MicroCardView({ data, compact = false }: { data: MicroCardData; compact?: boolean }) {
  const accent = data.accent || "#6366f1";
  const activeSocials = socialMeta.filter((s) => data.socials?.[s.key]?.trim());
  const activeButtons = (data.buttons || []).filter((b) => b.label?.trim() && b.url?.trim());

  const saveContact = () => {
    const blob = new Blob([buildVCard(data)], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${(data.fullName || "contact").replace(/\s+/g, "-").toLowerCase()}.vcf`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-card">
      <div className="h-24 w-full" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)` }} />
      <div className="px-5 pb-8 -mt-12">
        <div
          className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-card bg-muted flex items-center justify-center shadow-lg"
          style={{ boxShadow: `0 8px 24px ${accent}33` }}
        >
          {data.avatarUrl ? (
            <img src={data.avatarUrl} alt={`${data.fullName || "Profile"} photo`} className="w-full h-full object-cover" />
          ) : (
            <UserRound className="w-10 h-10 text-muted-foreground/50" strokeWidth={1.5} />
          )}
        </div>

        {data.logoUrl && (
          <img
            src={data.logoUrl}
            alt="Company logo"
            className="mt-4 h-8 w-auto max-w-[9rem] object-contain"
          />
        )}

        <h1 className={`${compact ? "text-xl" : "text-2xl"} font-bold text-foreground mt-4 tracking-tight`}>
          {data.fullName || "Your Name"}
        </h1>
        {data.headline && (
          <p className="text-sm font-medium mt-1" style={{ color: accent }}>
            {data.headline}
          </p>
        )}
        {data.bio && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{data.bio}</p>}

        {(data.phone || data.email) && (
          <div className="mt-5 space-y-2">
            {data.phone && (
              <a
                href={`tel:${data.phone}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <Phone className="w-4 h-4 shrink-0" style={{ color: accent }} />
                <span className="truncate">{data.phone}</span>
              </a>
            )}
            {data.email && (
              <a
                href={`mailto:${data.email}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <Mail className="w-4 h-4 shrink-0" style={{ color: accent }} />
                <span className="truncate">{data.email}</span>
              </a>
            )}
          </div>
        )}

        {activeButtons.length > 0 && (
          <div className="mt-4 space-y-2">
            {activeButtons.map((b, i) => (
              <a
                key={i}
                href={normalizeUrl(b.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: accent }}
              >
                <span className="truncate">{b.label}</span>
                <ExternalLink className="w-4 h-4 shrink-0 opacity-80" />
              </a>
            ))}
          </div>
        )}

        {data.attachmentUrl && (
          <a
            href={data.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors"
          >
            <FileText className="w-4 h-4 shrink-0" style={{ color: accent }} />
            <span className="truncate">{data.attachmentName || "View attached file"}</span>
          </a>
        )}

        {activeSocials.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {activeSocials.map(({ key, label, icon: Icon }) => (
              <a
                key={key}
                href={normalizeUrl(data.socials[key])}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="w-10 h-10 rounded-xl border border-border bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        )}

        <button
          onClick={saveContact}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
        >
          <Download className="w-4 h-4" />
          Save contact
        </button>
      </div>
    </div>
  );
}