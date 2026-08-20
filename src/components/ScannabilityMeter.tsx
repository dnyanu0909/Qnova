import { ShieldCheck, ShieldAlert, ShieldX, TriangleAlert, BadgeCheck } from "lucide-react";
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

      <div className="space-y-2 border-t border-border pt-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-foreground">ISO 15415 symbol contrast</span>
          <span
            className={`flex items-center gap-1.5 text-xs font-semibold tabular-nums ${
              result.isoPass ? "text-success" : "text-destructive"
            }`}
          >
            {result.isoPass ? <BadgeCheck className="h-3.5 w-3.5" /> : <TriangleAlert className="h-3.5 w-3.5" />}
            {result.isoContrast}% · grade {result.isoGrade}
          </span>
        </div>

        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className={`h-full rounded-full transition-all duration-300 ${result.isoPass ? "bg-success" : "bg-destructive"}`}
            style={{ width: `${Math.min(100, result.isoContrast)}%` }}
          />
          {/* 40% ISO grade-C pass threshold */}
          <span className="absolute inset-y-0 left-[40%] w-px bg-foreground/50" aria-hidden />
        </div>

        {result.isoIssues.length > 0 ? (
          <ul
            role="alert"
            className={`space-y-1.5 rounded-lg border px-3 py-2 text-xs leading-relaxed ${
              result.isoPass
                ? "border-warning/30 bg-warning/10 text-warning"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {result.isoIssues.map((issue) => (
              <li key={issue} className="flex gap-1.5">
                <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            Passes the ISO grade-C threshold (40% minimum) with room to spare.
          </p>
        )}
      </div>
    </div>
  );
}
