import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, LinkIcon, TriangleAlert } from "lucide-react";
import { logScan, resolveLink } from "@/lib/dynamicLinks";

export default function Redirect() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [state, setState] = useState<"loading" | "error">("loading");
  const [destination, setDestination] = useState("");
  const done = useRef(false);

  useEffect(() => {
    if (!shortCode || done.current) return;
    done.current = true;
    (async () => {
      try {
        const link = await resolveLink(shortCode);
        if (!link) {
          setState("error");
          return;
        }
        setDestination(link.destination_url);
        await logScan(link.id);
        window.location.replace(link.destination_url);
      } catch {
        setState("error");
      }
    })();
  }, [shortCode]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 text-center">
      {state === "loading" ? (
        <div className="space-y-3">
          <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Taking you there…</h1>
          {destination && (
            <a href={destination} className="text-sm text-primary underline break-all">
              {destination}
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-3 max-w-sm">
          <TriangleAlert className="w-7 h-7 mx-auto text-destructive" />
          <h1 className="text-lg font-semibold text-foreground">This link is unavailable</h1>
          <p className="text-sm text-muted-foreground">
            The QR campaign may be paused, expired or removed by its owner.
          </p>
          <a href="/" className="inline-flex items-center gap-2 text-sm text-primary">
            <LinkIcon className="w-3.5 h-3.5" /> Back to QNova
          </a>
        </div>
      )}
    </main>
  );
}