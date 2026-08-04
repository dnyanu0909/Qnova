import type { MicroPageForm } from "@/hooks/useMicroPage";

export interface GalleryEntry {
  id: string;
  slug: string;
  name: string;
  url: string;
  createdAt: number;
  form: MicroPageForm;
}

const KEY = "qnova-pages-v1";

export function readPages(): GalleryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as GalleryEntry[]) : [];
  } catch {
    return [];
  }
}

function writePages(entries: GalleryEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, 40)));
  } catch {
    /* storage full */
  }
}

export function savePage(slug: string, url: string, form: MicroPageForm): GalleryEntry[] {
  const entry: GalleryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    slug,
    url,
    name: form.fullName || "Untitled page",
    createdAt: Date.now(),
    form,
  };
  const next = [entry, ...readPages().filter((e) => e.slug !== slug)];
  writePages(next);
  return next;
}

export function removePage(id: string): GalleryEntry[] {
  const next = readPages().filter((e) => e.id !== id);
  writePages(next);
  return next;
}
