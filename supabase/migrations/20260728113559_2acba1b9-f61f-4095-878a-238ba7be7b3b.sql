CREATE TABLE public.micro_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  full_name text NOT NULL,
  headline text,
  bio text,
  avatar_url text,
  phone text,
  email text,
  socials jsonb NOT NULL DEFAULT '{}'::jsonb,
  buttons jsonb NOT NULL DEFAULT '[]'::jsonb,
  accent text NOT NULL DEFAULT '#6366f1',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.micro_pages TO anon;
GRANT SELECT, INSERT ON public.micro_pages TO authenticated;
GRANT ALL ON public.micro_pages TO service_role;

ALTER TABLE public.micro_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Micro pages are publicly viewable"
  ON public.micro_pages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create a micro page"
  ON public.micro_pages FOR INSERT
  WITH CHECK (true);

CREATE INDEX micro_pages_slug_idx ON public.micro_pages (slug);