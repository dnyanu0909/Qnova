import type { QRType } from "@/hooks/useQRGenerator";
import { Globe, Contact, Wifi, FileText, Share2, UtensilsCrossed } from "lucide-react";

export const presets: { value: QRType; label: string; hint: string; icon: typeof Globe }[] = [
  { value: "url", label: "Website URL", hint: "Any link", icon: Globe },
  { value: "contact", label: "vCard / Contact", hint: "Digital card", icon: Contact },
  { value: "wifi", label: "Wi-Fi Network", hint: "Auto-connect", icon: Wifi },
  { value: "pdf", label: "PDF / Document", hint: "Hosted file", icon: FileText },
  { value: "social", label: "Social Links", hint: "Link-in-bio", icon: Share2 },
  { value: "menu", label: "Restaurant Menu", hint: "Digital menu", icon: UtensilsCrossed },
];

export default function PresetBar({ value, onChange }: { value: QRType; onChange: (v: QRType) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
      {presets.map((p) => {
        const active = value === p.value;
        return (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            aria-pressed={active}
            className={`flex flex-col items-start gap-2 rounded-xl border p-3 sm:p-4 text-left transition-all duration-200 ${
              active
                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                : "border-border bg-card hover:border-primary/40 hover:-translate-y-0.5"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              <p.icon className="h-4 w-4" />
            </span>
            <span className="space-y-0.5">
              <span className={`block text-xs font-semibold leading-tight ${active ? "text-primary" : "text-foreground"}`}>
                {p.label}
              </span>
              <span className="block text-[11px] text-muted-foreground">{p.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
