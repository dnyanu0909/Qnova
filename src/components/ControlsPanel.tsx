import { QRData, QROptions, QRType, templates } from "@/hooks/useQRGenerator";
import type { CornerStyle, DotStyle, FrameStyle } from "@/lib/qrRender";
import { fileToResizedDataUrl } from "@/lib/imageResize";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { QrCode, Globe, Wifi, Contact, Palette, Type, Settings2, Trash2 } from "lucide-react";

const qrTypes: { value: QRType; label: string; icon: React.ReactNode }[] = [
  { value: "url", label: "URL", icon: <Globe className="w-4 h-4" /> },
  { value: "contact", label: "vCard", icon: <Contact className="w-4 h-4" /> },
  { value: "text", label: "Text", icon: <Type className="w-4 h-4" /> },
  { value: "wifi", label: "Wi-Fi", icon: <Wifi className="w-4 h-4" /> },
];

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

const inputClass =
  "w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground input-focus";

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
  return (
    <div className="glass-card p-5 sm:p-6 lg:p-8">
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content" className="gap-1.5 text-xs sm:text-sm">
            <QrCode className="w-3.5 h-3.5" /> Content
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-1.5 text-xs sm:text-sm">
            <Palette className="w-3.5 h-3.5" /> Design
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-1.5 text-xs sm:text-sm">
            <Settings2 className="w-3.5 h-3.5" /> Export
          </TabsTrigger>
        </TabsList>

        {/* CONTENT */}
        <TabsContent value="content" className="space-y-5 pt-6">
          <div className="grid grid-cols-4 gap-2">
            {qrTypes.map((t) => (
              <button
                key={t.value}
                onClick={() => onUpdateData("type", t.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all duration-200 ${
                  data.type === t.value
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

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

          {data.type === "text" && (
            <Field label="Text content">
              <textarea
                value={data.text}
                onChange={(e) => onUpdateData("text", e.target.value)}
                placeholder="Enter your text here..."
                rows={4}
                className={`${inputClass} resize-none`}
              />
            </Field>
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
              <Field label="Encryption">
                <select
                  value={data.wifi.encryption}
                  onChange={(e) =>
                    onUpdateData("wifi", { ...data.wifi, encryption: e.target.value as "WPA" | "WEP" | "nopass" })
                  }
                  className={inputClass}
                >
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">None</option>
                </select>
              </Field>
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
            </>
          )}
        </TabsContent>

        {/* DESIGN */}
        <TabsContent value="design" className="space-y-6 pt-6">
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
                      <span
                        key={c}
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: c }}
                      />
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
            <ColorField
              label="Gradient end"
              value={options.gradientTo}
              onChange={(v) => onUpdateOptions("gradientTo", v)}
            />
          )}

          <SegmentField
            label="Dot style"
            value={options.dotStyle}
            items={dotStyles}
            onChange={(v) => onUpdateOptions("dotStyle", v)}
          />
          <SegmentField
            label="Corner style"
            value={options.cornerStyle}
            items={cornerStyles}
            onChange={(v) => onUpdateOptions("cornerStyle", v)}
          />
          <SegmentField
            label="Frame"
            value={options.frame}
            items={frames}
            onChange={(v) => onUpdateOptions("frame", v)}
          />
          {options.frame === "label" && (
            <Field label="Caption text">
              <input
                value={options.frameLabel}
                onChange={(e) => onUpdateOptions("frameLabel", e.target.value)}
                placeholder="Scan me"
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
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>256px</span>
              <span>2048px</span>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-2 py-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded-md border border-input cursor-pointer p-0.5 bg-transparent"
        />
        <span className="text-[11px] text-muted-foreground font-mono truncate">{value.toUpperCase()}</span>
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
      <div className="inline-flex w-full rounded-lg border border-border bg-secondary/50 p-1">
        {items.map((i) => (
          <button
            key={i.value}
            onClick={() => onChange(i.value)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              value === i.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
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
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-secondary/30 px-4 py-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
