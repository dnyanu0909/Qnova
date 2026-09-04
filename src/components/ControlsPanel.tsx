import { QRData, QROptions, templates, SocialLink, MenuItem } from "@/hooks/useQRGenerator";
import type { CornerStyle, DotStyle, FrameStyle } from "@/lib/qrRender";
import { fileToResizedDataUrl } from "@/lib/imageResize";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrandKitPanel from "@/components/BrandKitPanel";
import { Switch } from "@/components/ui/switch";
import { QrCode, Palette, Settings2, Trash2, Plus } from "lucide-react";

const dotStyles: { value: DotStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dots", label: "Dots" },
];

const cornerStyles: { value: CornerStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "circle", label: "Circle" },
];

const frames: { value: FrameStyle; label: string }[] = [
  { value: "none", label: "None" },
  { value: "card", label: "Card" },
  { value: "label", label: "Caption" },
];

const frameLabels = ["Scan Me", "Connect", "View Menu", "Free Wi-Fi"];

const networks = ["instagram", "linkedin", "youtube", "github"];

const inputClass = "micro-input";

interface ControlsPanelProps {
  data: QRData;
  options: QROptions;
  templateId: string;
  onUpdateData: <K extends keyof QRData>(key: K, value: QRData[K]) => void;
  onUpdateOptions: <K extends keyof QROptions>(key: K, value: QROptions[K]) => void;
  onApplyTemplate: (id: string) => void;
}

export default function ControlsPanel({
  data,
  options,
  templateId,
  onUpdateData,
  onUpdateOptions,
  onApplyTemplate,
}: ControlsPanelProps) {
  const setSocialLinks = (links: SocialLink[]) => onUpdateData("social", { ...data.social, links });
  const setMenuItems = (items: MenuItem[]) => onUpdateData("menu", { ...data.menu, items });

  return (
    <div className="glass-card p-4 sm:p-5 lg:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Inspector dock</h2>
        <span className="label-tech">QNOVA / CONFIG</span>
      </div>
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-full bg-secondary/60 p-0.5 h-9">
          <TabsTrigger
            value="content"
            className="gap-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-all active:scale-[0.98] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <QrCode className="w-3.5 h-3.5" /> Content
          </TabsTrigger>
          <TabsTrigger
            value="design"
            className="gap-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-all active:scale-[0.98] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Palette className="w-3.5 h-3.5" /> Design
          </TabsTrigger>
          <TabsTrigger
            value="export"
            className="gap-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-all active:scale-[0.98] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Settings2 className="w-3.5 h-3.5" /> Export
          </TabsTrigger>
        </TabsList>

        {/* CONTENT */}
        <TabsContent value="content" className="space-y-5 pt-6">
          {data.type === "url" && (
            <Field label="Destination URL">
              <input
                type="url"
                value={data.url}
                onChange={(e) => onUpdateData("url", e.target.value)}
                placeholder="https://example.com"
                className={inputClass}
              />
            </Field>
          )}

          {data.type === "pdf" && (
            <>
              <Field label="Document title">
                <input
                  value={data.pdf.title}
                  onChange={(e) => onUpdateData("pdf", { ...data.pdf, title: e.target.value })}
                  placeholder="Spring Catalogue 2026"
                  className={inputClass}
                />
              </Field>
              <Field label="Document link (PDF, Docs, Drive…)">
                <input
                  type="url"
                  value={data.pdf.url}
                  onChange={(e) => onUpdateData("pdf", { ...data.pdf, url: e.target.value })}
                  placeholder="https://files.example.com/catalogue.pdf"
                  className={inputClass}
                />
              </Field>
            </>
          )}

          {data.type === "wifi" && (
            <>
              <Field label="Network name (SSID)">
                <input
                  value={data.wifi.ssid}
                  onChange={(e) => onUpdateData("wifi", { ...data.wifi, ssid: e.target.value })}
                  placeholder="MyWiFiNetwork"
                  className={inputClass}
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  value={data.wifi.password}
                  onChange={(e) => onUpdateData("wifi", { ...data.wifi, password: e.target.value })}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </Field>
              <Field label="Security type">
                <select
                  value={data.wifi.encryption}
                  onChange={(e) =>
                    onUpdateData("wifi", { ...data.wifi, encryption: e.target.value as "WPA" | "WEP" | "nopass" })
                  }
                  className={inputClass}
                >
                  <option value="WPA">WPA/WPA2/WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Open (no password)</option>
                </select>
              </Field>
              <ToggleRow
                label="Hidden network"
                description="Enable if the SSID is not broadcast."
                checked={data.wifi.hidden}
                onChange={(v) => onUpdateData("wifi", { ...data.wifi, hidden: v })}
              />
            </>
          )}

          {data.type === "contact" && (
            <>
              <Field label="Full name">
                <input
                  value={data.contact.name}
                  onChange={(e) => onUpdateData("contact", { ...data.contact, name: e.target.value })}
                  placeholder="John Doe"
                  className={inputClass}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Work title">
                  <input
                    value={data.contact.title}
                    onChange={(e) => onUpdateData("contact", { ...data.contact, title: e.target.value })}
                    placeholder="Head of Design"
                    className={inputClass}
                  />
                </Field>
                <Field label="Company">
                  <input
                    value={data.contact.company}
                    onChange={(e) => onUpdateData("contact", { ...data.contact, company: e.target.value })}
                    placeholder="Acme Inc."
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Phone">
                  <input
                    type="tel"
                    value={data.contact.phone}
                    onChange={(e) => onUpdateData("contact", { ...data.contact, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                    className={inputClass}
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={data.contact.email}
                    onChange={(e) => onUpdateData("contact", { ...data.contact, email: e.target.value })}
                    placeholder="john@example.com"
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Address">
                <input
                  value={data.contact.address}
                  onChange={(e) => onUpdateData("contact", { ...data.contact, address: e.target.value })}
                  placeholder="221B Baker Street, London"
                  className={inputClass}
                />
              </Field>
              <AvatarField
                value={data.contact.avatarDataUrl}
                onChange={(v) => onUpdateData("contact", { ...data.contact, avatarDataUrl: v })}
                label="Avatar (shown in the live preview)"
              />
            </>
          )}

          {data.type === "social" && (
            <>
              <Field label="Handle or name">
                <input
                  value={data.social.handle}
                  onChange={(e) => onUpdateData("social", { ...data.social, handle: e.target.value })}
                  placeholder="@yourhandle"
                  className={inputClass}
                />
              </Field>
              <Field label="Tagline">
                <input
                  value={data.social.tagline}
                  onChange={(e) => onUpdateData("social", { ...data.social, tagline: e.target.value })}
                  placeholder="Designer · Berlin"
                  className={inputClass}
                />
              </Field>
              <AvatarField
                value={data.social.avatarDataUrl}
                onChange={(v) => onUpdateData("social", { ...data.social, avatarDataUrl: v })}
                label="Avatar"
              />
              <Field label="Social links">
                <div className="space-y-2">
                  {data.social.links.map((link, i) => (
                    <div key={i} className="flex gap-2">
                      <select
                        value={link.network}
                        onChange={(e) =>
                          setSocialLinks(data.social.links.map((l, j) => (j === i ? { ...l, network: e.target.value } : l)))
                        }
                        className={`${inputClass} w-32 shrink-0 capitalize`}
                      >
                        {networks.map((n) => (
                          <option key={n} value={n} className="capitalize">
                            {n}
                          </option>
                        ))}
                      </select>
                      <input
                        value={link.url}
                        onChange={(e) =>
                          setSocialLinks(data.social.links.map((l, j) => (j === i ? { ...l, url: e.target.value } : l)))
                        }
                        placeholder="https://instagram.com/you"
                        className={inputClass}
                      />
                      <button
                        onClick={() => setSocialLinks(data.social.links.filter((_, j) => j !== i))}
                        aria-label="Remove link"
                        className="shrink-0 w-11 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setSocialLinks([...data.social.links, { network: "instagram", url: "" }])}
                    className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors w-full justify-center"
                  >
                    <Plus className="w-4 h-4" /> Add link
                  </button>
                  <p className="text-xs text-muted-foreground">
                    The QR opens your first link. Publish a full link-in-bio page from the Digital Card studio for multi-link hosting.
                  </p>
                </div>
              </Field>
            </>
          )}

          {data.type === "menu" && (
            <>
              <Field label="Restaurant name">
                <input
                  value={data.menu.restaurant}
                  onChange={(e) => onUpdateData("menu", { ...data.menu, restaurant: e.target.value })}
                  placeholder="Trattoria Nova"
                  className={inputClass}
                />
              </Field>
              <Field label="Menu link">
                <input
                  type="url"
                  value={data.menu.url}
                  onChange={(e) => onUpdateData("menu", { ...data.menu, url: e.target.value })}
                  placeholder="https://example.com/menu"
                  className={inputClass}
                />
              </Field>
              <Field label="Note">
                <input
                  value={data.menu.note}
                  onChange={(e) => onUpdateData("menu", { ...data.menu, note: e.target.value })}
                  placeholder="Kitchen open until 23:00"
                  className={inputClass}
                />
              </Field>
              <Field label="Highlighted dishes">
                <div className="space-y-2">
                  {data.menu.items.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={item.name}
                        onChange={(e) => setMenuItems(data.menu.items.map((m, j) => (j === i ? { ...m, name: e.target.value } : m)))}
                        placeholder="Tagliatelle al ragù"
                        className={inputClass}
                      />
                      <input
                        value={item.price}
                        onChange={(e) => setMenuItems(data.menu.items.map((m, j) => (j === i ? { ...m, price: e.target.value } : m)))}
                        placeholder="€14"
                        className={`${inputClass} w-24 shrink-0`}
                      />
                      <button
                        onClick={() => setMenuItems(data.menu.items.filter((_, j) => j !== i))}
                        aria-label="Remove dish"
                        className="shrink-0 w-11 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setMenuItems([...data.menu.items, { name: "", price: "" }])}
                    className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors w-full justify-center"
                  >
                    <Plus className="w-4 h-4" /> Add dish
                  </button>
                </div>
              </Field>
            </>
          )}
        </TabsContent>

        {/* DESIGN */}
        <TabsContent value="design" className="space-y-6 pt-6">
          <BrandKitPanel
            options={options}
            onApply={(patch) =>
              (Object.entries(patch) as [keyof QROptions, QROptions[keyof QROptions]][]).forEach(([k, v]) =>
                onUpdateOptions(k, v as never),
              )
            }
          />

          <Field label="Preset templates">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onApplyTemplate(t.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-xs font-medium transition-all ${
                    templateId === t.id
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <span className="flex -space-x-1.5">
                    {t.swatch.map((c) => (
                      <span key={c} className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: c }} />
                    ))}
                  </span>
                  {t.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <ColorField label="Foreground" value={options.fgColor} onChange={(v) => onUpdateOptions("fgColor", v)} />
            <ColorField label="Background" value={options.bgColor} onChange={(v) => onUpdateOptions("bgColor", v)} />
            <ColorField label="Corner eyes" value={options.eyeColor} onChange={(v) => onUpdateOptions("eyeColor", v)} />
          </div>

          <ToggleRow
            label="Gradient fill"
            description="Blend the foreground into a second colour."
            checked={options.gradientTo !== null}
            onChange={(v) => onUpdateOptions("gradientTo", v ? "#ec4899" : null)}
          />
          {options.gradientTo !== null && (
            <ColorField label="Gradient end" value={options.gradientTo} onChange={(v) => onUpdateOptions("gradientTo", v)} />
          )}

          <SegmentField label="Dot style" value={options.dotStyle} items={dotStyles} onChange={(v) => onUpdateOptions("dotStyle", v)} />
          <SegmentField
            label="Corner style"
            value={options.cornerStyle}
            items={cornerStyles}
            onChange={(v) => onUpdateOptions("cornerStyle", v)}
          />
          <SegmentField label="Frame shape" value={options.frame} items={frames} onChange={(v) => onUpdateOptions("frame", v)} />
          {options.frame === "label" && (
            <Field label="Frame caption">
              <div className="flex flex-wrap gap-2 mb-2">
                {frameLabels.map((l) => (
                  <button
                    key={l}
                    onClick={() => onUpdateOptions("frameLabel", l)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      options.frameLabel === l
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <input
                value={options.frameLabel}
                onChange={(e) => onUpdateOptions("frameLabel", e.target.value)}
                placeholder="Scan Me"
                className={inputClass}
              />
            </Field>
          )}

          <Field label="Center logo">
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpdateOptions("logoDataUrl", await fileToResizedDataUrl(file, 256));
                }}
                className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-foreground hover:file:opacity-90 file:cursor-pointer"
              />
              {options.logoDataUrl && (
                <button
                  onClick={() => onUpdateOptions("logoDataUrl", null)}
                  aria-label="Remove logo"
                  className="shrink-0 w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </Field>
          <ToggleRow
            label="White backing behind logo"
            description="Improves scannability when a logo overlaps the code."
            checked={options.logoWhiteBg}
            onChange={(v) => onUpdateOptions("logoWhiteBg", v)}
          />
        </TabsContent>

        {/* EXPORT */}
        <TabsContent value="export" className="space-y-6 pt-6">
          <Field label={`Export size: ${options.size}px`}>
            <input
              type="range"
              min={256}
              max={2048}
              step={64}
              value={options.size}
              onChange={(e) => onUpdateOptions("size", Number(e.target.value))}
              disabled={options.highRes}
              className="w-full accent-primary disabled:opacity-40"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span className="metric">256px</span>
              <span className="metric">2048px</span>
            </div>
          </Field>

          <ToggleRow
            label="High-res print (300 DPI)"
            description="Exports at 2480px — A4-ready at 300 DPI."
            checked={options.highRes}
            onChange={(v) => onUpdateOptions("highRes", v)}
          />

          <p className="text-xs text-muted-foreground leading-relaxed">
            SVG exports are resolution independent and always print sharp. PNG uses the size above.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AvatarField({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        {value && <img src={value} alt="Avatar preview" className="w-10 h-10 rounded-full object-cover border border-border" />}
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) onChange(await fileToResizedDataUrl(file, 320));
          }}
          className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-foreground hover:file:opacity-90 file:cursor-pointer"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            aria-label="Remove avatar"
            className="shrink-0 w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="label-tech block">{label}</label>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2 rounded-md border border-input bg-background/60 px-2 py-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded-md border border-input cursor-pointer p-0.5 bg-transparent"
        />
        <span className="metric text-[10px] text-muted-foreground truncate">{value.toUpperCase()}</span>
      </div>
    </div>
  );
}

function SegmentField<T extends string>({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: T;
  items: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <Field label={label}>
      <div className="inline-flex w-full rounded-full border border-border bg-secondary/50 p-0.5">
        {items.map((i) => (
          <button
            key={i.value}
            onClick={() => onChange(i.value)}
            className={`flex-1 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-all active:scale-[0.98] ${
              value === i.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {i.label}
          </button>
        ))}
      </div>
    </Field>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-border bg-background/40 px-3 py-2.5">
      <div className="space-y-0.5">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
