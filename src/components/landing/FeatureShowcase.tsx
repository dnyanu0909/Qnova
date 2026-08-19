import { Infinity as InfinityIcon, Link2, LineChart, FileCode2 } from "lucide-react";
import { Check, X } from "lucide-react";

const features = [
  {
    icon: InfinityIcon,
    title: "Truly Permanent Static Codes",
    body: "Static codes encode your data directly — they keep working forever, with no account or subscription.",
  },
  {
    icon: Link2,
    title: "Dynamic Editable Links",
    body: "Re-point a printed code to a new destination any time without reprinting the matrix.",
  },
  {
    icon: LineChart,
    title: "Real-Time Scan Analytics",
    body: "See total and unique scans, devices, browsers and estimated geography as they happen.",
  },
  {
    icon: FileCode2,
    title: "Vector Print-Ready (SVG/PDF)",
    body: "Export crisp SVG, 300 DPI PNG and print PDFs with bleed lines and crop marks.",
  },
];

const rows: { label: string; qnova: string; others: string; othersOk?: boolean }[] = [
  { label: "Free downloads without sign-up", qnova: "Always", others: "Watermark or paywall" },
  { label: "Codes stop working after trial", qnova: "Never", others: "Common" },
  { label: "SVG / PDF vector export", qnova: "Included", others: "Paid upgrade" },
  { label: "Scan analytics", qnova: "Included", others: "Paid tier" },
  { label: "Batch CSV generation", qnova: "Included", others: "Enterprise only" },
  { label: "Brand kit + logo overlay", qnova: "Included", others: "Limited" },
];

export default function FeatureShowcase() {
  return (
    <section className="space-y-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <f.icon className="h-4.5 w-4.5" />
            </span>
            <h3 className="mt-3 text-sm font-semibold text-foreground">{f.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-border bg-secondary/50 px-4 py-3 text-xs font-semibold text-muted-foreground sm:px-6">
          <span>Feature</span>
          <span className="text-center text-primary">QNova</span>
          <span className="text-center">Traditional generators</span>
        </div>
        {rows.map((r) => (
          <div
            key={r.label}
            className="grid grid-cols-[1.4fr_1fr_1fr] items-center border-b border-border px-4 py-3 text-xs last:border-0 sm:px-6 sm:text-sm"
          >
            <span className="pr-3 text-foreground">{r.label}</span>
            <span className="flex items-center justify-center gap-1.5 font-medium text-primary">
              <Check className="h-3.5 w-3.5" /> {r.qnova}
            </span>
            <span className="flex items-center justify-center gap-1.5 text-muted-foreground">
              <X className="h-3.5 w-3.5" /> {r.others}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}