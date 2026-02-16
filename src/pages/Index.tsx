import { useQRGenerator } from "@/hooks/useQRGenerator";
import ControlsPanel from "@/components/ControlsPanel";
import PreviewPanel from "@/components/PreviewPanel";
import { QrCode, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

const Index = () => {
  const {
    data,
    options,
    qrDataUrl,
    isGenerating,
    error,
    updateData,
    updateOptions,
    generate,
    download
  } = useQRGenerator();
  const { theme, setTheme } = useTheme();

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
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
            Generate QR Codes
          </h1>
          <p className="mt-2 text-muted-foreground text-base lg:text-lg max-w-lg mx-auto">
            Create customizable QR codes for URLs, text, WiFi, and contacts in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <ControlsPanel
            data={data}
            options={options}
            isGenerating={isGenerating}
            onUpdateData={updateData}
            onUpdateOptions={updateOptions}
            onGenerate={generate} />

          <PreviewPanel
            qrDataUrl={qrDataUrl}
            error={error}
            onDownload={download} />

        </div>
      </main>
    </div>);

};

export default Index;