import { useQRGenerator } from "@/hooks/useQRGenerator";
import ControlsPanel from "@/components/ControlsPanel";
import PreviewPanel from "@/components/PreviewPanel";
import MicroCardStudio from "@/components/microcard/MicroCardStudio";
import PresetBar from "@/components/PresetBar";
import DestinationPreview from "@/components/DestinationPreview";
import BatchMode from "@/components/BatchMode";
import VaultDrawer from "@/components/VaultDrawer";
import ScannerModal from "@/components/ScannerModal";
import PrintStudio from "@/components/PrintStudio";
import Hero from "@/components/landing/Hero";
import FeatureShowcase from "@/components/landing/FeatureShowcase";
import TemplateGallery, { type GalleryTemplate } from "@/components/landing/TemplateGallery";
import { buildQRString } from "@/hooks/useQRGenerator";
import { readVault, saveEntry, type VaultEntry } from "@/lib/vault";
import { QrCode, Sun, Moon, IdCard, Layers, Archive, ScanLine } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Mode = "qr" | "card" | "batch";

const Index = () => {
  const {
    data,
    options,
    templateId,
    svg,
    previewUrl,
    exportSize,
    error,
    shield,
    updateData,
    updateOptions,
    applyTemplate,
    restore
  } = useQRGenerator();
  const { theme, setTheme } = useTheme();
  const [mode, setMode] = useState<Mode>("qr");
  const [vault, setVault] = useState<VaultEntry[]>([]);
  const [scanOpen, setScanOpen] = useState(false);

  const scrollToStudio = () => {
    document.getElementById("studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const applyGalleryTemplate = (tpl: GalleryTemplate) => {
    restore(tpl.data, tpl.options);
    setMode("qr");
    toast.success(`${tpl.label} template loaded`);
    setTimeout(scrollToStudio, 60);
  };

  useEffect(() => {
    setVault(readVault());
  }, []);

  const value = buildQRString(data);
  const vaultLabel =
    data.type === "contact"
      ? data.contact.name
      : data.type === "menu"
        ? data.menu.restaurant
        : data.type === "wifi"
          ? data.wifi.ssid
          : data.type === "pdf"
            ? data.pdf.title
            : data.type === "social"
              ? data.social.handle
              : data.url;

  const saveToVault = () => {
    if (!svg) return;
    setVault(saveEntry({ name: vaultLabel?.trim() || `${data.type} code`, value, data, options }));
    toast.success("Saved to My Vault");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <QrCode className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight">QNova</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">Fast & personalised QR codes</span>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <button
              onClick={() => setScanOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <ScanLine className="w-3.5 h-3.5" /> Scan QR
            </button>
            <VaultDrawer entries={vault} onEntriesChange={setVault} onRestore={restore} />
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle dark mode"
            >
              <Sun className="w-4 h-4 hidden dark:block" />
              <Moon className="w-4 h-4 block dark:hidden" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div className="space-y-16 lg:space-y-20 mb-16 lg:mb-20">
          <Hero onStart={scrollToStudio} />
          <FeatureShowcase />
          <TemplateGallery onApply={applyGalleryTemplate} />
        </div>

        <div id="studio" className="text-center mb-8 lg:mb-12 scroll-mt-24">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
            {mode === "qr" ? "Generate QR Codes" : mode === "card" ? "Digital Contact / Link-in-Bio" : "Batch QR Production"}
          </h1>
          <p className="mt-2 text-muted-foreground text-base lg:text-lg max-w-lg mx-auto">
            {mode === "qr"
              ? "Pick a preset, build the destination live, and export a scan-proof QR code in seconds."
              : mode === "card"
                ? "Build a sleek micro-landing page and share it with a single scannable QR code."
                : "Upload a CSV and generate a whole batch of styled QR codes in one go."}
          </p>

          <div className="mt-6 inline-flex rounded-xl border border-border bg-card p-1">
            <button
              onClick={() => setMode("qr")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "qr" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <QrCode className="w-4 h-4" />
              QR Codes
            </button>
            <button
              onClick={() => setMode("card")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "card" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IdCard className="w-4 h-4" />
              Digital Contact / Link-in-Bio
            </button>
            <button
              onClick={() => setMode("batch")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "batch" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-4 h-4" />
              Batch Mode
            </button>
          </div>
        </div>

        {mode === "batch" ? (
          <BatchMode options={options} />
        ) : mode === "card" ? (
          <MicroCardStudio />
        ) : (
        <div className="space-y-6 lg:space-y-8">
          <PresetBar value={data.type} onChange={(v) => updateData("type", v)} />

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] gap-6 lg:gap-8 items-start">
            <ControlsPanel
              data={data}
              options={options}
              templateId={templateId}
              onUpdateData={updateData}
              onUpdateOptions={updateOptions}
              onApplyTemplate={applyTemplate} />

            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="glass-card p-5 sm:p-6 lg:p-8 flex justify-center">
                <DestinationPreview data={data} />
              </div>

              <PreviewPanel
                previewUrl={previewUrl}
                svg={svg}
                exportSize={exportSize}
                highRes={options.highRes}
                error={error}
                shield={shield} />

              <button
                onClick={saveToVault}
                disabled={!svg}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-secondary transition-colors disabled:opacity-40"
              >
                <Archive className="w-4 h-4" /> Save to Vault
              </button>
            </div>
          </div>

          <PrintStudio previewUrl={previewUrl} svg={svg} label={vaultLabel} />
        </div>
        )}
      </main>

      <ScannerModal open={scanOpen} onOpenChange={setScanOpen} />
    </div>);

};

export default Index;