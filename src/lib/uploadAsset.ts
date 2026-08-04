import { supabase } from "@/integrations/supabase/client";

const BUCKET = "page-assets";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export async function uploadPageAsset(file: File): Promise<{ url: string; name: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage.from(BUCKET).createSignedUrl(path, TEN_YEARS);
  if (signError || !data?.signedUrl) throw signError ?? new Error("Could not create a link for that file.");
  return { url: data.signedUrl, name: file.name };
}
