import { useState, useCallback } from "react";
import QRCode from "qrcode";

export type QRType = "text" | "url" | "wifi" | "contact";

export interface QRData {
  type: QRType;
  text: string;
  url: string;
  wifi: { ssid: string; password: string; encryption: "WPA" | "WEP" | "nopass" };
  contact: { name: string; phone: string; email: string };
}

export interface QROptions {
  fgColor: string;
  bgColor: string;
  size: number;
  logoFile: File | null;
}

const initialData: QRData = {
  type: "url",
  text: "",
  url: "",
  wifi: { ssid: "", password: "", encryption: "WPA" },
  contact: { name: "", phone: "", email: "" },
};

const initialOptions: QROptions = {
  fgColor: "#1e1b4b",
  bgColor: "#ffffff",
  size: 300,
  logoFile: null,
};

function buildQRString(data: QRData): string {
  switch (data.type) {
    case "text":
      return data.text;
    case "url":
      return data.url;
    case "wifi":
      return `WIFI:T:${data.wifi.encryption};S:${data.wifi.ssid};P:${data.wifi.password};;`;
    case "contact":
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${data.contact.name}\nTEL:${data.contact.phone}\nEMAIL:${data.contact.email}\nEND:VCARD`;
    default:
      return "";
  }
}

export function useQRGenerator() {
  const [data, setData] = useState<QRData>(initialData);
  const [options, setOptions] = useState<QROptions>(initialOptions);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");

  const updateData = useCallback(<K extends keyof QRData>(key: K, value: QRData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateOptions = useCallback(<K extends keyof QROptions>(key: K, value: QROptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  const generate = useCallback(async () => {
    const qrString = buildQRString(data);
    if (!qrString.trim()) {
      setError("Please fill in the required fields before generating.");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const canvas = document.createElement("canvas");
      await QRCode.toCanvas(canvas, qrString, {
        width: options.size,
        margin: 2,
        color: {
          dark: options.fgColor,
          light: options.bgColor,
        },
        errorCorrectionLevel: "H",
      });

      if (options.logoFile) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const img = new Image();
          const logoUrl = URL.createObjectURL(options.logoFile);
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              const logoSize = options.size * 0.2;
              const x = (canvas.width - logoSize) / 2;
              const y = (canvas.height - logoSize) / 2;
              ctx.fillStyle = options.bgColor;
              ctx.fillRect(x - 4, y - 4, logoSize + 8, logoSize + 8);
              ctx.drawImage(img, x, y, logoSize, logoSize);
              URL.revokeObjectURL(logoUrl);
              resolve();
            };
            img.onerror = reject;
            img.src = logoUrl;
          });
        }
      }

      setQrDataUrl(canvas.toDataURL("image/png"));
    } catch {
      setError("Failed to generate QR code. Please check your input.");
    } finally {
      setIsGenerating(false);
    }
  }, [data, options]);

  const download = useCallback(() => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `qr-code-${Date.now()}.png`;
    link.href = qrDataUrl;
    link.click();
  }, [qrDataUrl]);

  return {
    data,
    options,
    qrDataUrl,
    isGenerating,
    error,
    updateData,
    updateOptions,
    generate,
    download,
  };
}
