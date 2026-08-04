import { useCallback, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MicroPageButton {
  label: string;
  url: string;
  [key: string]: string;
}

export interface MicroPageSocials {
  github: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  [key: string]: string;
}

export interface MicroPageForm {
  fullName: string;
  headline: string;
  bio: string;
  avatarDataUrl: string;
  logoUrl: string;
  attachmentUrl: string;
  attachmentName: string;
  phone: string;
  email: string;
  accent: string;
  socials: MicroPageSocials;
  buttons: MicroPageButton[];
}

export const emptyMicroPage: MicroPageForm = {
  fullName: "",
  headline: "",
  bio: "",
  avatarDataUrl: "",
  logoUrl: "",
  attachmentUrl: "",
  attachmentName: "",
  phone: "",
  email: "",
  accent: "#6366f1",
  socials: { github: "", linkedin: "", twitter: "", instagram: "" },
  buttons: [],
};

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "card"}-${suffix}`;
}

export function useMicroPage() {
  const [form, setForm] = useState<MicroPageForm>(emptyMicroPage);
  const [slug, setSlug] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");

  const update = useCallback(<K extends keyof MicroPageForm>(key: K, value: MicroPageForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSlug("");
  }, []);

  const restoreForm = useCallback((next: MicroPageForm) => {
    setForm({ ...emptyMicroPage, ...next });
    setSlug("");
  }, []);

  const updateSocial = useCallback((key: keyof MicroPageSocials, value: string) => {
    setForm((prev) => ({ ...prev, socials: { ...prev.socials, [key]: value } }));
    setSlug("");
  }, []);

  const addButton = useCallback(() => {
    setForm((prev) => ({ ...prev, buttons: [...prev.buttons, { label: "", url: "" }] }));
  }, []);

  const updateButton = useCallback((index: number, patch: Partial<MicroPageButton>) => {
    setForm((prev) => ({
      ...prev,
      buttons: prev.buttons.map((b, i) => (i === index ? { ...b, ...patch } : b)),
    }));
    setSlug("");
  }, []);

  const removeButton = useCallback((index: number) => {
    setForm((prev) => ({ ...prev, buttons: prev.buttons.filter((_, i) => i !== index) }));
    setSlug("");
  }, []);

  const pageUrl = useMemo(
    () => (slug ? `${window.location.origin}/p/${slug}` : ""),
    [slug],
  );

  const publish = useCallback(async () => {
    if (!form.fullName.trim()) {
      setError("Please add a full name before publishing.");
      return null;
    }
    setError("");
    setIsPublishing(true);
    try {
      const newSlug = slugify(form.fullName);
      const { error: insertError } = await supabase.from("micro_pages").insert({
        slug: newSlug,
        full_name: form.fullName.trim(),
        headline: form.headline.trim() || null,
        bio: form.bio.trim() || null,
        avatar_url: form.avatarDataUrl || null,
        logo_url: form.logoUrl || null,
        attachment_url: form.attachmentUrl || null,
        attachment_name: form.attachmentName || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        accent: form.accent,
        socials: form.socials,
        buttons: form.buttons.filter((b) => b.label.trim() && b.url.trim()),
      });
      if (insertError) throw insertError;
      setSlug(newSlug);
      return newSlug;
    } catch {
      setError("Could not publish your page. Please try again.");
      return null;
    } finally {
      setIsPublishing(false);
    }
  }, [form]);

  return {
    form,
    slug,
    pageUrl,
    isPublishing,
    error,
    update,
    restoreForm,
    updateSocial,
    addButton,
    updateButton,
    removeButton,
    publish,
  };
}