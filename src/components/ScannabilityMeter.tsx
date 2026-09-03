import { ShieldCheck, ShieldAlert, ShieldX, TriangleAlert, BadgeCheck, Activity } from "lucide-react";
import type { ScannabilityResult } from "@/lib/scannability";

export default function ScannabilityMeter({ result }: { result: ScannabilityResult }) {
  const tone =
    result.level === "poor"
      ? { bar: "bg-destructive", text: "text-destructive", ring: "border-destructive/40 bg-destructive/10", Icon: ShieldX, tag: "FAIL" }
      : result.level === "fair"
        ? { bar: "bg-warning", text: "text-warning", ring: "border-warning/40 bg-warning/10", Icon: ShieldAlert, tag: "WARN" }
        : { bar: "bg-success", text: "text-success", ring: "border-success/40 bg-success/10", Icon: ShieldCheck, tag: "PASS" };

  return (
    <div className="w-full space-y-3 rounded-lg border border-border bg-background/40 px-3.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wide">
          <tone.Icon className={`h-3.5 w-3.5 ${tone.text}`} />
          Scannability shield
        </span>
        <span className={`metric rounded-full border px-2 py-0.5 text-[10px] font-bold ${tone.ring} ${tone.text}`}>
          {result.score}% {tone.tag}
        </span>
      </div>

      {/* Oscilloscope diagnostic strip */}
      <div
        className="relative h-9 w-full overflow-hidden rounded-md border border-border bg-card scope-strip"
        role="progressbar"
        aria-valuenow={result.score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Scannability score"
      >
        <div
          className={`absolute inset-y-0 left-0 opacity-25 transition-all duration-300 ${tone.bar}`}
          style={{ width: `${result.score}%` }}
        />
        <svg
          className={`absolute inset-0 h-full w-full ${tone.text}`}
          viewBox="0 0 100 36"
          preserveAspectRatio="none"
          aria-hidden
        >
          <polyline
            points={trace(result.score)}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span
          className={`absolute inset-y-0 w-px bg-current transition-all duration-300 ${tone.text}`}
          style={{ left: `${result.score}%` }}
          aria-hidden
        />
        <span className="absolute bottom-0.5 left-1.5 metric text-[8px] tracking-wide text-muted-foreground">
          <Activity className="mr-1 inline h-2.5 w-2.5" />
          CONTRAST {result.ratio.toFixed(1)}:1
        </span>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">{result.message}</p>

      <div className="space-y-2 border-t border-border pt-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide">ISO 15415 contrast</span>
          <span
            className={`metric flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              result.isoPass ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive"
            }`}
          >
            {result.isoPass ? <BadgeCheck className="h-3 w-3" /> : <TriangleAlert className="h-3 w-3" />}
            {result.isoContrast}% · {result.isoGrade}
          </span>
        </div>

        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className={`h-full rounded-full transition-all duration-300 ${result.isoPass ? "bg-success" : "bg-destructive"}`}
            style={{ width: `${Math.min(100, result.isoContrast)}%` }}
          />
          {/* 40% ISO grade-C pass threshold */}
          <span className="absolute inset-y-0 left-[40%] w-px bg-foreground/60" aria-hidden />
        </div>

        {result.isoIssues.length > 0 ? (
          <ul
            role="alert"
            className={`space-y-1.5 rounded-md border px-2.5 py-2 text-[11px] leading-relaxed ${
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
          <p className="metric text-[9px] tracking-wide text-muted-foreground">
            GRADE-C THRESHOLD (40% MIN) CLEARED
          </p>
        )}
      </div>
    </div>
  );
}

/** Builds a deterministic oscilloscope waveform whose amplitude tracks the score. */
function trace(score: number) {
  const amp = 2 + (score / 100) * 12;
  const pts: string[] = [];
  for (let x = 0; x <= 100; x += 2) {
    const y = 18 - Math.sin((x / 100) * Math.PI * 6) * amp * (0.6 + 0.4 * Math.cos(x / 14));
    pts.push(`${x},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}
