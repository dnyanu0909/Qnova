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
import SaveDynamicLink from "@/components/SaveDynamicLink";
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
  const dynamicDestination =
    data.type === "url"
      ? data.url
      : data.type === "pdf"
        ? data.pdf.url
        : data.type === "menu"
          ? data.menu.url
          : data.type === "social"
            ? (data.social.links.find((l) => l.url.trim())?.url ?? "")
            : "";
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
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <QrCode className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight">QNova</span>
            <span className="label-tech hidden md:block border-l border-border pl-2.5">PRECISION QR STUDIO</span>
          </div>
          <div className="flex items-center gap-3">

            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-foreground hover:border-primary/50 active:scale-[0.98] transition-all"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <button
              onClick={() => setScanOpen(true)}
              className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-foreground hover:border-primary/50 active:scale-[0.98] transition-all"
            >
              <ScanLine className="w-3.5 h-3.5" /> Scan QR
            </button>
            <VaultDrawer entries={vault} onEntriesChange={setVault} onRestore={restore} />
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-8 h-8 rounded-md border border-border bg-background/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
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
            {mode === "qr" ? "Precision QR Studio" : mode === "card" ? "Digital Contact / Link-in-Bio" : "Batch QR Production"}
          </h1>
          <p className="mt-2 text-muted-foreground text-base lg:text-lg max-w-lg mx-auto">
            {mode === "qr"
              ? "Pick a preset, build the destination live, and export a scan-proof QR code in seconds."
              : mode === "card"
                ? "Build a sleek micro-landing page and share it with a single scannable QR code."
                : "Upload a CSV and generate a whole batch of styled QR codes in one go."}
          </p>

          <div className="mt-6 inline-flex rounded-full border border-border bg-secondary/50 p-0.5">
            <button
              onClick={() => setMode("qr")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-all active:scale-[0.98] ${
                mode === "qr" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <QrCode className="w-4 h-4" />
              QR Codes
            </button>
            <button
              onClick={() => setMode("card")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-all active:scale-[0.98] ${
                mode === "card" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IdCard className="w-4 h-4" />
              Digital Contact / Link-in-Bio
            </button>
            <button
              onClick={() => setMode("batch")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-all active:scale-[0.98] ${
                mode === "batch" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
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
              <div className="glass-card p-5 sm:p-6 flex justify-center">
                <DestinationPreview data={data} />
              </div>

              <PreviewPanel
                previewUrl={previewUrl}
                svg={svg}
                content={value}
                label={vaultLabel?.trim() || "QNova QR code"}
                fgColor={options.fgColor}
                bgColor={options.bgColor}
                exportSize={exportSize}
                highRes={options.highRes}
                error={error}
                shield={shield} />

              <button
                onClick={saveToVault}
                disabled={!svg}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border bg-card text-foreground font-semibold text-[11px] uppercase tracking-wide hover:border-primary/50 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                <Archive className="w-4 h-4" /> Save to Vault
              </button>

              {dynamicDestination.trim() && (
                <SaveDynamicLink
                  destinationUrl={dynamicDestination}
                  title={vaultLabel?.trim() || "Untitled campaign"}
                  options={options}
                />
              )}
            </div>
          </div>

          <PrintStudio previewUrl={previewUrl} svg={svg} label={vaultLabel} />
        </div>
        )}
      </main>

      <footer className="border-t border-border py-6 px-4">
        <p className="metric text-[10px] tracking-wide text-center text-muted-foreground max-w-2xl mx-auto">
          <span className="text-primary">●</span> Built with offline-first ISO/IEC 15415 standards. Static codes generated on QNova are permanent and never expire.
        </p>
      </footer>

      <ScannerModal open={scanOpen} onOpenChange={setScanOpen} />
    </div>);

};

export default Index;