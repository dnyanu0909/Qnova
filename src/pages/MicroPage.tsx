import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MicroCardView, { MicroCardData } from "@/components/microcard/MicroCardView";
import { QrCode } from "lucide-react";

export default function MicroPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<MicroCardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: row } = await supabase
        .from("micro_pages")
        .select("*")
        .eq("slug", slug ?? "")
        .maybeSingle();
      if (cancelled) return;
      if (row) {
        setData({
          fullName: row.full_name,
          headline: row.headline ?? "",
          bio: row.bio ?? "",
          avatarUrl: row.avatar_url ?? "",
          phone: row.phone ?? "",
          email: row.email ?? "",
          accent: row.accent,
          socials: (row.socials ?? {}) as MicroCardData["socials"],
          buttons: (row.buttons ?? []) as MicroCardData["buttons"],
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (data) {
      document.title = `${data.fullName} — Digital Card`;
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute("content", data.headline || `Contact details and links for ${data.fullName}.`);
    }
  }, [data]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : data ? (
        <>
          <main className="w-full max-w-sm rounded-3xl overflow-hidden border border-border shadow-xl bg-card">
            <MicroCardView data={data} />
          </main>
          <Link
            to="/"
            className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            Made with QNova
          </Link>
        </>
      ) : (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Card not found</h1>
          <p className="mt-2 text-muted-foreground text-sm">This digital card doesn’t exist or was removed.</p>
          <Link to="/" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
            Create your own
          </Link>
        </div>
      )}
    </div>
  );
}