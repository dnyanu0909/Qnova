-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- dynamic links
CREATE TABLE public.dynamic_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  short_code text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT 'Untitled campaign',
  destination_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  qr_options jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX dynamic_links_user_idx ON public.dynamic_links(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dynamic_links TO authenticated;
GRANT SELECT ON public.dynamic_links TO anon;
GRANT ALL ON public.dynamic_links TO service_role;
ALTER TABLE public.dynamic_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own links" ON public.dynamic_links FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can resolve active links" ON public.dynamic_links FOR SELECT TO anon, authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- scan events
CREATE TABLE public.scan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.dynamic_links(id) ON DELETE CASCADE,
  visitor_key text,
  device_type text,
  os text,
  browser text,
  referrer text,
  country text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX scan_events_link_idx ON public.scan_events(link_id, created_at DESC);
GRANT INSERT ON public.scan_events TO anon;
GRANT SELECT, INSERT ON public.scan_events TO authenticated;
GRANT ALL ON public.scan_events TO service_role;
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log a scan" ON public.scan_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Owners read own scans" ON public.scan_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dynamic_links l WHERE l.id = scan_events.link_id AND l.user_id = auth.uid()));

-- timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_links_updated BEFORE UPDATE ON public.dynamic_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- auto profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();