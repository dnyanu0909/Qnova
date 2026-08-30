import { supabase } from "@/integrations/supabase/client";
import type { QrRenderOptions } from "@/lib/qrRender";

export interface DaypartRule {
  start: string;
  end: string;
  url: string;
}

export interface RoutingRules {
  devices?: { ios?: string; android?: string; desktop?: string };
  dayparts?: DaypartRule[];
}

export interface LinkGates {
  lead?: boolean;
  pin?: boolean;
}

export interface DynamicLink {
  id: string;
  user_id: string;
  short_code: string;
  title: string;
  destination_url: string;
  is_active: boolean;
  expires_at: string | null;
  qr_options: Partial<QrRenderOptions>;
  routing_rules: RoutingRules;
  gates: LinkGates;
  max_scans: number | null;
  fallback_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkLead {
  id: string;
  link_id: string;
  name: string | null;
  email: string;
  device_type: string | null;
  country: string | null;
  city: string | null;
  created_at: string;
}


export interface ScanEvent {
  id: string;
  link_id: string;
  visitor_key: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
  referrer: string | null;
  country: string | null;
  city: string | null;
  created_at: string;
}

const ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";

export function makeShortCode(len = 7) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function shortUrl(code: string) {
  return `${window.location.origin}/r/${code}`;
}

export function normalizeUrl(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function detectClient() {
  const ua = navigator.userAgent;
  const device = /iPad|Tablet/i.test(ua)
    ? "Tablet"
    : /iPhone|iPod/i.test(ua)
      ? "iOS"
      : /Android/i.test(ua)
        ? "Android"
        : "Desktop";
  const os = /Windows/i.test(ua)
    ? "Windows"
    : /Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)
      ? "macOS"
      : /Android/i.test(ua)
        ? "Android"
        : /iPhone|iPad|iPod/i.test(ua)
          ? "iOS"
          : /Linux/i.test(ua)
            ? "Linux"
            : "Other";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Safari\//.test(ua)
          ? "Safari"
          : /Firefox\//.test(ua)
            ? "Firefox"
            : "Other";
  return { device, os, browser };
}

function visitorKey() {
  const key = "qnova.visitor";
  let value = localStorage.getItem(key);
  if (!value) {
    value = makeShortCode(16);
    localStorage.setItem(key, value);
  }
  return value;
}

async function estimateLocation(): Promise<{ country: string | null; city: string | null }> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error("geo lookup failed");
    const json = await res.json();
    return { country: json.country_name ?? null, city: json.city ?? null };
  } catch {
    return { country: null, city: null };
  }
}

export async function resolveLink(code: string) {
  const { data, error } = await supabase
    .from("dynamic_links")
    .select("id, destination_url, title")
    .eq("short_code", code)
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function logScan(linkId: string) {
  const { device, os, browser } = detectClient();
  const geo = await estimateLocation();
  await supabase.from("scan_events").insert({
    link_id: linkId,
    visitor_key: visitorKey(),
    device_type: device,
    os,
    browser,
    referrer: document.referrer || null,
    country: geo.country,
    city: geo.city,
  });
}

export async function listLinks() {
  const { data, error } = await supabase
    .from("dynamic_links")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DynamicLink[];
}

export async function listScans(linkIds: string[]) {
  if (!linkIds.length) return [] as ScanEvent[];
  const { data, error } = await supabase
    .from("scan_events")
    .select("*")
    .in("link_id", linkIds)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as ScanEvent[];
}

export async function createLink(input: {
  userId: string;
  title: string;
  destinationUrl: string;
  qrOptions?: Partial<QrRenderOptions>;
}) {
  const { data, error } = await supabase
    .from("dynamic_links")
    .insert({
      user_id: input.userId,
      title: input.title.trim() || "Untitled campaign",
      destination_url: normalizeUrl(input.destinationUrl),
      short_code: makeShortCode(),
      qr_options: (input.qrOptions ?? {}) as never,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as DynamicLink;
}

export async function updateLink(id: string, patch: Partial<Pick<DynamicLink, "title" | "destination_url" | "is_active" | "expires_at">>) {
  const { data, error } = await supabase
    .from("dynamic_links")
    .update(patch as never)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as DynamicLink;
}

export async function deleteLink(id: string) {
  const { error } = await supabase.from("dynamic_links").delete().eq("id", id);
  if (error) throw error;
}