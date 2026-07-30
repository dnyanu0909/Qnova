import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import type { ScannabilityResult } from "@/lib/scannability";

export default function ScannabilityMeter({ result }: { result: ScannabilityResult }) {
  const tone =
    result.level === "poor"
      ? { bar: "bg-destructive", text: "text-destructive", Icon: ShieldX }
      : result.level === "fair"
        ? { bar: "bg-warning", text: "text-warning", Icon: ShieldAlert }
        : { bar: "bg-success", text: "text-success", Icon: ShieldCheck };

  return (
    <div className="w-full space-y-2 rounded-xl border border-border bg-secondary/30 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <tone.Icon className={`h-4 w-4 ${tone.text}`} />
          Scannability shield
        </span>
        <span className={`text-sm font-semibold tabular-nums ${tone.text}`}>{result.score}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={result.score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Scannability score"
      >
        <div className={`h-full rounded-full transition-all duration-300 ${tone.bar}`} style={{ width: `${result.score}%` }} />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {result.message} <span className="font-mono">({result.ratio.toFixed(1)}:1 contrast)</span>
      </p>
    </div>
  );
}
