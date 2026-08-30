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

export type ResolvedLink = Pick<
  DynamicLink,
  "id" | "destination_url" | "title" | "is_active" | "expires_at" | "routing_rules" | "gates" | "max_scans" | "fallback_url"
>;

export async function resolveLink(code: string) {
  const { data, error } = await supabase
    .from("dynamic_links")
    .select("id, destination_url, title, is_active, expires_at, routing_rules, gates, max_scans, fallback_url")
    .eq("short_code", code)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as ResolvedLink | null;
}

function minutes(value: string) {
  const [h, m] = value.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h)) return null;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

/** Picks the destination for the current device / time of day. */
export function pickDestination(link: ResolvedLink, now = new Date()) {
  const rules = link.routing_rules ?? {};
  const { device } = detectClient();
  const devices = rules.devices ?? {};
  const key = device === "iOS" ? "ios" : device === "Android" ? "android" : device === "Tablet" ? "android" : "desktop";
  const byDevice = devices[key as "ios" | "android" | "desktop"];
  if (byDevice?.trim()) return { url: normalizeUrl(byDevice), reason: `device:${key}` };

  const current = now.getHours() * 60 + now.getMinutes();
  for (const part of rules.dayparts ?? []) {
    if (!part?.url?.trim()) continue;
    const start = minutes(part.start ?? "");
    const end = minutes(part.end ?? "");
    if (start === null || end === null) continue;
    const active = start <= end ? current >= start && current < end : current >= start || current < end;
    if (active) return { url: normalizeUrl(part.url), reason: `time:${part.start}-${part.end}` };
  }

  return { url: link.destination_url, reason: "default" };
}

export async function scanCount(linkId: string) {
  const { data, error } = await supabase.rpc("link_scan_count", { _link_id: linkId });
  if (error) return 0;
  return (data as number) ?? 0;
}

export async function verifyPin(shortCode: string, pin: string) {
  const { data, error } = await supabase.rpc("verify_link_pin", { _short_code: shortCode, _pin: pin });
  if (error) throw error;
  return Boolean(data);
}

export async function captureLead(input: { linkId: string; name: string; email: string }) {
  const { device } = detectClient();
  const { error } = await supabase.from("link_leads").insert({
    link_id: input.linkId,
    name: input.name.trim() || null,
    email: input.email.trim(),
    device_type: device,
  } as never);
  if (error) throw error;
}

export async function listLeads(linkIds: string[]) {
  if (!linkIds.length) return [] as LinkLead[];
  const { data, error } = await supabase
    .from("link_leads")
    .select("*")
    .in("link_id", linkIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LinkLead[];
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