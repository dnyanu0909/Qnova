import { ArrowDown, ShieldCheck } from "lucide-react";
import QuickStart from "@/components/landing/QuickStart";

export default function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" /> No paywalls · no expiry · instant exports
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
          Smart, Branded &amp; Dynamic QR Codes That Never Expire
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground lg:text-lg">
          Design scan-proof codes with your brand colours, logo and frames — then track every scan and export
          print-ready vectors. Create and download in under 10 seconds.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={onStart}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-opacity hover:opacity-90"
          >
            Open the studio <ArrowDown className="h-4 w-4" />
          </button>
          <a
            href="#templates"
            className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Browse templates
          </a>
        </div>
      </div>
      <div className="flex justify-center lg:justify-end">
        <QuickStart />
      </div>
    </section>
  );
}