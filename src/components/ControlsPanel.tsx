import { QRData, QROptions, QRType } from "@/hooks/useQRGenerator";
import { QrCode, Globe, Wifi, Contact } from "lucide-react";

const qrTypes: { value: QRType; label: string; icon: React.ReactNode }[] = [
  { value: "url", label: "URL", icon: <Globe className="w-4 h-4" /> },
  { value: "text", label: "Text", icon: <QrCode className="w-4 h-4" /> },
  { value: "wifi", label: "WiFi", icon: <Wifi className="w-4 h-4" /> },
  { value: "contact", label: "Contact", icon: <Contact className="w-4 h-4" /> },
];

interface ControlsPanelProps {
  data: QRData;
  options: QROptions;
  isGenerating: boolean;
  onUpdateData: <K extends keyof QRData>(key: K, value: QRData[K]) => void;
  onUpdateOptions: <K extends keyof QROptions>(key: K, value: QROptions[K]) => void;
  onGenerate: () => void;
}

export default function ControlsPanel({
  data,
  options,
  isGenerating,
  onUpdateData,
  onUpdateOptions,
  onGenerate,
}: ControlsPanelProps) {
  return (
    <div className="glass-card p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Configure</h2>
        <p className="text-sm text-muted-foreground">Choose a type and fill in your content.</p>
      </div>

      {/* QR Type Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">QR Type</label>
        <div className="grid grid-cols-4 gap-2">
          {qrTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => onUpdateData("type", t.value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
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
      </div>

      {/* Dynamic Fields */}
      <div className="space-y-4">
        {data.type === "text" && (
          <FieldGroup label="Text Content">
            <textarea
              value={data.text}
              onChange={(e) => onUpdateData("text", e.target.value)}
              placeholder="Enter your text here..."
              rows={3}
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground input-focus resize-none"
            />
          </FieldGroup>
        )}

        {data.type === "url" && (
          <FieldGroup label="URL">
            <input
              type="url"
              value={data.url}
              onChange={(e) => onUpdateData("url", e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground input-focus"
            />
          </FieldGroup>
        )}

        {data.type === "wifi" && (
          <>
            <FieldGroup label="Network Name (SSID)">
              <input
                value={data.wifi.ssid}
                onChange={(e) => onUpdateData("wifi", { ...data.wifi, ssid: e.target.value })}
                placeholder="MyWiFiNetwork"
                className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground input-focus"
              />
            </FieldGroup>
            <FieldGroup label="Password">
              <input
                type="password"
                value={data.wifi.password}
                onChange={(e) => onUpdateData("wifi", { ...data.wifi, password: e.target.value })}
                placeholder="••••••••"
                className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground input-focus"
              />
            </FieldGroup>
            <FieldGroup label="Encryption">
              <select
                value={data.wifi.encryption}
                onChange={(e) => onUpdateData("wifi", { ...data.wifi, encryption: e.target.value as "WPA" | "WEP" | "nopass" })}
                className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground input-focus"
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">None</option>
              </select>
            </FieldGroup>
          </>
        )}

        {data.type === "contact" && (
          <>
            <FieldGroup label="Full Name">
              <input
                value={data.contact.name}
                onChange={(e) => onUpdateData("contact", { ...data.contact, name: e.target.value })}
                placeholder="John Doe"
                className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground input-focus"
              />
            </FieldGroup>
            <FieldGroup label="Phone">
              <input
                type="tel"
                value={data.contact.phone}
                onChange={(e) => onUpdateData("contact", { ...data.contact, phone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground input-focus"
              />
            </FieldGroup>
            <FieldGroup label="Email">
              <input
                type="email"
                value={data.contact.email}
                onChange={(e) => onUpdateData("contact", { ...data.contact, email: e.target.value })}
                placeholder="john@example.com"
                className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground input-focus"
              />
            </FieldGroup>
          </>
        )}
      </div>

      {/* Appearance */}
      <div className="border-t border-border pt-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Appearance</h3>

        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Foreground">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={options.fgColor}
                onChange={(e) => onUpdateOptions("fgColor", e.target.value)}
                className="w-10 h-10 rounded-lg border border-input cursor-pointer p-0.5"
              />
              <span className="text-xs text-muted-foreground font-mono">{options.fgColor}</span>
            </div>
          </FieldGroup>
          <FieldGroup label="Background">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={options.bgColor}
                onChange={(e) => onUpdateOptions("bgColor", e.target.value)}
                className="w-10 h-10 rounded-lg border border-input cursor-pointer p-0.5"
              />
              <span className="text-xs text-muted-foreground font-mono">{options.bgColor}</span>
            </div>
          </FieldGroup>
        </div>

        <FieldGroup label={`Size: ${options.size}px`}>
          <input
            type="range"
            min={150}
            max={600}
            step={50}
            value={options.size}
            onChange={(e) => onUpdateOptions("size", Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>150px</span>
            <span>600px</span>
          </div>
        </FieldGroup>

        <FieldGroup label="Logo (optional)">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onUpdateOptions("logoFile", e.target.files?.[0] ?? null)}
            className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90 file:cursor-pointer file:transition-opacity"
          />
        </FieldGroup>
      </div>

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full py-3.5 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Generating...
          </span>
        ) : (
          "Generate QR Code"
        )}
      </button>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}
