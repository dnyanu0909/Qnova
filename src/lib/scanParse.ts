export type ScanKind = "url" | "wifi" | "vcard" | "email" | "phone" | "text";

export interface ScanWifi {
  ssid: string;
  password: string;
  encryption: string;
  hidden: boolean;
}

export interface ScanResult {
  raw: string;
  kind: ScanKind;
  label: string;
  url?: string;
  wifi?: ScanWifi;
  vcard?: { name: string; phone: string; email: string; title: string };
}

function parseWifi(raw: string): ScanWifi {
  const get = (key: string) => {
    const m = raw.match(new RegExp(`(?:^|;)${key}:((?:\\\\.|[^;])*)`, "i"));
    return m ? m[1].replace(/\\(.)/g, "$1") : "";
  };
  return {
    ssid: get("S"),
    password: get("P"),
    encryption: get("T") || "nopass",
    hidden: /(?:^|;)H:true/i.test(raw),
  };
}

function parseVcard(raw: string) {
  const line = (key: string) => {
    const m = raw.match(new RegExp(`^${key}[^:\\n]*:(.*)$`, "im"));
    return m ? m[1].trim() : "";
  };
  return {
    name: line("FN") || line("N"),
    phone: line("TEL"),
    email: line("EMAIL"),
    title: line("TITLE"),
  };
}

export function parseScan(raw: string): ScanResult {
  const value = raw.trim();

  if (/^WIFI:/i.test(value)) {
    const wifi = parseWifi(value);
    return { raw: value, kind: "wifi", label: `Wi-Fi network “${wifi.ssid || "unknown"}”`, wifi };
  }

  if (/^BEGIN:VCARD/i.test(value)) {
    const vcard = parseVcard(value);
    return { raw: value, kind: "vcard", label: vcard.name ? `Contact card — ${vcard.name}` : "Contact card", vcard };
  }

  if (/^mailto:/i.test(value)) {
    return { raw: value, kind: "email", label: "Email address", url: value };
  }

  if (/^tel:/i.test(value)) {
    return { raw: value, kind: "phone", label: "Phone number", url: value };
  }

  if (/^https?:\/\//i.test(value)) {
    return { raw: value, kind: "url", label: "Website link", url: value };
  }

  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(value)) {
    return { raw: value, kind: "url", label: "Website link", url: `https://${value}` };
  }

  return { raw: value, kind: "text", label: "Plain text", url: undefined };
}

export function vcardToFile(raw: string, name: string) {
  const blob = new Blob([raw], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(name || "contact").replace(/\s+/g, "-").toLowerCase()}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}
