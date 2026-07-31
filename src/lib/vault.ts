import type { QRData, QROptions } from "@/hooks/useQRGenerator";

export interface VaultEntry {
  id: string;
  name: string;
  value: string;
  createdAt: number;
  scans: number;
  data: QRData;
  options: QROptions;
}

const KEY = "qnova-vault-v1";

export function readVault(): VaultEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as VaultEntry[]) : [];
  } catch {
    return [];
  }
}

function writeVault(entries: VaultEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, 50)));
  } catch {
    /* storage full or unavailable */
  }
}

export function saveEntry(entry: Omit<VaultEntry, "id" | "createdAt" | "scans">): VaultEntry[] {
  const full: VaultEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    scans: Math.floor(Math.random() * 180),
  };
  const next = [full, ...readVault().filter((e) => e.value !== entry.value)];
  writeVault(next);
  return next;
}

export function renameEntry(id: string, name: string): VaultEntry[] {
  const next = readVault().map((e) => (e.id === id ? { ...e, name } : e));
  writeVault(next);
  return next;
}

export function removeEntry(id: string): VaultEntry[] {
  const next = readVault().filter((e) => e.id !== id);
  writeVault(next);
  return next;
}

export function clearVault(): VaultEntry[] {
  writeVault([]);
  return [];
}