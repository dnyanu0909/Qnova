import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Archive,
  Copy,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Printer,
  QrCode,
  ScanLine,
  Trash2,
  Users,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import EditLinkModal from "@/components/dashboard/EditLinkModal";
import PrintExportDrawer from "@/components/dashboard/PrintExportDrawer";
import {
  createLink,
  deleteLink,
  listLeads,
  listLinks,
  listScans,
  shortUrl,
  updateLink,
  type DynamicLink,
  type LinkLead,
  type ScanEvent,
} from "@/lib/dynamicLinks";

const PALETTE = ["hsl(var(--primary))", "#ec4899", "#22c55e", "#f59e0b", "#38bdf8", "#a855f7"];

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [links, setLinks] = useState<DynamicLink[]>([]);
  const [scans, setScans] = useState<ScanEvent[]>([]);
  const [busy, setBusy] = useState(true);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<DynamicLink | null>(null);
  const [printing, setPrinting] = useState<DynamicLink | null>(null);
  const [leads, setLeads] = useState<LinkLead[]>([]);
  const [tab, setTab] = useState<"campaigns" | "leads">("campaigns");

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const rows = await listLinks();
        setLinks(rows);
        const ids = rows.map((r) => r.id);
        setScans(await listScans(ids));
        setLeads(await listLeads(ids));
      } catch {
        toast.error("Could not load your campaigns.");
      } finally {
        setBusy(false);
      }
    })();
  }, [user]);


  const scansByLink = useMemo(() => {
    const map = new Map<string, ScanEvent[]>();
    scans.forEach((s) => {
      const list = map.get(s.link_id) ?? [];
      list.push(s);
      map.set(s.link_id, list);
    });
    return map;
  }, [scans]);

  const timeline = useMemo(() => {
    const days: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    const totals = new Map<string, number>();
    const uniques = new Map<string, Set<string>>();
    scans.forEach((s) => {
      const key = dayKey(s.created_at);
      totals.set(key, (totals.get(key) ?? 0) + 1);
      const set = uniques.get(key) ?? new Set<string>();
      set.add(s.visitor_key ?? s.id);
      uniques.set(key, set);
    });
    return days.map((d) => ({
      day: d.slice(5),
      total: totals.get(d) ?? 0,
      unique: uniques.get(d)?.size ?? 0,
    }));
  }, [scans]);

  const devices = useMemo(() => {
    const counts = new Map<string, number>();
    scans.forEach((s) => {
      const key = s.device_type || "Unknown";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return Array.from(counts, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [scans]);

  const geos = useMemo(() => {
    const counts = new Map<string, number>();
    scans.forEach((s) => {
      const key = s.country || "Unknown";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return Array.from(counts, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [scans]);

  const uniqueTotal = useMemo(() => new Set(scans.map((s) => s.visitor_key ?? s.id)).size, [scans]);

  const last30 = useMemo(() => {
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    const totals = new Map<string, number>();
    scans.forEach((s) => {
      const key = dayKey(s.created_at);
      totals.set(key, (totals.get(key) ?? 0) + 1);
    });
    return days.map((d) => ({ day: d.slice(5), scans: totals.get(d) ?? 0 }));
  }, [scans]);

  const last30Total = useMemo(() => last30.reduce((sum, d) => sum + d.scans, 0), [last30]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !destination.trim()) return;
    setCreating(true);
    try {
      const link = await createLink({ userId: user.id, title, destinationUrl: destination });
      setLinks((prev) => [link, ...prev]);
      setTitle("");
      setDestination("");
      toast.success("Tracked QR campaign created.");
    } catch {
      toast.error("Could not create the campaign.");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (link: DynamicLink, next: boolean) => {
    setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, is_active: next } : l)));
    try {
      await updateLink(link.id, { is_active: next });
    } catch {
      setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, is_active: link.is_active } : l)));
      toast.error("Could not update the campaign.");
    }
  };

  const remove = async (link: DynamicLink) => {
    try {
      await deleteLink(link.id);
      setLinks((prev) => prev.filter((l) => l.id !== link.id));
      setScans((prev) => prev.filter((s) => s.link_id !== link.id));
      toast.success("Campaign deleted.");
    } catch {
      toast.error("Could not delete the campaign.");
    }
  };

  if (loading || (busy && user)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <QrCode className="w-4 h-4 text-primary-foreground" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">QNova</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs font-medium text-muted-foreground hover:text-foreground">
              QR studio
            </Link>
            <button
              onClick={async () => {
                await signOut();
                navigate("/auth", { replace: true });
              }}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Campaign dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Dynamic QR links you can re-point any time — with live scan analytics and print-ready assets.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total scans", value: scans.length, icon: ScanLine },
            { label: "Unique visitors", value: uniqueTotal, icon: ScanLine },
            { label: "Active campaigns", value: links.filter((l) => l.is_active).length, icon: QrCode },
            { label: "All campaigns", value: links.length, icon: Archive },
          ].map((s) => (
            <div key={s.label} className="glass-card p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        <form onSubmit={create} className="glass-card p-5 sm:p-6 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] items-end">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Campaign name</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summer menu table tents"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Destination URL</span>
            <input
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="https://example.com/menu"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <button
            type="submit"
            disabled={creating}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
          </button>
        </form>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="glass-card p-5 sm:p-6 lg:col-span-2">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">Scans over the last 30 days</h2>
              <p className="text-xs text-muted-foreground">{last30Total} scans total</p>
            </div>
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last30}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={2} />
                  <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="scans" name="Scans" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-foreground">Total vs unique scans (14 days)</h2>
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="unique" name="Unique" stroke="#ec4899" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-foreground">Top devices</h2>
            <div className="h-64 mt-4">
              {devices.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={devices} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                      {devices.map((d, i) => (
                        <Cell key={d.name} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No scans recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Top geographies</h2>
          <div className="h-56 mt-4">
            {geos.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={geos}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" name="Scans" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Locations appear once your codes get scanned.</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: "campaigns" as const, label: "Active campaigns", icon: QrCode },
            { id: "leads" as const, label: `Captured leads (${leads.length})`, icon: Users },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                tab === t.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <div className={tab === "campaigns" ? "glass-card p-5 sm:p-6 space-y-4" : "hidden"}>
          <h2 className="text-sm font-semibold text-foreground">Active campaigns</h2>

          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground">Create your first tracked campaign above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Title</th>
                    <th className="py-2 pr-4 font-medium">Short URL</th>
                    <th className="py-2 pr-4 font-medium">Target URL</th>
                    <th className="py-2 pr-4 font-medium">Total scans</th>
                    <th className="py-2 pr-4 font-medium">Expires</th>
                    <th className="py-2 pr-4 font-medium">Active</th>
                    <th className="py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => {
                    const rows = scansByLink.get(link.id) ?? [];
                    return (
                      <tr key={link.id} className="border-t border-border">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-foreground">{link.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(link.created_at).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="py-3 pr-4">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(shortUrl(link.short_code));
                              toast.success("Short link copied.");
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-primary"
                          >
                            /r/{link.short_code} <Copy className="w-3 h-3" />
                          </button>
                        </td>
                        <td className="py-3 pr-4">
                          <a
                            href={link.destination_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline block truncate max-w-[14rem]"
                          >
                            {link.destination_url}
                          </a>
                        </td>
                        <td className="py-3 pr-4 text-foreground">
                          {rows.length}
                          <span className="text-xs text-muted-foreground">
                            {" "}/ {new Set(rows.map((r) => r.visitor_key ?? r.id)).size} uniq
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground">
                          {link.expires_at ? new Date(link.expires_at).toLocaleDateString() : "Never"}
                        </td>
                        <td className="py-3 pr-4">
                          <Switch checked={link.is_active} onCheckedChange={(v) => toggleActive(link, v)} />
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditing(link)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-secondary"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit target
                            </button>
                            <button
                              onClick={() => setPrinting(link)}
                              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                              aria-label="Download print asset"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => remove(link)}
                              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-secondary"
                              aria-label="Delete campaign"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className={tab === "leads" ? "glass-card p-5 sm:p-6 space-y-4" : "hidden"}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Captured leads</h2>
            <button
              onClick={downloadLeadsCsv}
              disabled={leads.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV
            </button>
          </div>
          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Turn on the email lead gate on a campaign — every visitor who unlocks it lands here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Campaign</th>
                    <th className="py-2 pr-4 font-medium">Device</th>
                    <th className="py-2 font-medium">Captured</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-t border-border">
                      <td className="py-3 pr-4 text-foreground">{lead.name || "—"}</td>
                      <td className="py-3 pr-4 text-foreground">{lead.email}</td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {links.find((l) => l.id === lead.link_id)?.title ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">{lead.device_type || "—"}</td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {new Date(lead.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>


      <EditLinkModal
        link={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSaved={(saved) => setLinks((prev) => prev.map((l) => (l.id === saved.id ? saved : l)))}
      />
      <PrintExportDrawer link={printing} onOpenChange={(open) => !open && setPrinting(null)} />
    </div>
  );
}