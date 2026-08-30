ALTER TABLE public.dynamic_links
  ADD COLUMN IF NOT EXISTS routing_rules jsonb NOT NULL DEFAULT '{"devices":{},"dayparts":[]}'::jsonb,
  ADD COLUMN IF NOT EXISTS gates jsonb NOT NULL DEFAULT '{"lead":false,"pin":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS access_pin text,
  ADD COLUMN IF NOT EXISTS max_scans integer,
  ADD COLUMN IF NOT EXISTS fallback_url text;

REVOKE SELECT ON public.dynamic_links FROM anon;
GRANT SELECT (id, short_code, title, destination_url, is_active, expires_at, qr_options, created_at, updated_at, routing_rules, gates, max_scans, fallback_url) ON public.dynamic_links TO anon;

CREATE OR REPLACE FUNCTION public.verify_link_pin(_short_code text, _pin text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dynamic_links
    WHERE short_code = _short_code
      AND access_pin IS NOT NULL
      AND access_pin = _pin
  )
$$;

GRANT EXECUTE ON FUNCTION public.verify_link_pin(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.link_scan_count(_link_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int FROM public.scan_events WHERE link_id = _link_id
$$;

GRANT EXECUTE ON FUNCTION public.link_scan_count(uuid) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.link_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.dynamic_links(id) ON DELETE CASCADE,
  name text,
  email text NOT NULL,
  device_type text,
  country text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.link_leads TO anon, authenticated;
GRANT SELECT ON public.link_leads TO authenticated;
GRANT ALL ON public.link_leads TO service_role;

ALTER TABLE public.link_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lead" ON public.link_leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Owners read own leads" ON public.link_leads
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.dynamic_links l WHERE l.id = link_leads.link_id AND l.user_id = auth.uid()
  ));